import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Karbi ID din mutum ta ko wacce kalma aka aiko ta (mentorUserId ko targetUserId)
    const targetId = body.mentorUserId || body.targetUserId;
    const { amount, masterPin } = body;

    // 2. Tabbatar da Master PIN
    const VALID_MASTER_PIN = process.env.MASTER_PIN || "APN-FOUNDER-2026#SECURE";

    if (!masterPin || String(masterPin).trim() !== VALID_MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Master Security PIN din da ka shigar ba daidai ba ne!" },
        { status: 401 }
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Zaɓi memba ko mentor da kake son tura mawa tokens." },
        { status: 400 }
      );
    }

    const tokenAmount = parseFloat(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Shigar da adadin tokens daidai." },
        { status: 400 }
      );
    }

    // 3. Samo asalin balance din User din daga Supabase
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("id, balance")
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr || !user) {
      return NextResponse.json(
        { success: false, error: "Babu wannan amfani/mentor a cikin Database." },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(user.balance || "0");
    const newBalance = currentBalance + tokenAmount;

    // 4. Update a teburin User
    const { error: updateErr } = await supabase
      .from("User")
      .update({ balance: newBalance })
      .eq("id", targetId);

    if (updateErr) {
      console.error("User balance update error:", updateErr);
      return NextResponse.json(
        { success: false, error: "An samu kuskure wajen sabunta balance din mutum." },
        { status: 500 }
      );
    }

    // 5. Rikodin Transaction a cikin teburin Transaction
    const { error: txErr } = await supabase
      .from("Transaction")
      .insert([
        {
          userId: targetId,
          amount: tokenAmount,
          type: "FOUNDER_AIRDROP",
          description: `Founder direct bonus transfer (+${tokenAmount} APN)`,
        },
      ]);

    if (txErr) {
      console.error("Transaction insert log failed:", txErr);
    }

    return NextResponse.json({
      success: true,
      message: `Cikakkiyar nasara! An tura ${tokenAmount} APN zuwa asusun amfani/mentor ɗin.`,
      newBalance: newBalance,
    });

  } catch (error: any) {
    console.error("Send Tokens Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
