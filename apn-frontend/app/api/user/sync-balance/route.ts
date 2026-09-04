import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, isMining, miningStartTime } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    // 1. Fetch current live balance and mining speed
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("balance, miningSpeed")
      .eq("id", userId)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    // 2. Add mining increment safely
    const speed = Number(user.miningSpeed || 0.5);
    const earnedIncrement = isMining ? (speed / 3600) * 10 : 0;
    const currentBal = Number(user.balance || 0);
    const updatedBalance = Number((currentBal + earnedIncrement).toFixed(6));

    const parsedStartTime = miningStartTime ? Number(miningStartTime) : null;

    // 3. Update User balance and mining state
    const { data, error: updateErr } = await supabase
      .from("User")
      .update({
        balance: updatedBalance,
        isMining: Boolean(isMining),
        miningStartTime: parsedStartTime,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("balance")
      .single();

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }

    // 4. Rubuta aikin a Transaction table idan an samu karin hako (Mining Reward)
    if (earnedIncrement > 0) {
      try {
        await supabase.from("Transaction").insert([
          {
            userId: userId,
            amount: Number(earnedIncrement.toFixed(4)),
            type: "MINING_REWARD",
            description: "APN Node Consensus Mining Reward",
          },
        ]);
      } catch (logErr) {
        console.warn("Failed to log mining transaction:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      balance: data.balance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
