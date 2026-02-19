import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = session.accessToken;

    const res = await fetch(
      "https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values[0]=BUSINESS&search.status.values[0]=ACTIVE",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202302",
        },
      }
    );

    const data = await res.json();

    const accounts = (data.elements || []).map((acc) => ({
      id: acc.id,
      name: acc.name,
    }));

    return NextResponse.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}