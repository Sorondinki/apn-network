// app/api/user/referrals/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch current user to get their referral code
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("referral_code, referralCode, balance")
      .eq("id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userRefCode = currentUser.referral_code || currentUser.referralCode;

    // 2. Fetch referrals
    const { data: referrals, error: refError } = await supabase
      .from("users")
      .select("id, name, created_at, email")
      .or(`referred_by_id.eq.${userId},referredById.eq.${userId}`);

    if (refError) {
      console.error("Supabase Referral Query Error:", refError);
      return NextResponse.json({ success: false, error: refError.message }, { status: 500 });
    }

    const totalInvited = referrals ? referrals.length : 0;
    const commissionsEarned = (totalInvited * 5.0).toFixed(2);

    return NextResponse.json({
      success: true,
      referralCode: userRefCode,
      totalInvited,
      commissionsEarned,
      referrals: referrals || [],
      tier: totalInvited >= 10 ? "Level 2 Miner" : "Level 1 Miner",
    });
  } catch (error: any) {
    console.error("Referral Fetch API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}