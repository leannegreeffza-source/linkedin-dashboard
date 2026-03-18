import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LI_HEADERS = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Linkedin-Version': '202504',
  'X-RestLi-Protocol-Version': '2.0.0',
});

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountIds, campaignGroupIds, campaignIds, adIds, currentRange, previousRange } = await request.json();
    const headers = LI_HEADERS(token.accessToken);

    // ── Resolve which campaign IDs to query ──────────────────────────────────
    // Priority: adIds > campaignIds > campaignGroupIds > accountIds
    // For groups: fetch their campaigns directly from the campaigns API

    let resolvedCampaignIds = null; // null = query at account level

    if (campaignIds && campaignIds.length > 0) {
      resolvedCampaignIds = campaignIds.map(String);

    } else if (campaignGroupIds && campaignGroupIds.length > 0) {
      // Fetch campaigns belonging to each selected group
      resolvedCampaignIds = await getCampaignIdsForGroups(campaignGroupIds, accountIds, headers);
    }

    // ── Fetch analytics for both periods ────────────────────────────────────
    const [currentData, previousData] = await Promise.all([
      fetchAnalytics(accountIds, resolvedCampaignIds, adIds, currentRange, headers),
      fetchAnalytics(accountIds, resolvedCampaignIds, adIds, previousRange, headers),
    ]);

    // ── Enrich breakdown items with names + objectiveType ────────────────────
    const allCampaignIds = [...new Set(currentData.campaignBreakdown.map(c => c.id))];
    const allGroupIds    = [...new Set(currentData.campaignGroupBreakdown.map(g => g.id))];
    const allAdIds       = [...new Set(currentData.adBreakdown.map(a => a.id))];

    const [campaignDetails, groupNames, adNames] = await Promise.all([
      fetchCampaignDetails(allCampaignIds, headers),
      fetchResourceNames(allGroupIds, 'adCampaignGroups', headers),
      fetchResourceNames(allAdIds, 'adCreatives', headers),
    ]);

    const topCampaigns = getTopN(currentData.campaignBreakdown, 10).map(c => ({
      ...c,
      name: campaignDetails[c.id]?.name || `Campaign ${c.id}`,
      objectiveType: (campaignDetails[c.id]?.objectiveType || '').toUpperCase(),
    }));

    const topAds = getTopN(currentData.adBreakdown, 10).map(a => ({
      ...a,
      name: adNames[a.id] || `Ad ${a.id}`,
    }));

    const topCampaignGroups = getTopN(currentData.campaignGroupBreakdown, 10).map(g => ({
      ...g,
      name: groupNames[g.id] || `Campaign Group ${g.id}`,
    }));

    return NextResponse.json({
      current: calculateMetrics(currentData),
      previous: calculateMetrics(previousData),
      topCampaigns,
      topAds,
      topCampaignGroups,
      budgetPacing: buildPacing(currentData, currentRange),
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Get campaign IDs for selected campaign groups ─────────────────────────────
async function getCampaignIdsForGroups(groupIds, accountIds, headers) {
  const campaignIds = [];

  // Try fetching campaigns per group directly
  for (const groupId of groupIds) {
    try {
      const groupUrn = encodeURIComponent(`urn:li:sponsoredCampaignGroup:${groupId}`);
      const url = `https://api.linkedin.com/rest/adCampaigns?q=search&search.campaignGroup.values[0]=${groupUrn}&count=100&fields=id,name,objectiveType`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        (data.elements || []).forEach(c => {
          if (c.id && !campaignIds.includes(String(c.id))) {
            campaignIds.push(String(c.id));
          }
        });
      } else {
        console.log(`Group search failed for ${groupId}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Error fetching campaigns for group ${groupId}:`, e);
    }
  }

  if (campaignIds.length > 0) {
    console.log(`Resolved ${campaignIds.length} campaigns from ${groupIds.length} groups`);
    return campaignIds;
  }

  // Fallback: list all campaigns for each account and filter by campaignGroup field
  console.log('Group search returned 0 results, trying account campaign list with group filter');
  for (const accountId of accountIds) {
    try {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);
      const url = `https://api.linkedin.com/rest/adCampaigns?q=search&search.account.values[0]=${accountUrn}&count=100&fields=id,campaignGroup`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        (data.elements || []).forEach(c => {
          if (!c.campaignGroup) return;
          const gId = String(c.campaignGroup).split(':').pop();
          if (groupIds.map(String).includes(gId)) {
            if (!campaignIds.includes(String(c.id))) campaignIds.push(String(c.id));
          }
        });
      }
    } catch (e) {}
  }

  if (campaignIds.length > 0) {
    console.log(`Fallback resolved ${campaignIds.length} campaigns`);
    return campaignIds;
  }

  // Last resort: return null so we query at account level
  console.log('Could not resolve campaigns for groups, falling back to account level');
  return null;
}

