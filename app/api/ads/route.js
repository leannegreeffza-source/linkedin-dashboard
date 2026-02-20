import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { campaignIds } = await request.json();

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const allAds = [];

    for (const campaignId of campaignIds) {
      const campaignUrn = encodeURIComponent(`urn:li:sponsoredCampaign:${campaignId}`);
      const url = `https://api.linkedin.com/rest/adCreatives?q=search&search.campaign.values[0]=${campaignUrn}&count=100`;
      console.log('Fetching ads URL:', url);

      const res = await fetch(url, { headers });
      console.log('Ads status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error('Ads failed:', errText);
        continue;
      }

      const data = await res.json();
      console.log('Ads found:', data.elements?.length);

      (data.elements || []).forEach(a => {
        allAds.push({
          id: a.id,
          name: a.name || `Ad ${a.id}`,
          campaignId,
          status: a.status,
        });
      });
    }

    console.log('Total ads:', allAds.length);
    return NextResponse.json(allAds);

  } catch (error) {
    console.error('Ads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}