import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { current, previous, topCampaigns, topAds, budgetPacing, currentRange, previousRange, selectedCampaigns, exchangeRate } = await request.json();

    const avgCTR = current.ctr?.toFixed(2) || '0.00';
    const avgCPL = current.cpl?.toFixed(2) || '0.00';
    const avgCPM = current.cpm?.toFixed(2) || '0.00';
    const avgCPC = current.cpc?.toFixed(2) || '0.00';

    const prompt = `You are a LinkedIn Ads expert. Analyze the following campaign data and return a JSON object ONLY — no markdown, no explanation, just raw JSON.

Campaign Data:
- Period: ${currentRange.start} to ${currentRange.end}
- Compare Period: ${previousRange.start} to ${previousRange.end}
- Impressions: ${current.impressions.toLocaleString()} (prev: ${previous.impressions.toLocaleString()})
- Clicks: ${current.clicks.toLocaleString()} (prev: ${previous.clicks.toLocaleString()})
- CTR: ${avgCTR}% (prev: ${previous.ctr?.toFixed(2)}%)
- Spend: ${current.spent.toFixed(2)} (prev: ${previous.spent.toFixed(2)})
- CPM: ${avgCPM} (prev: ${previous.cpm?.toFixed(2)})
- CPC: ${avgCPC} (prev: ${previous.cpc?.toFixed(2)})
- Leads: ${current.leads} (prev: ${previous.leads})
- CPL: ${avgCPL} (prev: ${previous.cpl?.toFixed(2)})
- Engagement Rate: ${current.engagementRate?.toFixed(2)}%
- Engagements: ${current.engagements}

Top Campaigns:
${topCampaigns?.map(c => `- ID ${c.id}: ${c.impressions} impressions, ${c.clicks} clicks, ${c.ctr}% CTR, ${c.spent.toFixed(2)} spent, ${c.leads || 0} leads`).join('\n') || 'No data'}

Return this exact JSON structure (fill in all values based on the data):
{
  "executiveSummary": "2-3 sentence overview of performance",
  "overallPerformance": "optimal|warning|critical",
  "keyMetrics": {
    "impressionsChange": "+X% or -X%",
    "clicksChange": "+X% or -X%",
    "ctrChange": "+X% or -X%",
    "spendChange": "+X% or -X%",
    "cplChange": "+X% or -X%"
  },
  "campaignAnalysis": [
    {
      "id": "campaign_id",
      "performance": "above|below|at benchmark",
      "status": "optimal|warning|critical",
      "trend": "up|down|stable",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  ],
  "topPerformers": ["insight 1", "insight 2", "insight 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "strategicRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
  "budgetRecommendation": "specific budget advice based on the data",
  "immediateActions": ["action 1", "action 2", "action 3"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    let reportJson;
    try {
      const text = message.content[0].text.replace(/```json|```/g, '').trim();
      reportJson = JSON.parse(text);
    } catch (e) {
      reportJson = {
        executiveSummary: message.content[0].text,
        overallPerformance: 'warning',
        keyMetrics: {},
        campaignAnalysis: [],
        topPerformers: [],
        areasForImprovement: [],
        strategicRecommendations: [],
        budgetRecommendation: '',
        immediateActions: []
      };
    }

    return NextResponse.json({
      report: reportJson,
      metrics: { current, previous, topCampaigns, topAds },
      period: { currentRange, previousRange }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}