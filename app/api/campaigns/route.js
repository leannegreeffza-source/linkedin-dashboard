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

    const end = new Date();
    const start = new Date(Date.now() - 90 * 86400000);
    const fmt = d => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
    const s = fmt(start);
    const e = fmt(end);
    const dateRangeParam = `dateRange=(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;

    // Step 1: Get campaign IDs from analytics pivot
    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);
      const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=impressions,pivotValues`;

      const res = await fetch(url, { headers });
      if (!res.ok) { console.error('Analytics failed:', await res.text()); continue; }

      const data = await res.json();
      console.log('Campaign IDs found:', data.elements?.length);

      (data.elements || []).forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          const id = parseInt(urn.split(':').pop());
          if (!allCampaigns.find(c => c.id === id)) {
            allCampaigns.push({ id, name: `Campaign ${id}`, accountId, status: 'ACTIVE' });
          }
        }
      });
    }

    // Step 2: Fetch real names for each campaign ID
    // Try both REST and v2 endpoints
    await Promise.all(
      allCampaigns.map(async (c, i) => {
        // Try new REST endpoint first
        let res = await fetch(`https://api.linkedin.com/rest/adCampaigns/${c.id}`, { headers });

        // Fallback to v2 if REST fails
        if (!res.ok) {
          const v2Headers = {
            'Authorization': `Bearer ${token.accessToken}`,
            'X-RestLi-Protocol-Version': '2.0.0',
          };
          res = await fetch(`https://api.linkedin.com/v2/adCampaignsV2/${c.id}`, { headers: v2Headers });
        }

        if (res.ok) {
          const detail = await res.json();
          const name = detail.name || detail.campaignName || null;
          if (name) {
            allCampaigns[i].name = name;
            allCampaigns[i].status = detail.status || 'ACTIVE';
          }
          console.log(`Campaign ${c.id} name: ${allCampaigns[i].name}`);
        } else {
          console.error(`Could not fetch name for campaign ${c.id}:`, res.status);
        }
      })
    );

    console.log('Total campaigns with names:', allCampaigns.length);
    return NextResponse.json(allCampaigns);

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}