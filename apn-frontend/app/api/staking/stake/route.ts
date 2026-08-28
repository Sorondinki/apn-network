import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, amount, action = "STAKE" } = await req.json();
    const stakeAmount = parseFloat(amount);

    if (!userId || isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ error: "Invalid user or amount provided" }, { status: 400 });
    }

    // 1. Fetch current user balance from database
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("balance, staked_balance, stakedBalance")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const currentBalance = parseFloat(user.balance || "0");
    const currentStaked = parseFloat(user.staked_balance || user.stakedBalance || "0");

    let newBalance = currentBalance;
    let newStakedBalance = currentStaked;

    if (action === "STAKE") {
      // Check for sufficient main balance
      if (currentBalance < stakeAmount) {
        return NextResponse.json({ error: "Insufficient balance to stake" }, { status: 400 });
      }
      newBalance = currentBalance - stakeAmount;
      newStakedBalance = currentStaked + stakeAmount;
    } else if (action === "UNSTAKE") {
      // Check for sufficient staked balance
      if (currentStaked < stakeAmount) {
        return NextResponse.json({ error: "Insufficient staked balance to withdraw" }, { status: 400 });
      }
      newBalance = currentBalance + stakeAmount;
      newStakedBalance = currentStaked - stakeAmount;
    }

    // 2. Prepare payload compatible with your schema
    const updateData: any = {
      balance: newBalance,
    };

    if (user.staked_balance !== undefined) {
      updateData.staked_balance = newStakedBalance;
    }
    if (user.stakedBalance !== undefined) {
      updateData.stakedBalance = newStakedBalance;
    }
    if (user.staked_balance === undefined && user.stakedBalance === undefined) {
      updateData.staked_balance = newStakedBalance;
    }

    // 3. Update persistent database record
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const finalStaked = updatedUser.staked_balance !== undefined 
      ? updatedUser.staked_balance 
      : updatedUser.stakedBalance;

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      stakedBalance: finalStaked,
    });
  } catch (error: any) {
    console.error("Staking Processing Error:", error);
    return NextResponse.json({ error: error?.message || "Staking transaction failed" }, { status: 500 });
  }
}