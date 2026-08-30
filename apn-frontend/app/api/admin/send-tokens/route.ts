import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mentorUserId, amount, masterPin } = body;

    // 1. Tabbatar da Master PIN
    const VALID_MASTER_PIN = process.env.MASTER_PIN || "APN-FOUNDER-2026#SECURE";

    if (!masterPin || String(masterPin).trim() !== VALID_MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Master Security PIN din da ka shigar ba daidai ba ne!" },
        { status: 401 }
      );
    }

    const tokenAmount = parseFloat(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Shigar da adadin tokens daidai." },
        { status: 400 }
      );
    }

    // 2. Samo asalin balance din User din daga Supabase
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("balance")
      .eq("id", mentorUserId)
      .maybeSingle();

    if (fetchErr || !user) {
      return NextResponse.json(
        { success: false, error: "Babu wannan amfani/mentor a cikin Database." },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(user.balance || "0");
    const newBalance = currentBalance + tokenAmount;

    // 3. Aiwatar da Real Database Transaction Update
    const { error: updateErr } = await supabase
      .from("User")
      .update({ balance: newBalance })
      .eq("id", mentorUserId);

    if (updateErr) {
      throw updateErr;
    }

    // 4. Yi rikodin a saman Teburin Transaction (Optional)
    try {
      await supabase.from("Transaction").insert([
        {
          userId: mentorUserId,
          amount: tokenAmount,
          type: "MENTOR_BONUS",
          description: `Founder direct bonus transfer (+${tokenAmount} APN)`,
        },
      ]);
    } catch (txErr) {
      console.log("Transaction log skipped.");
    }

    return NextResponse.json({
      success: true,
      message: `Cikakkiyar nasara! An tura ${tokenAmount} APN zuwa asusun mentor/user ɗin.`,
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
