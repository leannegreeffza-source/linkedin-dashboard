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
      'LinkedIn-Version': '202302',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const allCampaigns = [];

    for (const accountId of accountIds) {
      const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`);
      const url = `https://api.linkedin.com/v2/adCampaignsV2?q=search&search.account.values[0]=${accountUrn}&count=100`;

      console.log('Fetching campaigns URL:', url);
      const res = await fetch(url, { headers });
      console.log('Campaigns status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error('Campaigns failed:', errText);
        continue;
      }

      const data = await res.json();
      console.log('Campaigns found:', data.elements?.length);

      (data.elements || []).forEach(c => {
        allCampaigns.push({
          id: c.id,
          name: c.name || `Campaign ${c.id}`,
          accountId,
          status: c.status,
        });
      });
    }

    console.log('Total campaigns:', allCampaigns.length);
    return NextResponse.json(allCampaigns);

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}