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
    const topCampaigns = getTopItems(currentData.campaignBreakdown, 5);
    const topAds = getTopItems(currentData.adBreakdown, 10);

    // Enrich top ads with creative details (image + destination URL + name)
    const enrichedTopAds = await enrichAdCreatives(topAds, headers);

    const budgetPacing = calculateBudgetPacing(currentData, currentRange);

    return NextResponse.json({ current, previous, topCampaigns, topAds: enrichedTopAds, budgetPacing });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fetch creative details for ads to get image URL, destination URL, and title
async function enrichAdCreatives(ads, headers) {
  if (!ads || ads.length === 0) return ads;

  return await Promise.all(
    ads.map(async (ad) => {
      try {
        const res = await fetch(`https://api.linkedin.com/rest/adCreatives/${ad.id}`, { headers });
        if (!res.ok) return ad;

        const creative = await res.json();

        // Extract destination URL
        const destinationUrl =
          creative.content?.textAd?.destinationUrl ||
          creative.content?.singleVideo?.landingPageUrl ||
          creative.content?.carousel?.landingPageUrl ||
          creative.content?.document?.landingPageUrl ||
          null;

        // Extract creative name/title
        const name =
          creative.content?.textAd?.headline ||
          creative.content?.singleVideo?.title ||
          creative.name ||
          null;

        // Extract image URL — try reference image first
        let imageUrl = null;
        const imageRef =
          creative.content?.textAd?.image ||
          creative.content?.singleVideo?.thumbnail ||
          creative.content?.carousel?.cards?.[0]?.image ||
          null;

        if (imageRef) {
          // imageRef is a URN like "urn:li:digitalmediaAsset:..."
          const assetUrn = typeof imageRef === 'string' ? imageRef : imageRef?.id;
          if (assetUrn) {
            const assetRes = await fetch(
              `https://api.linkedin.com/rest/images/${encodeURIComponent(assetUrn)}`,
              { headers }
            );
            if (assetRes.ok) {
              const assetData = await assetRes.json();
              imageUrl = assetData.downloadUrl || assetData.originalUrl || null;
            }
          }
        }

        return {
          ...ad,
          name: name || ad.name,
          destinationUrl,
          imageUrl,
        };
      } catch (e) {
        console.error(`Failed to enrich ad ${ad.id}:`, e);
        return ad;
      }
    })
  );
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
    campaignBreakdown: [],
    adBreakdown: [],
  };

  const dateRangeParam = `dateRange=(start:(year:${parseInt(sy)},month:${parseInt(sm)},day:${parseInt(sd)}),end:(year:${parseInt(ey)},month:${parseInt(em)},day:${parseInt(ed)}))`;
  // Added otherEngagements to fields
  const fields = 'impressions,clicks,costInLocalCurrency,oneClickLeads,likes,comments,shares,follows,otherEngagements,landingPageClicks,leadGenerationMailContactInfoShares,oneClickLeadFormOpens,videoViews,videoCompletions,pivotValues';

  if (adIds && adIds.length > 0) {
    const creativeUrns = adIds.map(id => encodeURIComponent(`urn:li:sponsoredCreative:${id}`)).join(',');
    const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&creatives=List(${creativeUrns})&fields=${fields}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      aggregateData(allData, data.elements || [], 'ad');
    }

  } else if (campaignIds && campaignIds.length > 0) {
    const campaignUrns = campaignIds.map(id => encodeURIComponent(`urn:li:sponsoredCampaign:${id}`)).join(',');

    const campUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`;
    const campRes = await fetch(campUrl, { headers });
    if (campRes.ok) {
      const data = await campRes.json();
      aggregateData(allData, data.elements || [], 'campaign');
    }

    const adUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&campaigns=List(${campaignUrns})&fields=${fields}`;
    const adRes = await fetch(adUrl, { headers });
    if (adRes.ok) {
      const data = await adRes.json();
      data.elements?.forEach(el => {
        const urn = el.pivotValues?.[0];
        if (urn) {
          allData.adBreakdown.push({
            id: urn.split(':').pop(),
            impressions: el.impressions || 0,
            clicks: el.clicks || 0,
            spent: parseFloat(el.costInLocalCurrency || 0),
            leads: el.oneClickLeads || 0,
            likes: el.likes || 0,
            comments: el.comments || 0,
            shares: el.shares || 0,
            follows: el.follows || 0,
            otherEngagements: el.otherEngagements || 0,
          });
        }
      });
    }

  } else if (campaignGroupIds && campaignGroupIds.length > 0) {
    for (const groupId of campaignGroupIds) {
      const groupUrn = encodeURIComponent(`urn:li:sponsoredCampaignGroup:${groupId}`);
      const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&campaignGroups=List(${groupUrn})&fields=${fields}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        aggregateData(allData, data.elements || [], 'campaign');
      }

      // Also get ad-level breakdown for campaign group
      const adUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&campaignGroups=List(${groupUrn})&fields=${fields}`;
      const adRes = await fetch(adUrl, { headers });
      if (adRes.ok) {
        const data = await adRes.json();
        data.elements?.forEach(el => {
          const urn = el.pivotValues?.[0];
          if (urn) {
            allData.adBreakdown.push({
              id: urn.split(':').pop(),
              impressions: el.impressions || 0,
              clicks: el.clicks || 0,
              spent: parseFloat(el.costInLocalCurrency || 0),
              leads: el.oneClickLeads || 0,
              likes: el.likes || 0,
              comments: el.comments || 0,
              shares: el.shares || 0,
              follows: el.follows || 0,
              otherEngagements: el.otherEngagements || 0,
            });
          }
        });
      }
    }

  } else {
    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

      const campUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=${fields}`;
      const campRes = await fetch(campUrl, { headers });
      if (campRes.ok) {
        const data = await campRes.json();
        aggregateData(allData, data.elements || [], 'campaign');
      }

      const adUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=CREATIVE&timeGranularity=ALL&${dateRangeParam}&accounts=List(${accountUrn})&fields=${fields}`;
      const adRes = await fetch(adUrl, { headers });
      if (adRes.ok) {
        const data = await adRes.json();
        data.elements?.forEach(el => {
          const urn = el.pivotValues?.[0];
          if (urn) {
            allData.adBreakdown.push({
              id: urn.split(':').pop(),
              impressions: el.impressions || 0,
              clicks: el.clicks || 0,
              spent: parseFloat(el.costInLocalCurrency || 0),
              leads: el.oneClickLeads || 0,
              likes: el.likes || 0,
              comments: el.comments || 0,
              shares: el.shares || 0,
              follows: el.follows || 0,
              otherEngagements: el.otherEngagements || 0,
            });
          }
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
    const formOpens = (el.oneClickLeadFormOpens || 0) + (el.leadGenerationMailContactInfoShares || 0);
    allData.leadFormOpens += formOpens;

    if (urn && type === 'campaign') {
      allData.campaignBreakdown.push({
        id: urn.split(':').pop(),
        impressions: el.impressions || 0,
        clicks: el.clicks || 0,
        spent: parseFloat(el.costInLocalCurrency || 0),
        leads: el.oneClickLeads || 0,
        ctr: el.impressions > 0 ? ((el.clicks / el.impressions) * 100).toFixed(2) : '0.00',
      });
    }
  });
}

function calculateMetrics(data) {
  const { impressions, clicks, spend, leads, likes, comments, shares, follows,
    otherEngagements, landingPageClicks, leadFormOpens, videoViews, videoCompletions } = data;
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
    likes, comments, shares, follows, otherEngagements,
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
  return [...items]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, count);
}

function calculateBudgetPacing(data, dateRange) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const today = new Date();
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)), totalDays);
  return { budget: 0, spent: data.spend, daysTotal: totalDays, daysElapsed: elapsedDays };
}