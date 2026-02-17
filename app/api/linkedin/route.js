import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get token directly from request (more reliable than getServerSession)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated - please sign in' }, { status: 401 });
    }

    if (!token.accessToken) {
      return NextResponse.json({ error: 'No LinkedIn access token found' }, { status: 401 });
    }

    // Test the token with a simple profile request first
    const profileResponse = await fetch(
      'https://api.linkedin.com/rest/adAccounts?q=search&search=(status:(values:List(ACTIVE,DRAFT)))',
      {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'LinkedIn-Version': '202401',
          'X-RestLi-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('LinkedIn API Error Status:', profileResponse.status);
      console.error('LinkedIn API Error Body:', errorText);
      return NextResponse.json({ 
        error: 'LinkedIn API request failed', 
        status: profileResponse.status,
        details: errorText 
      }, { status: profileResponse.status });
    }

    const accountsData = await profileResponse.json();
    console.log('LinkedIn accounts fetched:', JSON.stringify(accountsData));

    if (!accountsData.elements || accountsData.elements.length === 0) {
      console.log('No ad accounts found');
      return NextResponse.json([]);
    }

    // Transform accounts into client format
    const clientData = await Promise.all(
      accountsData.elements.map(async (account, index) => {
        try {
          // Fetch campaigns for this account
          const campaignsResponse = await fetch(
            `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(urn%3Ali%3AsponsoredAccount%3A${account.id})))`,
            {
              headers: {
                'Authorization': `Bearer ${token.accessToken}`,
                'LinkedIn-Version': '202401',
                'X-RestLi-Protocol-Version': '2.0.0',
              },
            }
          );

          let campaigns = [];

          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            campaigns = (campaignsData.elements || []).map(campaign => ({
              name: campaign.name || 'Unnamed Campaign',
              impressions: 0,
              clicks: 0,
              spend: campaign.totalBudget?.amount ? parseFloat(campaign.totalBudget.amount) : 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }));
          }

          if (campaigns.length === 0) {
            campaigns = [{
              name: 'No campaigns found',
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }];
          }

          return {
            clientId: index + 1,
            clientName: account.name || `LinkedIn Account ${account.id}`,
            campaigns,
          };
        } catch (err) {
          console.error('Error fetching campaigns for account:', account.id, err);
          return {
            clientId: index + 1,
            clientName: account.name || `LinkedIn Account ${account.id}`,
            campaigns: [{
              name: 'Could not load campaigns',
              impressions: 0,
              clicks: 0,
              spend: 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }],
          };
        }
      })
    );

    return NextResponse.json(clientData);

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}