import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both parameter names for flexible invocation
    const targetId = body.mentorUserId || body.targetUserId;
    const { amount, masterPin } = body;

    // Validate Master Security PIN
    const VALID_MASTER_PIN = process.env.MASTER_PIN || "APN-FOUNDER-2026#SECURE";

    if (!masterPin || String(masterPin).trim() !== VALID_MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Invalid Master Security PIN!" },
        { status: 401 }
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Please select a valid user or mentor." },
        { status: 400 }
      );
    }

    const tokenAmount = parseFloat(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid token amount." },
        { status: 400 }
      );
    }

    // Fetch user balance
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("id, balance")
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr || !user) {
      return NextResponse.json(
        { success: false, error: "Target user or mentor not found in database." },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(user.balance || "0");
    const newBalance = currentBalance + tokenAmount;

    // Update user balance
    const { error: updateErr } = await supabase
      .from("User")
      .update({ balance: newBalance })
      .eq("id", targetId);

    if (updateErr) {
      console.error("User balance update error:", updateErr);
      return NextResponse.json(
        { success: false, error: "Failed to update user token balance." },
        { status: 500 }
      );
    }

    // Log transaction record
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
      message: `Successfully transferred ${tokenAmount} APN to the recipient.`,
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
  
