import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'accounts';
    const accountIds = searchParams.get('accountIds');
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    // MODE 1: Just fetch account list (fast)
    if (mode === 'accounts') {
      let allAccounts = [];
      let start = 0;
      const pageSize = 100;

      while (allAccounts.length < 2000) {
        const res = await fetch(
          `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
          { headers: getHeaders(token.accessToken) }
        );
        if (!res.ok) break;
        const data = await res.json();
        const elements = data.elements || [];
        allAccounts = [...allAccounts, ...elements];
        if (elements.length < pageSize) break;
        start += pageSize;
      }

      const accounts = allAccounts.map(a => ({
        clientId: a.id,
        clientName: a.name || `Account ${a.id}`,
        campaigns: [],
      }));

      return NextResponse.json(accounts);
    }

    // MODE 2: Fetch campaigns + analytics for specific accounts
    if (mode === 'campaigns' && accountIds) {
      const ids = accountIds.split(',').filter(Boolean);
      const [sy, sm, sd] = startDate.split('-');
      const [ey, em, ed] = endDate.split('-');

      const results = await Promise.all(
        ids.map(async (accountId) => {
          try {
            // Fetch campaigns - try without encoding first
            const campaignUrl = `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(urn:li:sponsoredAccount:${accountId})))&pageSize=100`;
            const campaignRes = await fetch(campaignUrl, { headers: getHeaders(token.accessToken) });

            if (!campaignRes.ok) {
              const err = await campaignRes.text();
              console.error(`Campaign error for ${accountId}:`, err);
              return { accountId, campaigns: [] };
            }

            const campaignData = await campaignRes.json();
            const campaignElements = campaignData.elements || [];

            if (campaignElements.length === 0) {
              return { accountId, campaigns: [] };
            }

            // Fetch analytics for all campaigns at once
            const campaignUrns = campaignElements
              .map(c => `urn:li:sponsoredCampaign:${c.id}`)
              .join(',');

            const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))&campaigns=List(${campaignUrns})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,pivotValues`;

            const analyticsRes = await fetch(analyticsUrl, { headers: getHeaders(token.accessToken) });

            let analyticsMap = {};
            if (analyticsRes.ok) {
              const analyticsData = await analyticsRes.json();
              (analyticsData.elements || []).forEach(el => {
                const urn = el.pivotValues?.[0];
                if (urn) {
                  if (!analyticsMap[urn]) analyticsMap[urn] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
                  analyticsMap[urn].impressions += el.impressions || 0;
                  analyticsMap[urn].clicks += el.clicks || 0;
                  analyticsMap[urn].spend += parseFloat(el.costInLocalCurrency || 0);
                  analyticsMap[urn].conversions += el.externalWebsiteConversions || 0;
                }
              });
            }

            const campaigns = campaignElements.map(c => {
              const urn = `urn:li:sponsoredCampaign:${c.id}`;
              const a = analyticsMap[urn] || { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
              return {
                name: c.name || 'Unnamed Campaign',
                status: c.status || 'UNKNOWN',
                impressions: a.impressions,
                clicks: a.clicks,
                spend: parseFloat(a.spend.toFixed(2)),
                conversions: a.conversions,
                ctr: a.impressions > 0 ? parseFloat((a.clicks / a.impressions * 100).toFixed(2)) : 0,
                cpc: a.clicks > 0 ? parseFloat((a.spend / a.clicks).toFixed(2)) : 0,
              };
            });

            return { accountId, campaigns };
          } catch (err) {
            console.error(`Error for account ${accountId}:`, err.message);
            return { accountId, campaigns: [] };
          }
        })
      );

      return NextResponse.json(results);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getHeaders(accessToken) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Linkedin-Version': '202504',
    'X-RestLi-Protocol-Version': '2.0.0',
  };
}

function getDefaultStartDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}
