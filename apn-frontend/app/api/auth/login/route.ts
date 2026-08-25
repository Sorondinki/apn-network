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
        { error: 'Tabbatar ka shigar da Email da Password' },
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
        { error: 'An samu matsala wajen haɗawa da server' },
        { status: 500 }
      );
    }

    // Idan babu user
    if (!user) {
      return NextResponse.json(
        { error: 'Zaɓaɓɓen email ɗin ba ya cikin tsarinmu' },
        { status: 401 }
      );
    }

    // 3. Duba Ingancin Password Hash
    const dbHash = user.passwordHash || user.password_hash;
    
    if (!dbHash) {
      return NextResponse.json(
        { error: 'An samu matsala da asusunka, da fatan ka sake canza password' },
        { status: 401 }
      );
    }

    // Kwatanta Password da Hash dake DB
    const isPasswordValid = await bcrypt.compare(rawPassword, dbHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Kuskuren Password, sake dubawa ka sake gwadawa' },
        { status: 401 }
      );
    }

    // 4. Maido da nasarar Login
    return NextResponse.json(
      {
        message: 'Barka da dawowa!',
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