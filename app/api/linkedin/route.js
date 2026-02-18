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

    if (mode === 'accounts') {
      console.log('Fetching all accounts...');
      
      let allAccounts = [];
      let start = 0;
      const pageSize = 100;

      // Load up to 10000 accounts to ensure we get all 671
      while (start < 10000) {
        const res = await fetch(
          `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
          { headers }
        );

        if (!res.ok) {
          console.error('Account fetch failed at start=' + start);
          break;
        }

        const data = await res.json();
        const elements = data.elements || [];
        
        if (elements.length === 0) {
          console.log('No more accounts to load');
          break;
        }
        
        allAccounts = [...allAccounts, ...elements];
        console.log(`Loaded ${allAccounts.length} accounts so far...`);
        
        if (elements.length < pageSize) {
          console.log('Last page reached');
          break;
        }
        
        start += pageSize;
      }

      console.log(`Total accounts loaded: ${allAccounts.length}`);

      return NextResponse.json(allAccounts.map(acc => ({
        clientId: acc.id,
        clientName: acc.name || `Account ${acc.id}`,
      })));
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
