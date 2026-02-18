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
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    // Fetch campaigns for this account
    const accountUrn = `urn:li:sponsoredAccount:${accountId}`;
    const campaignUrl = `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(${encodeURIComponent(accountUrn)})))&pageSize=100`;
    
    const campaignResponse = await fetch(campaignUrl, { headers });

    if (!campaignResponse.ok) {
      const error = await campaignResponse.text();
      console.error('Campaign fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    const campaignData = await campaignResponse.json();
    const campaigns = campaignData.elements || [];

    if (campaigns.length === 0) {
      return NextResponse.json({
        accountId,
        totalImpressions: 0,
        totalClicks: 0,
        totalSpend: 0,
        totalConversions: 0,
        ctr: 0,
        cpc: 0,
        campaigns: [],
      });
    }

    // Fetch analytics for all campaigns
    const campaignUrnList = campaigns
      .map(c => encodeURIComponent(`urn:li:sponsoredCampaign:${c.id}`))
      .join(',');

    const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${parseInt(startYear)},month:${parseInt(startMonth)},day:${parseInt(startDay)}),end:(year:${parseInt(endYear)},month:${parseInt(endMonth)},day:${parseInt(endDay)}))&campaigns=List(${campaignUrnList})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,pivotValues`;

    const analyticsResponse = await fetch(analyticsUrl, { headers });

    let analyticsMap = {};
    let totals = {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    };

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

          totals.impressions += element.impressions || 0;
          totals.clicks += element.clicks || 0;
          totals.spend += parseFloat(element.costInLocalCurrency || 0);
          totals.conversions += element.externalWebsiteConversions || 0;
        }
      });
    }

    // Map campaigns with analytics
    const campaignsWithAnalytics = campaigns.map(campaign => {
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
        id: campaign.id,
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

    // Sort by impressions descending for "top performing"
    campaignsWithAnalytics.sort((a, b) => b.impressions - a.impressions);

    const totalCtr = totals.impressions > 0 
      ? (totals.clicks / totals.impressions * 100).toFixed(2) 
      : 0;
    const totalCpc = totals.clicks > 0 
      ? (totals.spend / totals.clicks).toFixed(2) 
      : 0;

    return NextResponse.json({
      accountId,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalSpend: parseFloat(totals.spend.toFixed(2)),
      totalConversions: totals.conversions,
      ctr: parseFloat(totalCtr),
      cpc: parseFloat(totalCpc),
      campaigns: campaignsWithAnalytics,
    });

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
