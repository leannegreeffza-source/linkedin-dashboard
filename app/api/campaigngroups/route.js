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

    const allGroups = [];

    for (const accountId of accountIds) {
      const accountUrn = `urn:li:sponsoredAccount:${accountId}`;

      // Method 1: Fetch groups directly via list endpoint (most reliable)
      const listUrl = `https://api.linkedin.com/rest/adCampaignGroups?q=search&search.account.values[0]=${encodeURIComponent(accountUrn)}&count=100&fields=id,name,status`;
      const listRes = await fetch(listUrl, { headers: restHeaders });

      if (listRes.ok) {
        const listData = await listRes.json();
        (listData.elements || []).forEach(g => {
          if (!allGroups.find(x => x.id === g.id)) {
            allGroups.push({ id: g.id, name: g.name || `Campaign Group ${g.id}`, accountId, status: g.status || 'ACTIVE' });
          }
        });
        console.log(`Fetched ${listData.elements?.length} groups via list for account ${accountId}`);
        continue; // skip analytics pivot if list worked
      }

      console.log(`List endpoint failed (${listRes.status}), falling back to analytics pivot`);

      // Method 2: Fallback — get IDs via analytics pivot then fetch names
      const end = new Date();
      const start = new Date(Date.now() - 90 * 86400000);
      const fmt = d => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
      const s = fmt(start); const e = fmt(end);
      const dateRangeParam = `dateRange=(start:(year:${s.year},month:${s.month},day:${s.day}),end:(year:${e.year},month:${e.month},day:${e.day}))`;
      const accountUrn2 = encodeURIComponent(accountUrn);
      const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN_GROUP&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn2})&fields=impressions,pivotValues`;
      const analyticsRes = await fetch(analyticsUrl, { headers: restHeaders });

      if (!analyticsRes.ok) {
        console.error('Analytics pivot failed:', await analyticsRes.text());
        continue;
      }

      const analyticsData = await analyticsRes.json();
      const ids = [];
      (analyticsData.elements || []).forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          const id = parseInt(urn.split(':').pop());
          if (!allGroups.find(g => g.id === id)) {
            allGroups.push({ id, name: `Campaign Group ${id}`, accountId });
            ids.push(id);
          }
        }
      });

      // Fetch real names for each group ID — try REST then v2
      await Promise.all(ids.map(async id => {
        const idx = allGroups.findIndex(g => g.id === id);
        if (idx === -1) return;

        // Try REST endpoint
        let res = await fetch(`https://api.linkedin.com/rest/adCampaignGroups/${id}`, { headers: restHeaders });

        // Fallback to v2
        if (!res.ok) {
          res = await fetch(`https://api.linkedin.com/v2/adCampaignGroupsV2/${id}`, { headers: v2Headers });
        }

        if (res.ok) {
          const detail = await res.json();
          const name = detail.name || detail.campaignGroupName || null;
          if (name) {
            allGroups[idx].name = name;
            allGroups[idx].status = detail.status || 'ACTIVE';
          }
        }
        console.log(`Group ${id} name: ${allGroups[idx]?.name}`);
      }));
    }

    console.log('Total campaign groups:', allGroups.length);
    return NextResponse.json(allGroups);

  } catch (error) {
    console.error('Campaign groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}