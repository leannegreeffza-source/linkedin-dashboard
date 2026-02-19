import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountIds, currentRange, previousRange, exchangeRate } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    // Fetch data for both periods
    const currentData = await fetchPeriodData(accountIds, currentRange, headers);
    const previousData = await fetchPeriodData(accountIds, previousRange, headers);

    // Calculate metrics
    const current = calculateMetrics(currentData);
    const previous = calculateMetrics(previousData);

    // Get top ads
    const topAds = getTopAds(currentData.creatives, 5);

    // Calculate budget pacing
    const budgetPacing = calculateBudgetPacing(currentData, currentRange);

    return NextResponse.json({
      current,
      previous,
      topAds,
      budgetPacing
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchPeriodData(accountIds, dateRange, headers) {
  const [sy, sm, sd] = dateRange.start.split('-');
  const [ey, em, ed] = dateRange.end.split('-');

  let allData = {
    impressions: 0,
    clicks: 0,
    spend: 0,
    landingPageClicks: 0,
    leads: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    follows: 0,
    otherEngagements: 0,
    creatives: [],
    campaigns: []
  };

  for (const accountId of accountIds) {
    const accountUrn = `urn:li:sponsoredAccount:${accountId}`;

    // Fetch campaigns for this account
    try {
      const campaignRes = await fetch(
        `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(${encodeURIComponent(accountUrn)})))&count=100`,
        { headers }
      );

      if (!campaignRes.ok) continue;

      const campaignData = await campaignRes.json();
      const campaigns = campaignData.elements || [];

      if (campaigns.length === 0) continue;

      // Store campaign info for budget tracking
      allData.campaigns.push(...campaigns.map(c => ({
        id: c.id,
        name: c.name,
        dailyBudget: c.dailyBudget?.amount || 0,
        totalBudget: c.totalBudget?.amount || 0,
        runSchedule: c.runSchedule
      })));

      const campaignUrns = campaigns
        .map(c => encodeURIComponent(`urn:li:sponsoredCampaign:${c.id}`))
        .join(',');

      // Fetch analytics
      const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))&campaigns=List(${campaignUrns})&fields=impressions,clicks,costInLocalCurrency,landingPageClicks,externalWebsiteConversions,likes,comments,shares,follows,otherEngagements,pivotValues`;

      const analyticsRes = await fetch(analyticsUrl, { headers });

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        
        (analyticsData.elements || []).forEach(el => {
          const creativeUrn = el.pivotValues?.[0];
          
          allData.impressions += el.impressions || 0;
          allData.clicks += el.clicks || 0;
          allData.spend += parseFloat(el.costInLocalCurrency || 0);
          allData.landingPageClicks += el.landingPageClicks || 0;
          allData.leads += el.externalWebsiteConversions || 0;
          allData.likes += el.likes || 0;
          allData.comments += el.comments || 0;
          allData.shares += el.shares || 0;
          allData.follows += el.follows || 0;
          allData.otherEngagements += el.otherEngagements || 0;

          if (creativeUrn) {
            allData.creatives.push({
              id: creativeUrn.split(':').pop(),
              impressions: el.impressions || 0,
              clicks: el.clicks || 0,
              spent: parseFloat(el.costInLocalCurrency || 0),
              landingPageClicks: el.landingPageClicks || 0
            });
          }
        });
      }
    } catch (err) {
      console.error(`Error fetching data for account ${accountId}:`, err);
    }
  }

  return allData;
}

function calculateMetrics(data) {
  const impressions = data.impressions;
  const clicks = data.clicks;
  const spend = data.spend;
  const websiteVisits = data.landingPageClicks;
  const leads = data.leads;
  
  const engagements = clicks + data.likes + data.comments + data.shares + data.follows;

  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    spent: spend,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    websiteVisits,
    leads,
    cpl: leads > 0 ? spend / leads : 0,
    engagementRate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    engagements
  };
}

function getTopAds(creatives, count) {
  return creatives
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, count)
    .map(creative => ({
      id: creative.id,
      impressions: creative.impressions,
      clicks: creative.clicks,
      ctr: creative.impressions > 0 
        ? ((creative.clicks / creative.impressions) * 100).toFixed(2) 
        : '0.00',
      spent: creative.spent
    }));
}

function calculateBudgetPacing(data, dateRange) {
  // Calculate total budget from campaigns
  const totalBudget = data.campaigns.reduce((sum, c) => {
    return sum + (c.totalBudget || c.dailyBudget * 30 || 0);
  }, 0);

  // Calculate days elapsed
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const today = new Date();
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(
    Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)),
    totalDays
  );

  return {
    budget: totalBudget,
    spent: data.spend,
    daysTotal: totalDays,
    daysElapsed: elapsedDays
  };
}
