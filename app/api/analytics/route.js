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

    const { accountIds, campaignGroupIds, campaignIds, adIds, currentRange, previousRange } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const currentData = await fetchPeriodData(accountIds, campaignGroupIds, campaignIds, adIds, currentRange, headers);
    const previousData = await fetchPeriodData(accountIds, campaignGroupIds, campaignIds, adIds, previousRange, headers);

    const current = calculateMetrics(currentData);
    const previous = calculateMetrics(previousData);

    // Collect unique IDs from breakdown
    const allCampaignIds = [...new Set(currentData.campaignBreakdown.map(c => c.id))];
    const allGroupIds    = [...new Set(currentData.campaignGroupBreakdown.map(g => g.id))];
    const allAdIds       = [...new Set(currentData.adBreakdown.map(a => a.id))];

    // Fetch names AND objectiveType for campaigns, names for groups/ads
    const [campaignDetails, groupNames, adNames] = await Promise.all([
      fetchCampaignDetails(allCampaignIds, headers),
      fetchNames(allGroupIds, 'adCampaignGroups', headers),
      fetchNames(allAdIds, 'adCreatives', headers),
    ]);

    // Attach names + objectiveType to campaign breakdown items
    const topCampaigns = getTopItems(currentData.campaignBreakdown, 10).map(c => ({
      ...c,
      name: campaignDetails[c.id]?.name || `Campaign ${c.id}`,
      objectiveType: (campaignDetails[c.id]?.objectiveType || '').toUpperCase(),
    }));

    const topAds = getTopItems(currentData.adBreakdown, 10).map(a => ({
      ...a,
      name: adNames[a.id] || `Ad ${a.id}`,
    }));

    const topCampaignGroups = getTopItems(currentData.campaignGroupBreakdown, 10).map(g => ({
      ...g,
      name: groupNames[g.id] || `Campaign Group ${g.id}`,
    }));

    const budgetPacing = calculateBudgetPacing(currentData, currentRange);

    return NextResponse.json({ current, previous, topCampaigns, topAds, topCampaignGroups, budgetPacing });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fetch name + objectiveType for campaign IDs
async function fetchCampaignDetails(ids, headers) {
  const map = {};
  if (!ids.length) return map;
  await Promise.all(ids.map(async id => {
    try {
      const res = await fetch(`https://api.linkedin.com/rest/adCampaigns/${id}`, { headers });
      if (res.ok) {
        const d = await res.json();
        map[id] = {
          name: d.name || null,
          objectiveType: d.objectiveType || '',
        };
      }
    } catch (e) {}
  }));
  return map;
}

// Fetch names only
async function fetchNames(ids, resource, headers) {
  const map = {};
  if (!ids.length) return map;
  await Promise.all(ids.map(async id => {
    try {
      const res = await fetch(`https://api.linkedin.com/rest/${resource}/${id}`, { headers });
      if (res.ok) {
        const d = await res.json();
        map[id] = d.name || d.title || null;
      }
    } catch (e) {}
  }));
  return map;
}

