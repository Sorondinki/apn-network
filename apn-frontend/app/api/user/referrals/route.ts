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

    // 1. Tabbatar da cewa ba a saka columns da babu a table din User ba (Kamar lastActive)
    const { data: referrals, error, count } = await supabase
      .from("User")
      .select(
        "id, fullName, name, email, phone, createdAt, balance, isMining, miningStartTime, miningSpeed, isBoosting",
        { count: "exact" }
      )
      .eq("referredById", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Fetch referrals database error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    const referralList = referrals || [];
    const totalInvited = count ?? referralList.length;

    // Lissafin Active Miners da Idle
    const activeMinersCount = referralList.filter((r) => r.isMining === true).length;
    const idleMinersCount = totalInvited - activeMinersCount;

    // Bonus & Tier Calculation
    const bonusPerReferral = 5.0;
    const commissionsEarned = (totalInvited * bonusPerReferral).toFixed(2);

    const calculatedLevel = Math.floor(totalInvited / 10) + 1;
    let tierName = `Level ${calculatedLevel} Miner`;

    if (calculatedLevel === 2) tierName = `Level 2 Validator`;
    else if (calculatedLevel === 3) tierName = `Level 3 Master Node`;
    else if (calculatedLevel === 4) tierName = `Level 4 Network Founder`;
    else if (calculatedLevel >= 5) tierName = `Level ${calculatedLevel} Protocol Pioneer`;

    return NextResponse.json({
      success: true,
      totalInvited,
      activeMinersCount,
      idleMinersCount,
      commissionsEarned,
      tier: tierName,
      level: calculatedLevel,
      referrals: referralList,
    });
  } catch (err: any) {
    console.error("Referral API Crash Prevented:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
