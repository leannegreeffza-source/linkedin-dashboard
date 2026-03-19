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
    if (!accountIds || accountIds.length === 0) return NextResponse.json([]);

    const allCampaigns = [];

    await Promise.all(accountIds.map(async (accountId) => {
      let start = 0;
      const count = 100;
      let hasMore = true;

      while (hasMore) {
        try {
          const res = await fetch(
            `https://api.linkedin.com/v2/adCampaignsV2?q=search&search.account.values[0]=urn:li:sponsoredAccount:${accountId}&fields=id,name,status,objectiveType,campaignGroup&count=${count}&start=${start}`,
            {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
                'LinkedIn-Version': '202401',
              },
            }
          );

          if (!res.ok) {
            console.error(`Campaigns failed for account ${accountId}:`, await res.text());
            break;
          }

          const data = await res.json();
          const elements = data.elements || [];

          elements.forEach(c => {
            const rawId = c.id;
            const id = typeof rawId === 'string' && rawId.includes(':')
              ? parseInt(rawId.split(':').pop())
              : parseInt(rawId);
            const name = c.name || c.displayName || `Campaign ${id}`;
            const groupId = c.campaignGroup
              ? String(c.campaignGroup).split(':').pop()
              : null;
            allCampaigns.push({
              id,
              name,
              accountId: parseInt(accountId),
              status: c.status || 'ACTIVE',
              objectiveType: c.objectiveType || '',
              campaignGroupId: groupId,
            });
          });

          const paging = data.paging;
          hasMore = paging?.total ? start + count < paging.total : elements.length === count;
          start += count;
          if (start >= 1000) break;
        } catch (err) {
          console.error(`Campaigns error for account ${accountId}:`, err);
          break;
        }
      }
    }));

    allCampaigns.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(allCampaigns);
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
