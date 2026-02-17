import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import LinkedInProvider from 'next-auth/providers/linkedin';

// Auth options must match your [...nextauth]/route.js
export const authOptions = {
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress r_ads r_ads_reporting',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!session.accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    // Fetch your LinkedIn ad accounts
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
      const errorText = await accountsResponse.text();
      console.error('LinkedIn API Error:', errorText);
      return NextResponse.json(
        { error: 'LinkedIn API failed', details: errorText },
        { status: accountsResponse.status }
      );
    }

    const accountsData = await accountsResponse.json();

    if (!accountsData.elements || accountsData.elements.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch campaigns for each account
    const clientData = await Promise.all(
      accountsData.elements.map(async (account, index) => {
        try {
          const campaignsResponse = await fetch(
            `https://api.linkedin.com/rest/adCampaigns?q=search&search=(account:(values:List(urn%3Ali%3AsponsoredAccount%3A${account.id})),status:(values:List(ACTIVE,PAUSED,DRAFT)))`,
            {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`,
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
              impressions: campaign.totalBudget?.amount ? parseInt(campaign.totalBudget.amount) : 0,
              clicks: 0,
              spend: campaign.totalBudget?.amount ? parseFloat(campaign.totalBudget.amount) : 0,
              conversions: 0,
              ctr: 0,
              cpc: 0,
            }));
          }

          // If no campaigns found, add a placeholder
          if (campaigns.length === 0) {
            campaigns = [{
              name: 'No active campaigns',
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
            clientName: account.name || `Account ${account.id}`,
            campaigns,
          };
        } catch (err) {
          return {
            clientId: index + 1,
            clientName: account.name || `Account ${account.id}`,
            campaigns: [{
              name: 'Error loading campaigns',
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
    console.error('LinkedIn API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}