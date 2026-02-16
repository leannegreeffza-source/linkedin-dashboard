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
      'https://api.linkedin.com/rest/adAccounts?q=search&search=(status:(values:List(ACTIVE,DRAFT)))',
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'LinkedIn-Version': '202401',
          'X-RestLi-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!accountsResponse.ok) {
      throw new Error('Failed to fetch ad accounts');
    }

    const accountsData = await accountsResponse.json();
    
    // Transform data to match your dashboard format
    const clientData = accountsData.elements.map((account, index) => ({
      clientId: index + 1,
      clientName: account.name || `Account ${account.id}`,
      campaigns: [] // We'll add campaign data in the next step
    }));

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('LinkedIn API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}