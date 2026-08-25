import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Make sure your Email and Password are correct!' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    const cleanEmail = String(email).trim().toLowerCase();
    const rawPassword = String(password).trim();

    // 1. Nemi user daga Supabase
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'There is a problem with the server' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 2. Duba password hash
    const storedHash = user.passwordHash || user.password_hash;
    if (!storedHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(rawPassword, storedHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Tattara amintattun bayanan amfani (Safe Response Data)
    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress || '',
          referralCode: user.referralCode || '',
          balance: typeof user.balance === 'number' ? user.balance : parseFloat(user.balance || '0'),
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Unhandled Server Error:', err);
    return NextResponse.json(
      { error: err?.message || 'There is a problem with the server' },
      { status: 500 }
    );
  }
}