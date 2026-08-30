import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // CPALead Postback Parameters
    const userId = searchParams.get("subid"); // ID din mai amfani da APN (User ID)
    const payoutStr = searchParams.get("payout"); // Adadin Dalar da CPALead suka biya ($)
    const ipAddress = searchParams.get("ip");
    const password = searchParams.get("password"); // Postback Password daga CPALead

    // Security check: Tabbatar Postback Password din ya yi daidai da na CPALead
    const MY_CPALEAD_POSTBACK_PASSWORD = process.env.CPALEAD_POSTBACK_PASSWORD || "APN_SECRET_12345";

    if (password !== MY_CPALEAD_POSTBACK_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    if (!userId || !payoutStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const dollarPayout = parseFloat(payoutStr);
    
    // Lissafe-lissafe: Kowane $1.00 za a ba mai amfani Token APN 10 (ko gwargwadon tsarin da ka saita)
    const apnReward = dollarPayout * 10;

    // TODO: Anan za ka yi update na database (Prisma / Supabase) domin kara apnReward a asusun userId
    console.log(`[CPALead Webhook] User ${userId} completed offer. Earned $${dollarPayout} -> Awarded ${apnReward} APN`);

    return NextResponse.json({ success: true, message: "Reward credited successfully" }, { status: 200 });

  } catch (error) {
    console.error("CPALead Postback error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
