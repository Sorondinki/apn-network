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

    // 1. Fetch current user details
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, referral_code, referralCode, balance")
      .eq("id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, message: "User record not found" },
        { status: 404 }
      );
    }

    const userRefCode = currentUser.referral_code || currentUser.referralCode || "";

    // 2. Comprehensive Query: Search by User ID or Referral Code across columns
    let filterQuery = `referred_by_id.eq.${userId},referredById.eq.${userId}`;
    if (userRefCode) {
      filterQuery += `,referred_by_code.eq.${userRefCode},referredByCode.eq.${userRefCode}`;
    }

    const { data: referrals, error: refError } = await supabase
      .from("users")
      .select("id, name, full_name, email, created_at, balance, is_verified, verified")
      .or(filterQuery)
      .order("created_at", { ascending: false });

    if (refError) {
      console.error("Supabase Referral Query Error:", refError);
      return NextResponse.json({ success: false, error: refError.message }, { status: 500 });
    }

    const formattedReferrals = (referrals || []).map((ref) => ({
      id: ref.id,
      name: ref.name || ref.full_name || "APN Miner",
      email: ref.email || "N/A",
      createdAt: ref.created_at,
      balance: parseFloat(ref.balance || "0").toFixed(2),
      isVerified: Boolean(ref.is_verified || ref.verified),
    }));

    const totalInvited = formattedReferrals.length;
    
    // Commission model: 5.0 APN per valid referral + tiered logic
    const commissionsEarned = (totalInvited * 5.0).toFixed(2);

    let tier = "Level 1 Miner (5% Boost)";
    if (totalInvited >= 50) {
      tier = "Master Node Ambassador (20% Boost)";
    } else if (totalInvited >= 20) {
      tier = "Level 3 Miner (15% Boost)";
    } else if (totalInvited >= 10) {
      tier = "Level 2 Miner (10% Boost)";
    }

    return NextResponse.json({
      success: true,
      referralCode: userRefCode,
      totalInvited,
      commissionsEarned,
      referrals: formattedReferrals,
      tier,
    });
  } catch (error: any) {
    console.error("Referral Fetch API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}