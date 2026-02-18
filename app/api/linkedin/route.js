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
    const mode = searchParams.get('mode') || 'full';
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    // Fetch ALL ad accounts with pagination
    console.log('Fetching accounts...');
    let allAccounts = [];
    let start = 0;
    const pageSize = 100;

    while (start < 5000) { // Safety limit
      const accountsResponse = await fetch(
        `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
        { headers }
      );

      if (!accountsResponse.ok) {
        console.error('Account fetch failed:', await accountsResponse.text());
        break;
      }

      const accountsData = await accountsResponse.json();
      const elements = accountsData.elements || [];
      
      if (elements.length === 0) break;
      
      allAccounts = [...allAccounts, ...elements];
      console.log(`Loaded ${allAccounts.length} accounts so far...`);
      
      if (elements.length < pageSize) break;
      start += pageSize;
    }

    console.log(`Total accounts loaded: ${allAccounts.length}`);

    if (allAccounts.length === 0) {
      return NextResponse.json([]);
    }

    // If mode is 'accounts', return just the account list
    if (mode === 'accounts') {
      const accountList = allAccounts.map(account => ({
        clientId: account.id,
        clientName: account.name || `Account ${account.id}`,
      }));
      return NextResponse.json(accountList);
    }

    // Otherwise fetch full campaign data for all accounts
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    const clientData = await Promise.all(
      allAccounts.slice(0, 100).map(async (account) => { // Limit to first 100 for testing
        try {
          // Build account URN
          const accountUrn = `urn:li:sponsoredAccount:${account.id}`;
          
          // Fetch campaigns for this account
          const campaignUrl = `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(${encodeURIComponent(accountUrn)})))&pageSize=50`;
          
          const campaignResponse = await fetch(campaignUrl, { headers });

          if (!campaignResponse.ok) {
            console.error(`Campaign fetch failed for ${account.id}`);
            return {
              clientId: account.id,
              clientName: account.name || `Account ${account.id}`,
              campaigns: [{
                name: 'No campaigns found',
                status: 'NONE',
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0,
                ctr: 0,
                cpc: 0,
              }],
            };
          }

          const campaignData = await campaignResponse.json();
          const campaignElements = campaignData.elements || [];

          if (campaignElements.length === 0) {
            return {
              clientId: account.id,
              clientName: account.name || `Account ${account.id}`,
              campaigns: [{
                name: 'No campaigns found',
                status: 'NONE',
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0,
                ctr: 0,
                cpc: 0,
              }],
            };
          }

          // Fetch analytics for all campaigns in this account
          const campaignUrnList = campaignElements
            .map(c => encodeURIComponent(`urn:li:sponsoredCampaign:${c.id}`))
            .join(',');

          const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${parseInt(startYear)},month:${parseInt(startMonth)},day:${parseInt(startDay)}),end:(year:${parseInt(endYear)},month:${parseInt(endMonth)},day:${parseInt(endDay)}))&campaigns=List(${campaignUrnList})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,pivotValues`;

          const analyticsResponse = await fetch(analyticsUrl, { headers });

          let analyticsMap = {};
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            (analyticsData.elements || []).forEach(element => {
              const campaignUrn = element.pivotValues?.[0];
              if (campaignUrn) {
                if (!analyticsMap[campaignUrn]) {
                  analyticsMap[campaignUrn] = {
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    conversions: 0,
                  };
                }
                analyticsMap[campaignUrn].impressions += element.impressions || 0;
                analyticsMap[campaignUrn].clicks += element.clicks || 0;
                analyticsMap[campaignUrn].spend += parseFloat(element.costInLocalCurrency || 0);
                analyticsMap[campaignUrn].conversions += element.externalWebsiteConversions || 0;
              }
            });
          }

          // Map campaigns with analytics
          const campaigns = campaignElements.map(campaign => {
            const campaignUrn = `urn:li:sponsoredCampaign:${campaign.id}`;
            const analytics = analyticsMap[campaignUrn] || {
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
            };

            const ctr = analytics.impressions > 0 
              ? (analytics.clicks / analytics.impressions * 100).toFixed(2) 
              : 0;
            const cpc = analytics.clicks > 0 
              ? (analytics.spend / analytics.clicks).toFixed(2) 
              : 0;

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

          return {
            clientId: account.id,
            clientName: account.name || `Account ${account.id}`,
            campaigns,
          };

        } catch (error) {
          console.error(`Error processing account ${account.id}:`, error.message);
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
    console.error('Server error:', error);
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
