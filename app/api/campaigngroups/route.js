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

    const allGroups = [];

    const end = new Date();
    const start = new Date(Date.now() - 90 * 86400000);
    const fmt = d => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
    const s = fmt(start); const e = fmt(end);
    const dateRangeParam = `dateRange=(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;

    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

      // Get campaign group IDs via analytics pivot
      const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN_GROUP&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=impressions,pivotValues`;
      console.log('Fetching campaign groups:', url);

      const res = await fetch(url, { headers });
      console.log('Campaign groups status:', res.status);

      if (!res.ok) {
        console.error('Campaign groups failed:', await res.text());
        continue;
      }

      const data = await res.json();
      console.log('Campaign group elements:', data.elements?.length);

      (data.elements || []).forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          const id = parseInt(urn.split(':').pop());
          if (!allGroups.find(g => g.id === id)) {
            allGroups.push({ id, name: `Campaign Group ${id}`, accountId });
          }
        }
      });
    }

    // Fetch real names
    await Promise.all(
      allGroups.map(async (g, i) => {
        const res = await fetch(`https://api.linkedin.com/rest/adCampaignGroups/${g.id}`, { headers });
        if (res.ok) {
          const detail = await res.json();
          if (detail.name) allGroups[i].name = detail.name;
          allGroups[i].status = detail.status || 'ACTIVE';
        }
      })
    );

    console.log('Total campaign groups:', allGroups.length);
    return NextResponse.json(allGroups);

  } catch (error) {
    console.error('Campaign groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}