// ── Core analytics fetch ──────────────────────────────────────────────────────
async function fetchAnalytics(accountIds, resolvedCampaignIds, adIds, dateRange, headers) {
  const [sy, sm, sd] = dateRange.start.split('-');
  const [ey, em, ed] = dateRange.end.split('-');
  const dr = `dateRange=(start:(year:${+sy},month:${+sm},day:${+sd}),end:(year:${+ey},month:${+em},day:${+ed}))`;
  const fields = [
    'impressions','clicks','costInLocalCurrency','oneClickLeads',
    'likes','comments','shares','follows','otherEngagements',
    'landingPageClicks','leadGenerationMailContactInfoShares',
    'oneClickLeadFormOpens','leadGenerationMailInterestedClicks',
    'viralOneClickLeads','videoViews','videoCompletions','pivotValues',
  ].join(',');

  const result = {
    impressions: 0, clicks: 0, spend: 0,
    leads: 0, likes: 0, comments: 0, shares: 0, follows: 0, otherEngagements: 0,
    landingPageClicks: 0, leadFormOpens: 0, videoViews: 0, videoCompletions: 0,
    campaignBreakdown: [], adBreakdown: [], campaignGroupBreakdown: [],
  };

  // ── Ads selected ────────────────────────────────────────────────────────────
  if (adIds && adIds.length > 0) {
    const urns = adIds.map(id => encodeURIComponent(`urn:li:sponsoredCreative:${id}`)).join(',');
    const res = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dr}&creatives=List(${urns})&fields=${fields}`,
      { headers }
    );
    if (res.ok) addToResult(result, (await res.json()).elements || [], 'ad');
    return result;
  }

  // ── Campaigns resolved (from direct selection or group lookup) ──────────────
  if (resolvedCampaignIds && resolvedCampaignIds.length > 0) {
    const urns = resolvedCampaignIds.map(id => encodeURIComponent(`urn:li:sponsoredCampaign:${id}`)).join(',');

    // Campaign pivot → totals + campaignBreakdown
    const campRes = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dr}&campaigns=List(${urns})&fields=${fields}`,
      { headers }
    );
    if (campRes.ok) addToResult(result, (await campRes.json()).elements || [], 'campaign');

    // Creative pivot → adBreakdown only (no double-counting totals)
    const adRes = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dr}&campaigns=List(${urns})&fields=${fields}`,
      { headers }
    );
    if (adRes.ok) addBreakdownOnly(result, (await adRes.json()).elements || [], 'ad');

    return result;
  }

  // ── Account level (no filters) ──────────────────────────────────────────────
  for (const accountId of accountIds) {
    const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

    // Campaign group breakdown
    const groupRes = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN_GROUP&timeGranularity=ALL&${dr}&accounts=List(${accountUrn})&fields=${fields}`,
      { headers }
    );
    if (groupRes.ok) {
      (await groupRes.json()).elements?.forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) result.campaignGroupBreakdown.push({
          id: urn.split(':').pop(),
          impressions: el.impressions || 0,
          clicks: el.clicks || 0,
          spent: parseFloat(el.costInLocalCurrency || 0),
          leads: el.oneClickLeads || 0,
          ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
          landingPageClicks: el.landingPageClicks || 0,
          videoViews: el.videoViews || 0,
        });
      });
    }

    // Campaign pivot → totals + campaignBreakdown
    const campRes = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dr}&accounts=List(${accountUrn})&fields=${fields}`,
      { headers }
    );
    if (campRes.ok) addToResult(result, (await campRes.json()).elements || [], 'campaign');

    // Creative pivot → adBreakdown only
    const adRes = await fetch(
      `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dr}&accounts=List(${accountUrn})&fields=${fields}`,
      { headers }
    );
    if (adRes.ok) addBreakdownOnly(result, (await adRes.json()).elements || [], 'ad');
  }

  return result;
}

// Aggregate totals AND push to breakdown list
function addToResult(result, elements, type) {
  elements.forEach(el => {
    const urn = el.pivotValues?.[0];
    result.impressions       += el.impressions || 0;
    result.clicks            += el.clicks || 0;
    result.spend             += parseFloat(el.costInLocalCurrency || 0);
    result.leads             += el.oneClickLeads || 0;
    result.likes             += el.likes || 0;
    result.comments          += el.comments || 0;
    result.shares            += el.shares || 0;
    result.follows           += el.follows || 0;
    result.otherEngagements  += el.otherEngagements || 0;
    result.landingPageClicks += el.landingPageClicks || 0;
    result.videoViews        += el.videoViews || 0;
    result.videoCompletions  += el.videoCompletions || 0;
    const formOpens = (el.oneClickLeadFormOpens || 0)
      + (el.leadGenerationMailContactInfoShares || 0)
      + (el.leadGenerationMailInterestedClicks || 0);
    result.leadFormOpens += formOpens > 0 ? formOpens : (el.viralOneClickLeads || 0);

    if (!urn) return;
    const id = urn.split(':').pop();

    if (type === 'campaign') {
      result.campaignBreakdown.push({
        id, impressions: el.impressions || 0, clicks: el.clicks || 0,
        spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
        ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
        landingPageClicks: el.landingPageClicks || 0,
        videoViews: el.videoViews || 0, videoCompletions: el.videoCompletions || 0,
      });
    }
  });
}

// Push to breakdown list ONLY — does NOT touch totals (prevents double-counting)
function addBreakdownOnly(result, elements, type) {
  elements.forEach(el => {
    const urn = el.pivotValues?.[0];
    if (!urn) return;
    const id = urn.split(':').pop();
    if (type === 'ad') {
      result.adBreakdown.push({
        id, impressions: el.impressions || 0, clicks: el.clicks || 0,
        spent: parseFloat(el.costInLocalCurrency || 0), leads: el.oneClickLeads || 0,
        ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
        likes: el.likes || 0, comments: el.comments || 0,
        shares: el.shares || 0, follows: el.follows || 0,
        otherEngagements: el.otherEngagements || 0,
      });
    }
  });
}

// ── Name / detail fetchers ────────────────────────────────────────────────────
async function fetchCampaignDetails(ids, headers) {
  const map = {};
  if (!ids.length) return map;
  await Promise.all(ids.map(async id => {
    try {
      const res = await fetch(`https://api.linkedin.com/rest/adCampaigns/${id}`, { headers });
      if (res.ok) {
        const d = await res.json();
        map[id] = { name: d.name || null, objectiveType: d.objectiveType || '' };
      }
    } catch (e) {}
  }));
  return map;
}

