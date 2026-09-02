import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { senderId, recipientAddress, amount } = body;

    const transferAmount = parseFloat(amount);

    if (!senderId || !recipientAddress || isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Tabbatar ka shigar da ma'aunin da ya dace." },
        { status: 400 }
      );
    }

    // 1. Zaqulo bayanan Mai Aikawa (Sender)
    const { data: sender, error: senderErr } = await supabase
      .from('User')
      .select('id, balance, canWithdraw')
      .eq('id', senderId)
      .single();

    if (senderErr || !sender) {
      return NextResponse.json({ success: false, error: "Ba a samu asusun mai aikawa ba." }, { status: 404 });
    }

    if (sender.canWithdraw === false) {
      return NextResponse.json({ success: false, error: "An dakatar da wannan asusun daga cire kuɗi." }, { status: 403 });
    }

    const currentSenderBalance = parseFloat(sender.balance || 0);

    if (currentSenderBalance < transferAmount) {
      return NextResponse.json({ success: false, error: "Ma'aunin APN ɗinka bai kai adadin da kake son turawa ba." }, { status: 400 });
    }

    // 2. Nemo Mai Karɓa (Recipient) ta walletAddress ko ID
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
      return NextResponse.json({ success: false, error: "Ba a samu mai karɓa tare da wannan adireshin ba." }, { status: 404 });
    }

    if (recipient.id === senderId) {
      return NextResponse.json({ success: false, error: "Baza ka iya tura wa kanka kuɗi ba." }, { status: 400 });
    }

    // 3. AIWATAR DA TRANSACTION
    const newSenderBalance = currentSenderBalance - transferAmount;
    const newRecipientBalance = parseFloat(recipient.balance || 0) + transferAmount;

    // Cire daga Sender
    const { error: updateSenderErr } = await supabase
      .from('User')
      .update({ balance: newSenderBalance, updatedAt: new Date().toISOString() })
      .eq('id', senderId);

    if (updateSenderErr) {
      return NextResponse.json({ success: false, error: "Kuskure wajen cire ma'auni daga asusunta." }, { status: 500 });
    }

    // Ƙara wa Recipient
    await supabase
      .from('User')
      .update({ balance: newRecipientBalance, updatedAt: new Date().toISOString() })
      .eq('id', recipient.id);

    // Kirkiro Transaction Logs
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
      message: `Kayi nasarar tura ${transferAmount} APN!`
    });

  } catch (error: any) {
    console.error("Transfer Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Server Error" }, { status: 500 });
  }
}
               
