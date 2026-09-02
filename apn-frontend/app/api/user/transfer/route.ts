import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, recipientAddress, amount } = body;

    const transferAmount = parseFloat(amount);

    if (!senderId || !recipientAddress || isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid transfer amount." },
        { status: 400 }
      );
    }

    // 1. Fetch Sender details
    const { data: sender, error: senderErr } = await supabase
      .from('User')
      .select('id, balance, canWithdraw')
      .eq('id', senderId)
      .single();

    if (senderErr || !sender) {
      return NextResponse.json({ success: false, error: "Sender account not found." }, { status: 404 });
    }

    if (sender.canWithdraw === false) {
      return NextResponse.json({ success: false, error: "This account is restricted from withdrawing funds." }, { status: 403 });
    }

    const currentSenderBalance = parseFloat(sender.balance || 0);

    if (currentSenderBalance < transferAmount) {
      return NextResponse.json({ success: false, error: "Your APN balance is insufficient for this transfer." }, { status: 400 });
    }

    // 2. Find Recipient by walletAddress or ID
    const cleanAddress = recipientAddress.trim();
    let recipientQuery = supabase.from('User').select('id, balance, walletAddress');

    if (cleanAddress.startsWith("0xAPN") && cleanAddress.length >= 21) {
      const possibleIdPart = cleanAddress.replace("0xAPN", "");
      recipientQuery = recipientQuery.or(`walletAddress.eq.${cleanAddress},id.ilike.%${possibleIdPart}%`);
    } else {
      recipientQuery = recipientQuery.or(`walletAddress.eq.${cleanAddress},id.eq.${cleanAddress}`);
    }

    const { data: recipients, error: recipientErr } = await recipientQuery.limit(1);
    const recipient = recipients && recipients.length > 0 ? recipients[0] : null;

    if (recipientErr || !recipient) {
      return NextResponse.json({ success: false, error: "Recipient not found with this address." }, { status: 404 });
    }

    if (recipient.id === senderId) {
      return NextResponse.json({ success: false, error: "You cannot transfer funds to yourself." }, { status: 400 });
    }

    // 3. EXECUTE TRANSACTION
    const newSenderBalance = currentSenderBalance - transferAmount;
    const newRecipientBalance = parseFloat(recipient.balance || 0) + transferAmount;

    // Deduct from Sender
    const { error: updateSenderErr } = await supabase
      .from('User')
      .update({ balance: newSenderBalance, updatedAt: new Date().toISOString() })
      .eq('id', senderId);

    if (updateSenderErr) {
      return NextResponse.json({ success: false, error: "Error deducting balance from sender account." }, { status: 500 });
    }

    // Add to Recipient
    await supabase
      .from('User')
      .update({ balance: newRecipientBalance, updatedAt: new Date().toISOString() })
      .eq('id', recipient.id);

    // Create Transaction Logs
    await supabase.from('Transaction').insert([
      {
        userId: senderId,
        type: 'TRANSFER_OUT',
        amount: transferAmount,
        status: 'COMPLETED',
        description: `Sent ${transferAmount} APN to ${recipientAddress}`,
        createdAt: new Date().toISOString()
      },
      {
        userId: recipient.id,
        type: 'TRANSFER_IN',
        amount: transferAmount,
        status: 'COMPLETED',
        description: `Received ${transferAmount} APN from user ${senderId.substring(0, 8)}...`,
        createdAt: new Date().toISOString()
      }
    ]);

    return NextResponse.json({
      success: true,
      newBalance: newSenderBalance,
      toastMessage: `Successfully transferred ${transferAmount} APN! 💸`
    });

  } catch (error: any) {
    console.error("Transfer Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
