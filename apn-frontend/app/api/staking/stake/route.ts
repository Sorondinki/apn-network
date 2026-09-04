import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, email, amount, action = "STAKE" } = await req.json();
    const stakeAmount = parseFloat(amount);

    if ((!userId && !email) || isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ error: "Invalid user identifier or amount provided" }, { status: 400 });
    }

    // 1. Tabbatar mun yi amfani da daidaitaccen sunan table wato "User" kamar yadda yake a database dinka
    let userQuery = supabase
      .from("User")
      .select("id, email, balance, stakedBalance");

    if (userId) {
      userQuery = userQuery.eq("id", userId);
    } else if (email) {
      userQuery = userQuery.eq("email", email);
    }

    const { data: userList, error: fetchError } = await userQuery;

    if (fetchError || !userList || userList.length === 0) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }

    const user = userList[0];
    const targetUserId = user.id;

    const currentBalance = parseFloat(user.balance || "0");
    const currentStaked = parseFloat(user.stakedBalance || "0");

    let newBalance = currentBalance;
    let newStakedBalance = currentStaked;

    if (action === "STAKE") {
      // Duba ko yana da isasshen baki a babban asusunsa
      if (currentBalance < stakeAmount) {
        return NextResponse.json({ error: "Insufficient balance to stake" }, { status: 400 });
      }
      newBalance = currentBalance - stakeAmount;
      newStakedBalance = currentStaked + stakeAmount;
    } else if (action === "UNSTAKE") {
      // Duba ko yana da isasshen abin cirewa a vault
      if (currentStaked < stakeAmount) {
        return NextResponse.json({ error: "Insufficient staked balance to withdraw" }, { status: 400 });
      }
      newBalance = currentBalance + stakeAmount;
      newStakedBalance = currentStaked - stakeAmount;
    }

    // 2. Sabunta bayanan user a cikin table din "User" ta hanyar amfani daakedBalance
    const { data: updatedUser, error: updateError } = await supabase
      .from("User")
      .update({
        balance: newBalance,
        stakedBalance: newStakedBalance,
      })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 3. Rubuta Tarihin Staking ko Unstaking a Table din Transaction
    await supabase.from("Transaction").insert({
      userId: targetUserId,
      amount: stakeAmount,
      type: action === "STAKE" ? "STAKING_YIELD" : "TRANSFER_OUT",
      description:
        action === "STAKE"
          ? "Locked tokens into $APN Consensus Vault"
          : "Withdrawn unlocked tokens from Staking Vault",
    });

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      stakedBalance: updatedUser.stakedBalance,
    });

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      stakedBalance: updatedUser.stakedBalance,
    });
  } catch (error: any) {
    console.error("Staking Processing Error:", error);
    return NextResponse.json({ error: error?.message || "Staking transaction failed" }, { status: 500 });
  }
}
  
