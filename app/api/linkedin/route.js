import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      'Linkedin-Version': '202504',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    // Fetch accounts - simple pagination
    let accounts = [];
    let start = 0;

    while (start < 1000) {
      const response = await fetch(
        `https://api.linkedin.com/rest/adAccounts?q=search&start=${start}&count=100`,
        { headers }
      );

      if (!response.ok) {
        console.error('API Error:', response.status);
        break;
      }

      const data = await response.json();
      const elements = data.elements || [];
      
      if (elements.length === 0) break;
      
      accounts.push(...elements);
      
      if (elements.length < 100) break;
      start += 100;
    }

    console.log(`Loaded ${accounts.length} accounts`);

    return NextResponse.json(
      accounts.map(acc => ({
        id: acc.id,
        name: acc.name || `Account ${acc.id}`,
      }))
    );

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}