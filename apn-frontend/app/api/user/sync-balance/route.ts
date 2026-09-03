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

    // 1. Fetch current live balance and mining speed only (saves bandwidth & prevents timeouts)
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

    // 2. Add mining increment safely without overwriting external transfers
    const speed = Number(user.miningSpeed || 0.5);
    const earnedIncrement = isMining ? (speed / 3600) * 10 : 0;
    const currentBal = Number(user.balance || 0);
    const updatedBalance = Number((currentBal + earnedIncrement).toFixed(6));

    const parsedStartTime = miningStartTime ? Number(miningStartTime) : null;

    // 3. Update database record
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

    // Return the fresh database balance to sync client-side state
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
      
