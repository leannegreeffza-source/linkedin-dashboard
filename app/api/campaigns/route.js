import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountIds } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const allCampaigns = [];

    // Get date range covering last 90 days to capture active campaigns
    const end = new Date();
    const start = new Date(Date.now() - 90 * 86400000);
    const fmt = d => ({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    });
    const s = fmt(start);
    const e = fmt(end);
    const dateRangeParam = `dateRange=(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;

    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

      // Use analytics endpoint pivoted by CAMPAIGN — this works and returns campaign IDs
      const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=impressions,pivotValues`;
      console.log('Fetching campaigns via analytics:', url);

      const res = await fetch(url, { headers });
      console.log('Status:', res.status);

      if (!res.ok) {
        console.error('Failed:', await res.text());
        continue;
      }

      const data = await res.json();
      console.log('Campaign elements:', data.elements?.length);

      (data.elements || []).forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          const id = parseInt(urn.split(':').pop());
          if (!allCampaigns.find(c => c.id === id)) {
            allCampaigns.push({
              id,
              name: `Campaign ${id}`,
              accountId,
              status: 'ACTIVE',
            });
          }
        }
      });
    }

    // Now try to get campaign names using direct ID lookup
    const campaignDetails = await Promise.allSettled(
      allCampaigns.map(async (c) => {
        const url = `https://api.linkedin.com/rest/adCampaigns/${c.id}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          return { id: c.id, name: data.name || `Campaign ${c.id}`, accountId: c.accountId, status: data.status };
        }
        return c;
      })
    );

    const finalCampaigns = campaignDetails.map((result, i) =>
      result.status === 'fulfilled' ? result.value : allCampaigns[i]
    );

    console.log('Total campaigns:', finalCampaigns.length);
    return NextResponse.json(finalCampaigns);

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}