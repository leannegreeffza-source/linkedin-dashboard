import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getServerSession();
  
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch ad accounts
    const accountsResponse = await fetch(
      'https://api.linkedin.com/rest/adAccounts?q=search&search=(status:(values:List(ACTIVE,DRAFT,CANCELED)))',
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'LinkedIn-Version': '202401',
          'X-RestLi-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('LinkedIn API Error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch ad accounts', details: errorText }, { status: accountsResponse.status });
    }

    const accountsData = await accountsResponse.json();
    
    if (!accountsData.elements || accountsData.elements.length === 0) {
      return NextResponse.json([]);
    }

    // For now, just transform account data into client format
    // In the future, we can fetch actual campaign data for each account
    const clientData = accountsData.elements.map((account, index) => ({
      clientId: index + 1,
      clientName: account.name || `Account ${account.id}`,
      campaigns: [
        {
          name: 'Sample Campaign',
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0
        }
      ]
    }));

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('LinkedIn API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}