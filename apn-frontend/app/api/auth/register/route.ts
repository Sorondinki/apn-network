import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, referralCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Duba idan mutum yana nan
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const walletAddress = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const generatedReferralCode = "APN" + Math.random().toString(36).substring(2, 8).toUpperCase();

    let referrerId: string | null = null;
    let referrerBalance = 0;

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('User')
        .select('id, balance')
        .eq('referralCode', referralCode.trim())
        .maybeSingle();

      if (referrer) {
        referrerId = referrer.id;
        referrerBalance = typeof referrer.balance === 'number' ? referrer.balance : parseFloat(referrer.balance || "0");
      }
    }

    // Insert zuwa Supabase da ainihin column names din hotonka
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([
        {
          email: cleanEmail,
          passwordHash: hashedPassword,
          walletAddress: walletAddress,
          referralCode: generatedReferralCode,
          referredById: referrerId,
          hasChangedRefCode: false,
          balance: 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (referrerId) {
      await supabase
        .from('User')
        .update({ balance: referrerBalance + 5.0 })
        .eq('id', referrerId);
    }

    return NextResponse.json({ message: 'Account created successfully!', user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}