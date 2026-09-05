import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("userId") || searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID parameter is required." },
        { status: 400 }
      );
    }

    // Zaɓar dukkan muhimman columns ciki har da Wallet Address, Staking, da dukkan bayanan Boosting
    const { data: user, error } = await supabase
      .from("User")
      .select(
        `id, 
         name, 
         email, 
         walletAddress, 
         balance, 
         stakedBalance, 
         lastYieldClaimTime, 
         unclaimedYield,
         canWithdraw,
         isMining,
         miningStartTime,
         miningSpeed,
         miningMultiplier,
         boosterPlan,
         boosterExpiresAt,
         isBoosting,
         role,
         isVerified`
      )
      .eq("id", id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    // Tabbatar da cewa idan lokacin boost ya wuce, an kula da hakan ba tare da matsala ba
    let activeBoosting = user.isBoosting;
    if (user.boosterExpiresAt) {
      const expiryDate = new Date(user.boosterExpiresAt).getTime();
      if (Date.now() > expiryDate) {
        activeBoosting = false;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isBoosting: activeBoosting,
      },
    });
  } catch (error: any) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
