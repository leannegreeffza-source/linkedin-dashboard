import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { current, previous, topAds, budgetPacing, currentRange, previousRange, selectedCampaigns } = await request.json();

    const prompt = `You are a LinkedIn Ads expert and performance marketing consultant. Analyze the following LinkedIn campaign data and provide a detailed report with actionable optimisation recommendations.

## Campaign Data

**Reporting Period:** ${currentRange.start} to ${currentRange.end}
**Compare Period:** ${previousRange.start} to ${previousRange.end}
**Selected Campaigns:** ${selectedCampaigns?.length > 0 ? selectedCampaigns.join(', ') : 'All campaigns'}

### Current Period Performance
- Impressions: ${current.impressions.toLocaleString()}
- Clicks: ${current.clicks.toLocaleString()}
- CTR: ${current.ctr.toFixed(2)}%
- Spend: ${current.spent.toFixed(2)}
- CPM: ${current.cpm.toFixed(2)}
- CPC: ${current.cpc.toFixed(2)}
- Leads: ${current.leads}
- CPL: ${current.cpl.toFixed(2)}
- Engagement Rate: ${current.engagementRate.toFixed(2)}%
- Engagements: ${current.engagements.toLocaleString()}

### Previous Period Performance
- Impressions: ${previous.impressions.toLocaleString()}
- Clicks: ${previous.clicks.toLocaleString()}
- CTR: ${previous.ctr.toFixed(2)}%
- Spend: ${previous.spent.toFixed(2)}
- CPM: ${previous.cpm.toFixed(2)}
- CPC: ${previous.cpc.toFixed(2)}
- Leads: ${previous.leads}
- CPL: ${previous.cpl.toFixed(2)}
- Engagement Rate: ${previous.engagementRate.toFixed(2)}%
- Engagements: ${previous.engagements.toLocaleString()}

### Period-over-Period Changes
- Impressions: ${previous.impressions > 0 ? (((current.impressions - previous.impressions) / previous.impressions) * 100).toFixed(1) : 'N/A'}%
- Clicks: ${previous.clicks > 0 ? (((current.clicks - previous.clicks) / previous.clicks) * 100).toFixed(1) : 'N/A'}%
- CTR: ${previous.ctr > 0 ? (((current.ctr - previous.ctr) / previous.ctr) * 100).toFixed(1) : 'N/A'}%
- Spend: ${previous.spent > 0 ? (((current.spent - previous.spent) / previous.spent) * 100).toFixed(1) : 'N/A'}%
- CPL: ${previous.cpl > 0 ? (((current.cpl - previous.cpl) / previous.cpl) * 100).toFixed(1) : 'N/A'}%

### Top Performing Campaigns
${topAds?.map(ad => `- Campaign ID ${ad.id}: ${ad.impressions.toLocaleString()} impressions, ${ad.clicks} clicks, ${ad.ctr}% CTR, ${ad.spent.toFixed(2)} spent`).join('\n') || 'No data'}

### Budget & Pacing
- Total Spend: ${budgetPacing?.spent?.toFixed(2) || 0}
- Days Elapsed: ${budgetPacing?.daysElapsed || 0} of ${budgetPacing?.daysTotal || 0} days

Please provide your response in the following structure:

## Executive Summary
A 2-3 sentence overview of campaign performance.

## Performance Analysis
Analyze each key metric (CTR, CPM, CPC, CPL, Engagement Rate) and what the trends mean.

## What's Working Well
List 3-5 specific positive findings with brief explanations.

## Areas of Concern
List 3-5 specific issues or underperformance areas with brief explanations.

## Optimisation Recommendations
Provide 5-8 specific, actionable recommendations. For each:
- **Recommendation title**
- What to do (specific action)
- Why (data-backed reasoning)
- Expected impact

## Budget Recommendations
Specific advice on budget allocation and pacing based on the data.

## Next Steps
A prioritized list of the top 3 actions to take immediately.

Be specific, data-driven, and practical. Reference actual numbers from the data provided.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const reportText = message.content[0].text;
    return NextResponse.json({ report: reportText });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}