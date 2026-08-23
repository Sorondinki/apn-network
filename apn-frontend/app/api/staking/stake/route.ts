// app/api/staking/stake/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();
    const stakeAmount = parseFloat(amount);

    if (!userId || isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ error: "Invalid user or staking amount" }, { status: 400 });
    }

    // 1. Fetch current user balance
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("balance, staked_balance, stakedBalance")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = parseFloat(user.balance || "0");
    const currentStaked = parseFloat(user.staked_balance || user.stakedBalance || "0");

    // 2. Check for sufficient balance
    if (currentBalance < stakeAmount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 3. Calculate new balances
    const newBalance = currentBalance - stakeAmount;
    const newStakedBalance = currentStaked + stakeAmount;

    // 4. Update database
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        balance: newBalance,
        staked_balance: newStakedBalance,
        stakedBalance: newStakedBalance,
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      stakedBalance: updatedUser.staked_balance || updatedUser.stakedBalance,
    });
  } catch (error: any) {
    console.error("Staking Error:", error);
    return NextResponse.json({ error: error?.message || "Staking failed" }, { status: 500 });
  }
}