async function fetchResourceNames(ids, resource, headers) {
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

// ── Metric calculations ───────────────────────────────────────────────────────
function calculateMetrics(d) {
  const { impressions: i, clicks: c, spend: s, leads: l,
    likes, comments, shares, follows,
    landingPageClicks: lpc, leadFormOpens: lfo,
    videoViews: vv, videoCompletions: vc } = d;
  const eng = c + likes + comments + shares + follows;
  return {
    impressions: i, clicks: c,
    ctr:              i > 0 ? (c / i) * 100 : 0,
    spent:            s,
    cpm:              i > 0 ? (s / i) * 1000 : 0,
    cpc:              c > 0 ? s / c : 0,
    websiteVisits:    lpc,
    leads:            l,
    cpl:              l > 0 ? s / l : 0,
    engagementRate:   i > 0 ? (eng / i) * 100 : 0,
    engagements:      eng,
    landingPageClicks: lpc,
    landingPageCTR:   i > 0 ? (lpc / i) * 100 : 0,
    leadFormOpens:    lfo,
    leadFormCompletionRate: lfo > 0 ? (l / lfo) * 100 : 0,
    videoViews:       vv,
    videoViewRate:    i > 0 ? (vv / i) * 100 : 0,
    cpv:              vv > 0 ? s / vv : 0,
    videoCompletionRate: vv > 0 ? (vc / vv) * 100 : 0,
  };
}

function getTopN(items, n) {
  return [...items].sort((a, b) => b.impressions - a.impressions).slice(0, n);
}

function buildPacing(data, dateRange) {
  const start = new Date(dateRange.start);
  const end   = new Date(dateRange.end);
  const today = new Date();
  const totalDays   = Math.ceil((end - start) / 86400000);
  const elapsedDays = Math.min(Math.ceil((today - start) / 86400000), totalDays);
  return { budget: 0, spent: data.spend, daysTotal: totalDays, daysElapsed: elapsedDays };
}