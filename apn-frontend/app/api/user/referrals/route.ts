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

    // Zaƙulo bayanan referrals ta amfani da `fullName` maimakon `name`
    const { data: referrals, error, count } = await supabase
      .from("User")
      .select("id, fullName, email, createdAt, balance, isMining, lastActive, miningStartTime", { count: "exact" })
      .eq("referredById", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Fetch referrals error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    const totalInvited = count ?? referrals?.length ?? 0;
    const bonusPerReferral = 5.0;
    const commissionsEarned = (totalInvited * bonusPerReferral).toFixed(2);

    const calculatedLevel = Math.floor(totalInvited / 10) + 1;
    let tierName = `Level ${calculatedLevel} Miner`;

    if (calculatedLevel === 2) tierName = `Level 2 Validator`;
    else if (calculatedLevel === 3) tierName = `Level 3 Master Node`;
    else if (calculatedLevel === 4) tierName = `Level 4 Network Founder`;
    else if (calculatedLevel >= 5) tierName = `Level ${calculatedLevel} Tier Commander`;

    return NextResponse.json({
      success: true,
      totalInvited,
      commissionsEarned,
      tier: tierName,
      level: calculatedLevel,
      referrals: referrals || [],
    });
  } catch (err: any) {
    console.error("Referral API Crash Prevented:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
    
