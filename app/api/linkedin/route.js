import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || !token.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    // Fetch ALL ad accounts with pagination
    let allAccounts = [];
    let start = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const accountsResponse = await fetch(
        `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
        {
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Linkedin-Version': '202504',
            'X-RestLi-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!accountsResponse.ok) {
        console.error('Accounts API error:', await accountsResponse.text());
        break;
      }

      const accountsData = await accountsResponse.json();
      const elements = accountsData.elements || [];
      allAccounts = [...allAccounts, ...elements];

      if (elements.length < pageSize) {
        hasMore = false;
      } else {
        start += pageSize;
      }

      // Safety limit
      if (allAccounts.length >= 1000) break;
    }

    console.log(`Total accounts fetched: ${allAccounts.length}`);

    if (allAccounts.length === 0) {
      return NextResponse.json([]);
    }

    // Process accounts in batches to avoid timeout
    const clientData = await Promise.all(
      allAccounts.map(async (account) => {
        try {
          // Fetch campaigns
          const campaignsResponse = await fetch(
            `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(urn%3Ali%3AsponsoredAccount%3A${account.id})))&pageSize=50`,
            {
              headers: {
                'Authorization': `Bearer ${token.accessToken}`,
                'Linkedin-Version': '202504',
                'X-RestLi-Protocol-Version': '2.0.0',
              },
            }
          );

          let campaigns = [];

          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            const campaignElements = campaignsData.elements || [];

            if (campaignElements.length > 0) {
              // Fetch analytics for ALL campaigns in this account at once
              const campaignUrns = campaignElements
                .map(c => `urn%3Ali%3AsponsoredCampaign%3A${c.id}`)
                .join(',');

              const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${parseInt(startYear)},month:${parseInt(startMonth)},day:${parseInt(startDay)}),end:(year:${parseInt(endYear)},month:${parseInt(endMonth)},day:${parseInt(endDay)}))&campaigns=List(${campaignUrns})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,pivotValues`;

              const analyticsResponse = await fetch(analyticsUrl, {
                headers: {
                  'Authorization': `Bearer ${token.accessToken}`,
                  'Linkedin-Version': '202504',
                  'X-RestLi-Protocol-Version': '2.0.0',
                },
              });

              // Build analytics map by campaign URN
              let analyticsMap = {};
              if (analyticsResponse.ok) {
                const analyticsData = await analyticsResponse.json();
                (analyticsData.elements || []).forEach(el => {
                  const urn = el.pivotValues?.[0];
                  if (urn) {
                    if (!analyticsMap[urn]) {
                      analyticsMap[urn] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
                    }
                    analyticsMap[urn].impressions += el.impressions || 0;
                    analyticsMap[urn].clicks += el.clicks || 0;
                    analyticsMap[urn].spend += parseFloat(el.costInLocalCurrency || 0);
                    analyticsMap[urn].conversions += el.externalWebsiteConversions || 0;
                  }
                });
              }

              // Map campaigns with their analytics
              campaigns = campaignElements.map(campaign => {
                const urn = `urn:li:sponsoredCampaign:${campaign.id}`;
                const analytics = analyticsMap[urn] || { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
                const ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions * 100).toFixed(2) : 0;
                const cpc = analytics.clicks > 0 ? (analytics.spend / analytics.clicks).toFixed(2) : 0;

                return {
                  name: campaign.name || 'Unnamed Campaign',
                  status: campaign.status || 'UNKNOWN',
                  impressions: analytics.impressions,
                  clicks: analytics.clicks,
                  spend: parseFloat(analytics.spend.toFixed(2)),
                  conversions: analytics.conversions,
                  ctr: parseFloat(ctr),
                  cpc: parseFloat(cpc),
                };
              });
            }
          }

          if (campaigns.length === 0) {
            campaigns = [{
              name: 'No campaigns found',
              status: 'NONE',
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }];
          }

          return {
            clientId: account.id,
            clientName: account.name || `Account ${account.id}`,
            campaigns,
          };
        } catch (err) {
          console.error(`Error for account ${account.id}:`, err.message);
          return {
            clientId: account.id,
            clientName: account.name || `Account ${account.id}`,
            campaigns: [{ name: 'Error loading data', status: 'ERROR', impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0 }],
          };
        }
      })
    );

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultStartDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}