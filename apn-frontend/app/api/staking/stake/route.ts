import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, amount, action = "STAKE" } = body;

    // Tabbatar da cewa akwai user identifier
    if (!userId && !email) {
      return NextResponse.json(
        { error: "User ID or Email is required" },
        { status: 400 }
      );
    }

    // 1. Dauko bayanan user daga table din "User"
    let userQuery = supabase
      .from("User")
      .select("id, email, balance, stakedBalance, lastYieldClaimTime, unclaimedYield");

    if (userId) {
      userQuery = userQuery.eq("id", userId);
    } else if (email) {
      userQuery = userQuery.eq("email", email);
    }

    const { data: userList, error: fetchError } = await userQuery;

    if (fetchError || !userList || userList.length === 0) {
      return NextResponse.json(
        { error: "User profile not found in database" },
        { status: 404 }
      );
    }

    const user = userList[0];
    const targetUserId = user.id;

    const currentBalance = parseFloat(user.balance || "0");
    const currentStaked = parseFloat(user.stakedBalance || "0");
    const existingUnclaimed = parseFloat(user.unclaimedYield || "0");

    const now = new Date();
    const lastClaim = user.lastYieldClaimTime
      ? new Date(user.lastYieldClaimTime)
      : now;

    // Lissafin lokacin da ya wuce da yield da aka tara
    const elapsedSeconds = Math.max(0, (now.getTime() - lastClaim.getTime()) / 1000);
    const annualRate = 0.15; // 15% APY
    const yieldPerSecond = (currentStaked * annualRate) / 31536000;
    const currentAccruedYield = elapsedSeconds * yieldPerSecond;
    const totalClaimableYield = currentAccruedYield + existingUnclaimed;

    // ==========================================
    // ACTION 1: CLAIM YIELD
    // ==========================================
    if (action === "CLAIM") {
      if (currentStaked <= 0 && existingUnclaimed <= 0) {
        return NextResponse.json(
          { error: "No active stake or accrued yield found" },
          { status: 400 }
        );
      }

      if (totalClaimableYield <= 0.000001) {
        return NextResponse.json(
          { error: "Yield too small to claim" },
          { status: 400 }
        );
      }

      const updatedBalance = currentBalance + totalClaimableYield;

      const { data: updatedUser, error: claimUpdateError } = await supabase
        .from("User")
        .update({
          balance: updatedBalance,
          unclaimedYield: 0,
          lastYieldClaimTime: now.toISOString(),
        })
        .eq("id", targetUserId)
        .select()
        .single();

      if (claimUpdateError) throw claimUpdateError;

      // Rubuta Transaction Log na STAKING_YIELD
      await supabase.from("Transaction").insert({
        userId: targetUserId,
        amount: totalClaimableYield,
        type: "STAKING_YIELD",
        description: "Claimed $APN Staking Rewards",
        status: "COMPLETED",
        createdAt: now.toISOString(),
      });

      return NextResponse.json({
        success: true,
        action: "CLAIM",
        claimedAmount: totalClaimableYield,
        balance: updatedUser.balance,
        stakedBalance: updatedUser.stakedBalance,
        lastYieldClaimTime: updatedUser.lastYieldClaimTime,
      });
    }

    // ==========================================
    // ACTION 2 & 3: STAKE / UNSTAKE
    // ==========================================
    const stakeAmount = parseFloat(amount);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided for staking operation" },
        { status: 400 }
      );
    }

    let newBalance = currentBalance;
    let newStakedBalance = currentStaked;

    if (action === "STAKE") {
      if (currentBalance < stakeAmount) {
        return NextResponse.json(
          { error: "Insufficient balance to stake" },
          { status: 400 }
        );
      }
      newBalance = currentBalance - stakeAmount;
      newStakedBalance = currentStaked + stakeAmount;
    } else if (action === "UNSTAKE") {
      if (currentStaked < stakeAmount) {
        return NextResponse.json(
          { error: "Insufficient staked balance to withdraw" },
          { status: 400 }
        );
      }
      newBalance = currentBalance + stakeAmount;
      newStakedBalance = currentStaked - stakeAmount;
    } else {
      return NextResponse.json(
        { error: "Unsupported action specified" },
        { status: 400 }
      );
    }

    // Idan an yi STAKE ko UNSTAKE, muna adana ribar da aka tara a "unclaimedYield"
    // sannan mu sake saita agogon lokaci zuwa NOW() don kada a tafka kuskure a lissafi
    const { data: updatedUser, error: updateError } = await supabase
      .from("User")
      .update({
        balance: newBalance,
        stakedBalance: newStakedBalance,
        unclaimedYield: totalClaimableYield,
        lastYieldClaimTime: now.toISOString(),
      })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Rubuta Transaction Log
    await supabase.from("Transaction").insert({
      userId: targetUserId,
      amount: stakeAmount,
      type: action === "STAKE" ? "STAKE_DEPOSIT" : "STAKE_WITHDRAWAL",
      description:
        action === "STAKE"
          ? "Locked tokens into $APN Consensus Vault"
          : "Withdrawn unlocked tokens from Staking Vault",
      status: "COMPLETED",
      createdAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      action,
      balance: updatedUser.balance,
      stakedBalance: updatedUser.stakedBalance,
      unclaimedYield: updatedUser.unclaimedYield,
      lastYieldClaimTime: updatedUser.lastYieldClaimTime,
    });
  } catch (error: any) {
    console.error("Staking Processing Error:", error);
    return NextResponse.json(
      { error: error?.message || "Staking transaction failed" },
      { status: 500 }
    );
  }
}
