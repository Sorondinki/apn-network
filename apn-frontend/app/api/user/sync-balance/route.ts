import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, isMining, miningStartTime } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID parameter is required." },
        { status: 400 }
      );
    }

    // 1. Fetch current live balance and user mining state
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("balance, miningSpeed, isMining, miningStartTime")
      .eq("id", userId)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // 2. Compute safe mining increment for 10-second sync window
    const baseSpeed = Number(user.miningSpeed || 0.5); // 0.5 APN/hour default
    const earnedIncrement = isMining ? (baseSpeed / 3600) * 10 : 0;
    const currentBal = Number(user.balance || 0);
    const updatedBalance = Number((currentBal + earnedIncrement).toFixed(6));

    // Format ISO Timestamp safely for Supabase schema
    let formattedStartTime = user.miningStartTime;
    if (miningStartTime) {
      const numTime = Number(miningStartTime);
      formattedStartTime = !isNaN(numTime)
        ? new Date(numTime).toISOString()
        : new Date(miningStartTime).toISOString();
    }

    // 3. Update User balance and live mining state in Supabase
    const { data, error: updateErr } = await supabase
      .from("User")
      .update({
        balance: updatedBalance,
        isMining: Boolean(isMining),
        miningStartTime: formattedStartTime,
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

    return NextResponse.json({
      success: true,
      balance: data.balance,
      syncedAmount: earnedIncrement,
    });
  } catch (error: any) {
    console.error("Sync Balance Processing Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