async function fetchPeriodData(accountIds, campaignGroupIds, campaignIds, adIds, dateRange, headers) {
  const [sy, sm, sd] = dateRange.start.split('-');
  const [ey, em, ed] = dateRange.end.split('-');

  let allData = {
    impressions: 0, clicks: 0, spend: 0,
    leads: 0, likes: 0, comments: 0,
    shares: 0, follows: 0, otherEngagements: 0,
    landingPageClicks: 0, leadFormOpens: 0,
    videoViews: 0, videoCompletions: 0,
    campaignBreakdown: [], adBreakdown: [], campaignGroupBreakdown: [],
  };

  const dateRangeParam = `dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))`;
  const fields = 'impressions,clicks,costInLocalCurrency,oneClickLeads,likes,comments,shares,follows,otherEngagements,landingPageClicks,leadGenerationMailContactInfoShares,oneClickLeadFormOpens,leadGenerationMailInterestedClicks,viralOneClickLeads,videoViews,videoCompletions,pivotValues';

  if (adIds && adIds.length > 0) {
    const creativeUrns = adIds.map(id => encodeURIComponent(`urn:li:sponsoredCreative:${id}`)).join(',');
    const res = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&creatives=List(${creativeUrns})&fields=${fields}`, { headers });
    if (res.ok) aggregateData(allData, (await res.json()).elements || [], 'ad');

  } else if (campaignIds && campaignIds.length > 0) {
    const campaignUrns = campaignIds.map(id => encodeURIComponent(`urn:li:sponsoredCampaign:${id}`)).join(',');
    // Totals from campaign pivot only
    const campRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`, { headers });
    if (campRes.ok) aggregateData(allData, (await campRes.json()).elements || [], 'campaign');
    // Ad breakdown only — does NOT re-add to totals
    const adRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`, { headers });
    if (adRes.ok) {
      (await adRes.json()).elements?.forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) allData.adBreakdown.push({
          id: urn.split(':').pop(),
          impressions: el.impressions || 0, clicks: el.clicks || 0,
          spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
          ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
          likes: el.likes || 0, comments: el.comments || 0,
          shares: el.shares || 0, follows: el.follows || 0,
          otherEngagements: el.otherEngagements || 0,
        });
      });
    }

  } else if (campaignGroupIds && campaignGroupIds.length > 0) {
    // Step 1: get campaign IDs that belong to the selected groups
    const groupCampaignIds = [];
    for (const groupId of campaignGroupIds) {
      try {
        const res = await fetch(
          `https://api.linkedin.com/rest/adCampaigns?q=search&search.campaignGroup.values[0]=${encodeURIComponent(`urn:li:sponsoredCampaignGroup:${groupId}`)}&count=100&fields=id`,
          { headers }
        );
        if (res.ok) {
          const d = await res.json();
          (d.elements || []).forEach(c => { if (!groupCampaignIds.includes(c.id)) groupCampaignIds.push(c.id); });
        }
      } catch (e) {}
    }

    if (groupCampaignIds.length > 0) {
      // Step 2: query analytics only for those campaigns — totals from campaign pivot only
      const campaignUrns = groupCampaignIds.map(id => encodeURIComponent(`urn:li:sponsoredCampaign:${id}`)).join(',');
      const campRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`, { headers });
      if (campRes.ok) aggregateData(allData, (await campRes.json()).elements || [], 'campaign');
      // Ad breakdown only — does NOT re-add to totals (adBreakdown list only)
      const adRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`, { headers });
      if (adRes.ok) {
        (await adRes.json()).elements?.forEach(el => {
          const urn = el.pivotValues?.[0];
          if (urn) allData.adBreakdown.push({
            id: urn.split(':').pop(),
            impressions: el.impressions || 0, clicks: el.clicks || 0,
            spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
            ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
            likes: el.likes || 0, comments: el.comments || 0,
            shares: el.shares || 0, follows: el.follows || 0,
            otherEngagements: el.otherEngagements || 0,
          });
        });
      }
    }

  } else {
    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

      // Campaign Group breakdown
      const groupRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN_GROUP&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=${fields}`, { headers });
      if (groupRes.ok) {
        (await groupRes.json()).elements?.forEach(el => {
          const urn = el.pivotValues?.[0];
          if (urn) allData.campaignGroupBreakdown.push({
            id: urn.split(':').pop(),
            impressions: el.impressions || 0, clicks: el.clicks || 0,
            spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
            ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
            landingPageClicks: el.landingPageClicks || 0, videoViews: el.videoViews || 0,
          });
        });
      }

      // Totals from campaign pivot only
      const campRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=${fields}`, { headers });
      if (campRes.ok) aggregateData(allData, (await campRes.json()).elements || [], 'campaign');

      // Ad breakdown only — does NOT re-add to totals
      const adRes = await fetch(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=${fields}`, { headers });
      if (adRes.ok) {
        (await adRes.json()).elements?.forEach(el => {
          const urn = el.pivotValues?.[0];
          if (urn) allData.adBreakdown.push({
            id: urn.split(':').pop(),
            impressions: el.impressions || 0, clicks: el.clicks || 0,
            spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
            ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
            likes: el.likes || 0, comments: el.comments || 0,
            shares: el.shares || 0, follows: el.follows || 0,
            otherEngagements: el.otherEngagements || 0,
          });
        });
      }
    }
  }

  return allData;
}

function aggregateData(allData, elements, type) {
  elements.forEach(el => {
    const urn = el.pivotValues?.[0];
    allData.impressions += el.impressions || 0;
    allData.clicks += el.clicks || 0;
    allData.spend += parseFloat(el.costInLocalCurrency || 0);
    allData.leads += el.oneClickLeads || 0;
    allData.likes += el.likes || 0;
    allData.comments += el.comments || 0;
    allData.shares += el.shares || 0;
    allData.follows += el.follows || 0;
    allData.otherEngagements += el.otherEngagements || 0;
    allData.landingPageClicks += el.landingPageClicks || 0;
    allData.videoViews += el.videoViews || 0;
    allData.videoCompletions += el.videoCompletions || 0;
    const formOpens = (el.oneClickLeadFormOpens || 0) + (el.leadGenerationMailContactInfoShares || 0) + (el.leadGenerationMailInterestedClicks || 0);
    allData.leadFormOpens += formOpens > 0 ? formOpens : (el.viralOneClickLeads || 0);

    if (urn && type === 'campaign') {
      allData.campaignBreakdown.push({
        id: urn.split(':').pop(),
        impressions: el.impressions || 0, clicks: el.clicks || 0,
        spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
        ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
        landingPageClicks: el.landingPageClicks || 0,
        videoViews: el.videoViews || 0,
        videoCompletions: el.videoCompletions || 0,
      });
    }
    if (urn && type === 'ad') {
      allData.adBreakdown.push({
        id: urn.split(':').pop(),
        impressions: el.impressions || 0, clicks: el.clicks || 0,
        spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
        ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
        likes: el.likes || 0, comments: el.comments || 0,
        shares: el.shares || 0, follows: el.follows || 0,
        otherEngagements: el.otherEngagements || 0,
      });
    }
  });
}

function calculateMetrics(data) {
  const { impressions, clicks, spend, leads, likes, comments, shares, follows, landingPageClicks, leadFormOpens, videoViews, videoCompletions } = data;
  const engagements = clicks + likes + comments + shares + follows;
  return {
    impressions, clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    spent: spend,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    websiteVisits: landingPageClicks,
    leads,
    cpl: leads > 0 ? spend / leads : 0,
    engagementRate: impressions > 0 ? (engagements / impressions) * 100 : 0,
    engagements,
    landingPageClicks,
    landingPageCTR: impressions > 0 ? (landingPageClicks / impressions) * 100 : 0,
    leadFormOpens,
    leadFormCompletionRate: leadFormOpens > 0 ? (leads / leadFormOpens) * 100 : 0,
    videoViews,
    videoViewRate: impressions > 0 ? (videoViews / impressions) * 100 : 0,
    cpv: videoViews > 0 ? spend / videoViews : 0,
    videoCompletionRate: videoViews > 0 ? (videoCompletions / videoViews) * 100 : 0,
  };
}

function getTopItems(items, count) {
  return [...items].sort((a, b) => b.impressions - a.impressions).slice(0, count);
}

function calculateBudgetPacing(data, dateRange) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const today = new Date();
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)), totalDays);
  return { budget: 0, spent: data.spend, daysTotal: totalDays, daysElapsed: elapsedDays };
}