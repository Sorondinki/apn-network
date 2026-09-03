import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, recipientAddress, amount } = body;

    const transferAmount = parseFloat(amount);
    if (!senderId || !recipientAddress || isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid transfer parameters." }, { status: 400 });
    }

    // 1. Tabbatar da sender
    const { data: sender, error: senderErr } = await supabase
      .from("User")
      .select("id, balance, canWithdraw, isSuspended")
      .eq("id", senderId)
      .single();

    if (senderErr || !sender) {
      return NextResponse.json({ success: false, error: "Sender account not found." }, { status: 404 });
    }

    if (sender.isSuspended) {
      return NextResponse.json({ success: false, error: "Your account is suspended." }, { status: 403 });
    }

    if (sender.canWithdraw === false) {
      return NextResponse.json({ success: false, error: "Transfers are currently restricted on your account." }, { status: 403 });
    }

    if (Number(sender.balance) < transferAmount) {
      return NextResponse.json({ success: false, error: "Insufficient $APN balance." }, { status: 400 });
    }

    // 2. Nemo Recipient ta walletAddress ko ID
    const cleanAddr = recipientAddress.trim().toLowerCase();
    const { data: recipients, error: recErr } = await supabase
      .from("User")
      .select("id, balance, walletAddress")
      .or(`walletAddress.ilike.${cleanAddr},id.eq.${cleanAddr}`)
      .limit(1);

    if (recErr || !recipients || recipients.length === 0) {
      return NextResponse.json({ success: false, error: "Recipient wallet address not found on APN Network." }, { status: 404 });
    }

    const recipient = recipients[0];

    if (recipient.id === sender.id) {
      return NextResponse.json({ success: false, error: "Cannot transfer to your own address." }, { status: 400 });
    }

    // 3. Rage balance na mai aikawa
    const newSenderBal = Number(sender.balance) - transferAmount;
    const { error: debitErr } = await supabase
      .from("User")
      .update({ balance: newSenderBal })
      .eq("id", sender.id);

    if (debitErr) throw debitErr;

    // 4. Ƙara wa mai karɓa
    const newRecipientBal = Number(recipient.balance || 0) + transferAmount;
    const { error: creditErr } = await supabase
      .from("User")
      .update({ balance: newRecipientBal })
      .eq("id", recipient.id);

    if (creditErr) throw creditErr;

    // 5. Rubuta a Transaction table
    try {
      await supabase.from("Transaction").insert([
        {
          userId: sender.id,
          amount: transferAmount,
          type: "TRANSFER",
          status: "COMPLETED",
          recipientAddress: recipient.walletAddress || cleanAddr
        }
      ]);
    } catch (e) {
      console.warn("Transaction log insert optional warning:", e);
    }

    return NextResponse.json({
      success: true,
      newBalance: newSenderBal,
      message: `Successfully transferred ${transferAmount} $APN.`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Transaction failed." }, { status: 500 });
  }
  }
