import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, referralCode } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Duba idan mutum yana nan
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Supabase fetch error:', checkError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const walletAddress = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const generatedReferralCode = "APN" + Math.random().toString(36).substring(2, 8).toUpperCase();

    let referrerId: string | null = null;
    let referrerBalance = 0;

    if (referralCode && referralCode.trim() !== "") {
      const { data: referrer } = await supabase
        .from('User')
        .select('id, balance')
        .eq('referralCode', referralCode.trim())
        .maybeSingle();

      if (referrer) {
        referrerId = referrer.id;
        referrerBalance = Number(referrer.balance) || 0;
      }
    }

    // 2. Insert sabon user
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
      console.error('Insert Error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 3. Update balance na referrer
    if (referrerId) {
      await supabase
        .from('User')
        .update({ balance: referrerBalance + 5.0 })
        .eq('id', referrerId);
    }

    return NextResponse.json({ message: 'Account created successfully!', user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}