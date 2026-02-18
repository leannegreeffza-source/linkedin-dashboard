import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for this function

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
      console.log('Fetching ALL accounts - no limit...');
      
      let allAccounts = [];
      let start = 0;
      const pageSize = 100;
      let consecutiveEmptyPages = 0;

      // Keep fetching until we get 3 consecutive empty pages (to be absolutely sure)
      while (consecutiveEmptyPages < 3) {
        console.log(`Fetching page starting at ${start}...`);
        
        const res = await fetch(
          `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
          { headers }
        );

        if (!res.ok) {
          console.error(`Account fetch failed at start=${start}:`, await res.text());
          break;
        }

        const data = await res.json();
        const elements = data.elements || [];
        
        if (elements.length === 0) {
          consecutiveEmptyPages++;
          console.log(`Empty page ${consecutiveEmptyPages}/3 at start=${start}`);
          start += pageSize; // Continue checking
          continue;
        }
        
        // Reset empty page counter when we get results
        consecutiveEmptyPages = 0;
        
        allAccounts = [...allAccounts, ...elements];
        console.log(`Loaded ${allAccounts.length} accounts total...`);
        
        // If we got fewer than pageSize, we're likely near the end
        if (elements.length < pageSize) {
          console.log(`Got ${elements.length} accounts (less than ${pageSize}), checking a few more pages...`);
        }
        
        start += pageSize;
      }

      console.log(`✅ FINAL: Loaded ${allAccounts.length} accounts total`);

      // Remove duplicates by ID (just in case)
      const uniqueAccounts = Array.from(
        new Map(allAccounts.map(acc => [acc.id, acc])).values()
      );

      console.log(`After deduplication: ${uniqueAccounts.length} unique accounts`);

      return NextResponse.json(uniqueAccounts.map(acc => ({
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
