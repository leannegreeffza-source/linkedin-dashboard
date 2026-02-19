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

      // Use accounts filter directly in the URL
      const url = `https://api.linkedin.com/rest/adCampaigns?q=search&search.account.values[0]=${accountUrn}&count=100`;
      console.log('Fetching campaigns URL:', url);

      const res = await fetch(url, { headers });
      console.log('Campaigns status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.error('Campaigns failed:', errText);

        // Fallback: try fetching all campaigns for the account using different param
        const fallbackUrl = `https://api.linkedin.com/rest/adCampaigns?q=search&accounts=List(${accountUrn})&count=100`;
        console.log('Trying fallback URL:', fallbackUrl);
        const fallbackRes = await fetch(fallbackUrl, { headers });
        console.log('Fallback status:', fallbackRes.status);

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          console.log('Fallback campaigns found:', fallbackData.elements?.length);
          (fallbackData.elements || []).forEach(c => {
            allCampaigns.push({
              id: c.id,
              name: c.name || `Campaign ${c.id}`,
              accountId,
              status: c.status,
            });
          });
        } else {
          console.error('Fallback also failed:', await fallbackRes.text());
        }
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