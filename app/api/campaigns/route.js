import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { accountIds } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const allCampaigns = [];

    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);

      const res = await fetch(
        `https://api.linkedin.com/rest/adCampaigns?q=search&search.account.values[0]=${accountUrn}&count=100`,
        { headers }
      );

      if (!res.ok) {
        console.error('Failed to fetch campaigns for account', accountId, await res.text());
        continue;
      }

      const data = await res.json();
      (data.elements || []).forEach(c => {
        allCampaigns.push({
          id: c.id,
          name: c.name || `Campaign ${c.id}`,
          accountId,
          status: c.status,
          totalBudget: c.totalBudget?.amount || 0,
          dailyBudget: c.dailyBudget?.amount || 0,
        });
      });
    }

    return NextResponse.json(allCampaigns);

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}