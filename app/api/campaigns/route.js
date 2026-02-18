import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountIds, startDate, endDate } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    // Parse dates
    const [sy, sm, sd] = startDate.split('-');
    const [ey, em, ed] = endDate.split('-');

    // Aggregate data across all selected accounts
    let totalMetrics = {
      impressions: 0,
      clicks: 0,
      spent: 0,
      engagements: 0,
      socialActions: 0,
      otherEngagements: 0,
      videoViews: 0,
      follows: 0,
    };

    let allCreatives = [];

    // Fetch data for each account
    for (const accountId of accountIds) {
      const accountUrn = `urn:li:sponsoredAccount:${accountId}`;

      // Fetch campaigns for this account
      const campaignRes = await fetch(
        `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(${encodeURIComponent(accountUrn)})))&count=100`,
        { headers }
      );

      if (!campaignRes.ok) continue;

      const campaignData = await campaignRes.json();
      const campaigns = campaignData.elements || [];

      if (campaigns.length === 0) continue;

      // Get campaign URNs
      const campaignUrns = campaigns.map(c => encodeURIComponent(`urn:li:sponsoredCampaign:${c.id}`)).join(',');

      // Fetch analytics for these campaigns
      const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))&campaigns=List(${campaignUrns})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,landingPageClicks,likes,comments,shares,follows,oneClickLeads,otherEngagements,pivotValues`;

      const analyticsRes = await fetch(analyticsUrl, { headers });

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        
        (analyticsData.elements || []).forEach(el => {
          const creativeUrn = el.pivotValues?.[0];
          
          totalMetrics.impressions += el.impressions || 0;
          totalMetrics.clicks += el.clicks || 0;
          totalMetrics.spent += parseFloat(el.costInLocalCurrency || 0);
          
          const engagements = (el.landingPageClicks || 0) + (el.likes || 0) + (el.comments || 0) + (el.shares || 0);
          totalMetrics.engagements += engagements;
          totalMetrics.socialActions += (el.likes || 0) + (el.comments || 0) + (el.shares || 0);
          totalMetrics.follows += el.follows || 0;
          totalMetrics.otherEngagements += el.otherEngagements || 0;

          // Store creative data for top performers
          if (creativeUrn) {
            allCreatives.push({
              id: creativeUrn.split(':').pop(),
              impressions: el.impressions || 0,
              clicks: el.clicks || 0,
              engagements: engagements,
              socialActions: (el.likes || 0) + (el.comments || 0) + (el.shares || 0),
              ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : 0
            });
          }
        });
      }
    }

    // Calculate derived metrics
    const ctr = totalMetrics.impressions > 0 
      ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2) 
      : 0;

    const cpm = totalMetrics.impressions > 0 
      ? ((totalMetrics.spent / totalMetrics.impressions) * 1000).toFixed(2) 
      : 0;

    const cpc = totalMetrics.clicks > 0 
      ? (totalMetrics.spent / totalMetrics.clicks).toFixed(2) 
      : 0;

    const engagementRate = totalMetrics.impressions > 0 
      ? ((totalMetrics.engagements / totalMetrics.impressions) * 100).toFixed(2) 
      : 0;

    // Get top 5 performing ads by impressions
    const topAds = allCreatives
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    return NextResponse.json({
      impressions: totalMetrics.impressions,
      clicks: totalMetrics.clicks,
      ctr: parseFloat(ctr),
      cpm: parseFloat(cpm),
      cpc: parseFloat(cpc),
      engagements: totalMetrics.engagements,
      spent: totalMetrics.spent,
      socialActions: totalMetrics.socialActions,
      engagementRate: parseFloat(engagementRate),
      otherEngagements: totalMetrics.otherEngagements,
      topAds: topAds
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultStartDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}
