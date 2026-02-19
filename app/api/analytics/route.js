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

    const { accountIds, currentRange, previousRange } = await request.json();
    console.log('Analytics request for accounts:', accountIds);

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const currentData = await fetchPeriodData(accountIds, currentRange, headers);
    const previousData = await fetchPeriodData(accountIds, previousRange, headers);

    const current = calculateMetrics(currentData);
    const previous = calculateMetrics(previousData);
    const topAds = getTopAds(currentData.creatives, 5);
    const budgetPacing = calculateBudgetPacing(currentData, currentRange);

    console.log('Final current metrics:', current);

    return NextResponse.json({ current, previous, topAds, budgetPacing });

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
    const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);
    console.log('Fetching analytics for account:', accountId);

    try {
      const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))&accounts=List(${accountUrn})&fields=impressions,clicks,costInLocalCurrency,landingPageClicks,externalWebsiteConversions,likes,comments,shares,follows,otherEngagements,pivotValues`;

      console.log('Analytics URL:', analyticsUrl);

      const analyticsRes = await fetch(analyticsUrl, { headers });
      console.log('Analytics response status:', analyticsRes.status);

      if (!analyticsRes.ok) {
        const errText = await analyticsRes.text();
        console.error('Analytics fetch failed:', analyticsRes.status, errText);
        continue;
      }

      const analyticsData = await analyticsRes.json();
      console.log('Analytics elements count:', analyticsData.elements?.length);
      if (analyticsData.elements?.length > 0) {
        console.log('First element sample:', JSON.stringify(analyticsData.elements[0]));
      }

      (analyticsData.elements || []).forEach(el => {
        const pivotUrn = el.pivotValues?.[0];

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

        if (pivotUrn) {
          allData.creatives.push({
            id: pivotUrn.split(':').pop(),
            impressions: el.impressions || 0,
            clicks: el.clicks || 0,
            spent: parseFloat(el.costInLocalCurrency || 0),
            landingPageClicks: el.landingPageClicks || 0
          });
        }
      });

    } catch (err) {
      console.error(`Error fetching data for account ${accountId}:`, err);
    }
  }

  console.log('Total aggregated data:', {
    impressions: allData.impressions,
    clicks: allData.clicks,
    spend: allData.spend
  });

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
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const today = new Date();

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(
    Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)),
    totalDays
  );

  return {
    budget: 0,
    spent: data.spend,
    daysTotal: totalDays,
    daysElapsed: elapsedDays
  };
}