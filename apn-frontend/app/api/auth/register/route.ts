// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, referralCode } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique APN Web3 Wallet Address
    const walletAddress = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate a unique Referral Code for the new user
    const generatedReferralCode = "APN" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check for a valid referrer code
    let referrerId: string | null = null;
    let referrerBalance = 0;

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id, balance')
        .or(`referralCode.eq.${referralCode},referral_code.eq.${referralCode}`)
        .maybeSingle();

      if (referrer) {
        referrerId = referrer.id;
        referrerBalance = parseFloat(referrer.balance || "0");
      }
    }

    // Save new user to Database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: cleanEmail,
          password_hash: hashedPassword,
          passwordHash: hashedPassword,
          wallet_address: walletAddress,
          walletAddress: walletAddress,
          referral_code: generatedReferralCode,
          referralCode: generatedReferralCode,
          referred_by_id: referrerId,
          referredById: referrerId,
          has_changed_ref_code: false,
          hasChangedRefCode: false,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // Credit Referral Reward (5.0 APN) to the Referrer
    if (referrerId) {
      const newBalance = referrerBalance + 5.0;

      await supabase
        .from('users')
        .update({
          balance: newBalance,
        })
        .eq('id', referrerId);

      await supabase
        .from('transactions')
        .insert([
          {
            user_id: referrerId,
            userId: referrerId,
            amount: 5.0,
            type: 'REFERRAL_BONUS',
            description: `Referral bonus earned from inviting ${cleanEmail}`,
          },
        ]);
    }

    return NextResponse.json(
      { message: 'Account created successfully!', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}