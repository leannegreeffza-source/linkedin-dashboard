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

    const restHeaders = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };
    const v2Headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const allCampaigns = [];

    for (const accountId of accountIds) {
      const accountUrn = `urn:li:sponsoredAccount:${accountId}`;

      // Method 1: Fetch campaigns directly via list endpoint
      const listUrl = `https://api.linkedin.com/rest/adCampaigns?q=search&search.account.values[0]=${encodeURIComponent(accountUrn)}&count=100&fields=id,name,status,objectiveType`;
      const listRes = await fetch(listUrl, { headers: restHeaders });

      if (listRes.ok) {
        const listData = await listRes.json();
        (listData.elements || []).forEach(c => {
          if (!allCampaigns.find(x => x.id === c.id)) {
            allCampaigns.push({
              id: c.id,
              name: c.name || `Campaign ${c.id}`,
              accountId,
              status: c.status || 'ACTIVE',
              objectiveType: c.objectiveType || '',
            });
          }
        });
        console.log(`Fetched ${listData.elements?.length} campaigns via list for account ${accountId}`);
        continue;
      }

      console.log(`List endpoint failed (${listRes.status}), falling back to analytics pivot`);

      // Method 2: Fallback via analytics pivot
      const end = new Date();
      const start = new Date(Date.now() - 90 * 86400000);
      const fmt = d => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
      const s = fmt(start); const e = fmt(end);
      const dateRangeParam = `dateRange=(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;
      const accountUrn2 = encodeURIComponent(accountUrn);
      const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn2})&fields=impressions,pivotValues`;
      const res = await fetch(url, { headers: restHeaders });
      if (!res.ok) { console.error('Analytics failed:', await res.text()); continue; }

      const data = await res.json();
      const ids = [];
      (data.elements || []).forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          const id = parseInt(urn.split(':').pop());
          if (!allCampaigns.find(c => c.id === id)) {
            allCampaigns.push({ id, name: `Campaign ${id}`, accountId, status: 'ACTIVE' });
            ids.push(id);
          }
        }
      });

      // Fetch names
      await Promise.all(ids.map(async id => {
        const idx = allCampaigns.findIndex(c => c.id === id);
        if (idx === -1) return;

        let res = await fetch(`https://api.linkedin.com/rest/adCampaigns/${id}`, { headers: restHeaders });
        if (!res.ok) {
          res = await fetch(`https://api.linkedin.com/v2/adCampaignsV2/${id}`, { headers: v2Headers });
        }
        if (res.ok) {
          const detail = await res.json();
          const name = detail.name || detail.campaignName || null;
          if (name) {
            allCampaigns[idx].name = name;
            allCampaigns[idx].status = detail.status || 'ACTIVE';
            allCampaigns[idx].objectiveType = detail.objectiveType || '';
          }
        }
      }));
    }

    return NextResponse.json(allCampaigns);

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}