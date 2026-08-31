import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      userId, 
      balance, 
      isMining, 
      miningStartTime,
      // Za mu iya karbar sakon transfer idan tura aka yi
      recipientAddress, 
      transferAmount,
      transactionType
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    const parsedBalance = parseFloat(balance);
    const parsedStartTime = miningStartTime ? Number(miningStartTime) : null;

    // 1. Tabbatar da ingancin lambar Balance idan ta nanata
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid balance value provided." },
        { status: 400 }
      );
    }

    // 2. Idan wannan Kiran na Transfer ne (Tura APN zuwa wani User/Mentor)
    if (recipientAddress && transferAmount && parseFloat(transferAmount) > 0) {
      const amountToTransfer = parseFloat(transferAmount);

      // Nemi mai karba a Database ta hanyar ID ko Wallet Address
      // Domin samun dacewa wajen address matching
      const cleanAddress = recipientAddress.trim();
      let recipientQuery = supabase.from('User').select('id, balance');

      if (cleanAddress.startsWith("0xAPN") && cleanAddress.length >= 21) {
        // Cire prefix na 0xAPN don zakulo ainihin ID
        const possibleIdPart = cleanAddress.replace("0xAPN", "");
        recipientQuery = recipientQuery.or(`id.ilike.%${possibleIdPart}%,walletAddress.eq.${cleanAddress}`);
      } else {
        recipientQuery = recipientQuery.or(`id.eq.${cleanAddress},walletAddress.eq.${cleanAddress}`);
      }

      const { data: recipientUser, error: recipientFetchErr } = await recipientQuery.limit(1).maybeSingle();

      if (recipientUser) {
        // A. Kara balance din Mai karba (Recipient)
        const recipientNewBalance = parseFloat(recipientUser.balance || 0) + amountToTransfer;
        await supabase
          .from('User')
          .update({
            balance: recipientNewBalance,
            updatedAt: new Date().toISOString()
          })
          .eq('id', recipientUser.id);

        // B. Kirkiro Transaction Record a cikin DB ga Mai karba (Incoming)
        await supabase.from('Transaction').insert({
          userId: recipientUser.id,
          type: 'TRANSFER_IN',
          amount: amountToTransfer,
          status: 'COMPLETED',
          description: `Received ${amountToTransfer} APN from user ${userId.substring(0, 8)}...`,
          createdAt: new Date().toISOString()
        });

        // C. Kirkiro Transaction Record a cikin DB ga Mai aikawa (Outgoing)
        await supabase.from('Transaction').insert({
          userId: userId,
          type: 'TRANSFER_OUT',
          amount: amountToTransfer,
          status: 'COMPLETED',
          description: `Sent ${amountToTransfer} APN to ${recipientAddress}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Sabunta Ainihin Balance da Mining State na Mai aikawa (Sender/Current User)
    const { data, error } = await supabase
      .from('User')
      .update({
        balance: parsedBalance,
        isMining: Boolean(isMining),
        miningStartTime: parsedStartTime,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Sync Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });

  } catch (error: any) {
    console.error("Sync Balance API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}