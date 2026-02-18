import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'accounts';

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    // MODE: accounts - fetch ALL accounts (we'll add spend filtering later)
    if (mode === 'accounts') {
      console.log('Fetching all accounts...');

      let allAccounts = [];
      let start = 0;
      const pageSize = 100;

      while (start < 10000) {
        const accountsResponse = await fetch(
          `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
          { headers }
        );

        if (!accountsResponse.ok) {
          console.error('Account fetch failed:', await accountsResponse.text());
          break;
        }

        const accountsData = await accountsResponse.json();
        const elements = accountsData.elements || [];
        
        if (elements.length === 0) break;
        
        allAccounts = [...allAccounts, ...elements];
        console.log(`Loaded ${allAccounts.length} accounts so far...`);
        
        if (elements.length < pageSize) break;
        start += pageSize;
      }

      console.log(`Total accounts loaded: ${allAccounts.length}`);

      const accountList = allAccounts.map(account => ({
        clientId: account.id,
        clientName: account.name || `Account ${account.id}`,
      }));

      return NextResponse.json(accountList);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
