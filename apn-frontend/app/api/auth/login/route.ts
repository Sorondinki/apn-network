import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Tabbatar da shigar bayanan
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Make sure your Email and Password are correct' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const rawPassword = String(password).trim(); // Tsallake space din auto-correct na waya

    // 2. Nemi user daga Supabase
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase Login Error:', fetchError);
      return NextResponse.json(
        { error: 'There is a problem with the server' },
        { status: 500 }
      );
    }

    // Idan babu user
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Duba Ingancin Password Hash
    const dbHash = user.passwordHash || user.password_hash;
    
    if (!dbHash) {
      return NextResponse.json(
        { error: 'There is problem with your account, please change your password' },
        { status: 401 }
      );
    }

    // Kwatanta Password da Hash dake DB
    const isPasswordValid = await bcrypt.compare(rawPassword, dbHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid Password, please try again' },
        { status: 401 }
      );
    }

    // 4. Maido da nasarar Login
    return NextResponse.json(
      {
        message: 'Welcome Back!',
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
          referralCode: user.referralCode,
          balance: Number(user.balance) || 0,
        },
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error('Unhandled Login Catch Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}