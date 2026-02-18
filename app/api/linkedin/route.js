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

    // MODE: accounts - fetch only active accounts with spend in last 3 months
    if (mode === 'accounts') {
      console.log('Fetching active accounts with spend...');

      // Calculate date 3 months ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const startDay = 1;

      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      const endDay = endDate.getDate();

      // Fetch ALL accounts first
      let allAccounts = [];
      let start = 0;
      const pageSize = 100;

      console.log('Step 1: Fetching all accounts...');
      while (start < 10000) {
        const accountsResponse = await fetch(
          `https://api.linkedin.com/rest/adAccounts?q=search&pageSize=${pageSize}&start=${start}`,
          { headers }
        );

        if (!accountsResponse.ok) break;

        const accountsData = await accountsResponse.json();
        const elements = accountsData.elements || [];
        
        if (elements.length === 0) break;
        
        allAccounts = [...allAccounts, ...elements];
        
        if (elements.length < pageSize) break;
        start += pageSize;
      }

      console.log(`Total accounts fetched: ${allAccounts.length}`);

      // Fetch analytics at account level to find which accounts have spend
      console.log('Step 2: Checking which accounts have spend in last 3 months...');
      
      const accountUrns = allAccounts
        .map(acc => encodeURIComponent(`urn:li:sponsoredAccount:${acc.id}`))
        .join(',');

      // Use account-level analytics to get spend data
      const analyticsUrl = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=ACCOUNT&dateRange=(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))&accounts=List(${accountUrns})&fields=costInLocalCurrency,pivotValues`;

      const analyticsResponse = await fetch(analyticsUrl, { headers });

      let activeAccountIds = new Set();

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        (analyticsData.elements || []).forEach(element => {
          const spend = parseFloat(element.costInLocalCurrency || 0);
          if (spend > 0) {
            const accountUrn = element.pivotValues?.[0];
            if (accountUrn) {
              // Extract account ID from URN: urn:li:sponsoredAccount:12345
              const accountId = accountUrn.split(':').pop();
              activeAccountIds.add(accountId);
            }
          }
        });
      } else {
        console.error('Analytics fetch failed:', await analyticsResponse.text());
        // If analytics fails, return all accounts as fallback
        const accountList = allAccounts.map(account => ({
          clientId: account.id,
          clientName: account.name || `Account ${account.id}`,
        }));
        return NextResponse.json(accountList);
      }

      console.log(`Active accounts with spend: ${activeAccountIds.size}`);

      // Filter to only accounts with spend
      const activeAccounts = allAccounts
        .filter(account => activeAccountIds.has(account.id))
        .map(account => ({
          clientId: account.id,
          clientName: account.name || `Account ${account.id}`,
        }));

      console.log(`Returning ${activeAccounts.length} active accounts`);
      return NextResponse.json(activeAccounts);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDefaultStartDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}