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

    // Fetch ALL ad accounts with pagination
    let allAccounts = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 20; // Support up to 1000 accounts (50 per page x 20 pages)

    do {
      let url = 'https://api.linkedin.com/rest/adAccounts?q=search&pageSize=50';
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const accountsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Linkedin-Version': '202504',
          'X-RestLi-Protocol-Version': '2.0.0',
        },
      });

      if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.error('Accounts API error:', errorText);
        break;
      }

      const accountsData = await accountsResponse.json();
      
      if (accountsData.elements) {
        allAccounts = [...allAccounts, ...accountsData.elements];
      }

      // Check for next page
      pageToken = accountsData.metadata?.nextPageToken || null;
      pageCount++;

    } while (pageToken && pageCount < maxPages);

    console.log(`Fetched ${allAccounts.length} accounts total`);

    if (allAccounts.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch analytics for each account
    const clientData = await Promise.all(
      allAccounts.map(async (account, index) => {
        try {
          // Fetch campaigns for this account
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

            // Fetch analytics for each campaign
            campaigns = await Promise.all(
              campaignElements.map(async (campaign) => {
                try {
                  const analyticsResponse = await fetch(
                    `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${startDate.split('-')[0]},month:${parseInt(startDate.split('-')[1])},day:${parseInt(startDate.split('-')[2])}),end:(year:${endDate.split('-')[0]},month:${parseInt(endDate.split('-')[1])},day:${parseInt(endDate.split('-')[2])}))&campaigns=List(urn%3Ali%3AsponsoredCampaign%3A${campaign.id})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,dateRange`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token.accessToken}`,
                        'Linkedin-Version': '202504',
                        'X-RestLi-Protocol-Version': '2.0.0',
                      },
                    }
                  );

                  let impressions = 0, clicks = 0, spend = 0, conversions = 0;

                  if (analyticsResponse.ok) {
                    const analyticsData = await analyticsResponse.json();
                    const elements = analyticsData.elements || [];
                    elements.forEach(el => {
                      impressions += el.impressions || 0;
                      clicks += el.clicks || 0;
                      spend += parseFloat(el.costInLocalCurrency || 0);
                      conversions += el.externalWebsiteConversions || 0;
                    });
                  }

                  const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0;
                  const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : 0;

                  return {
                    name: campaign.name || 'Unnamed Campaign',
                    status: campaign.status || 'UNKNOWN',
                    impressions,
                    clicks,
                    spend: parseFloat(spend.toFixed(2)),
                    conversions,
                    ctr: parseFloat(ctr),
                    cpc: parseFloat(cpc),
                  };
                } catch (err) {
                  return {
                    name: campaign.name || 'Unnamed Campaign',
                    status: campaign.status || 'UNKNOWN',
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    conversions: 0,
                    ctr: 0,
                    cpc: 0,
                  };
                }
              })
            );
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
          console.error(`Error for account ${account.id}:`, err);
          return {
            clientId: account.id,
            clientName: account.name || `Account ${account.id}`,
            campaigns: [{
              name: 'Error loading data',
              status: 'ERROR',
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }],
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
  date.setDate(1); // First of current month
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}