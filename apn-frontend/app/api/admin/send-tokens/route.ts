import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mentorUserId, targetUserId, amount, masterPin } = body;

    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "1234";
    if (masterPin !== MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Invalid Master PIN provided." },
        { status: 401 }
      );
    }

    const recipientId = mentorUserId || targetUserId;
    const tokenAmount = Number(amount);

    if (!recipientId || !tokenAmount || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please select a valid user and token amount." },
        { status: 400 }
      );
    }

    // Get current balance from Supabase
    const { data: user, error: fetchErr } = await supabase
      .from("User")
      .select("balance")
      .eq("id", recipientId)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json({ success: false, error: "Target user not found." }, { status: 404 });
    }

    const newBalance = (Number(user.balance) || 0) + tokenAmount;

    const { error: updateErr } = await supabase
      .from("User")
      .update({ balance: newBalance })
      .eq("id", recipientId);

    if (updateErr) throw updateErr;

    // Yi log na direct transfer a FounderTransferLog
    await supabase.from("FounderTransferLog").insert([
      { targetUserId: recipientId, amount: tokenAmount }
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${tokenAmount.toLocaleString()} APN tokens!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Server error during token transfer." },
      { status: 500 }
    );
  }
}
