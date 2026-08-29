import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Make sure you enter both correct Email and Password' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // 1. Duba ko email yana cikin tsarin
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Invalid Email or Password' },
        { status: 400 }
      );
    }

    // 2. Shirya Hash da Wallet
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
    const randomHex = Array.from({ length: 20 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    
    const walletAddress = `0x${randomHex}`;
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nowIso = new Date().toISOString();

    // 3. Tura bayanan tare da createdAt da updatedAt
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([
        {
          id: userId,
          email: cleanEmail,
          passwordHash: hashedPassword,
          walletAddress: walletAddress,
          referralCode: referralCode,
          balance: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      ])
      .select('id, email, walletAddress, referralCode, balance')
      .single();

    if (insertError) {
      console.error('Register Insert Error:', insertError);
      return NextResponse.json(
        { error: 'There is error when registration process: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration Successful!',
        user: {
          id: newUser.id,
          email: newUser.email,
          walletAddress: newUser.walletAddress,
          referralCode: newUser.referralCode,
          balance: 0,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Register Catch Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}