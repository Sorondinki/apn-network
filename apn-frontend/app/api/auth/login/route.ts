import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Shigar da Email da Password' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // 1. Samo User daga Supabase
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('id, email, passwordHash, walletAddress, referralCode, balance')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Login Database Error:', fetchError);
      return NextResponse.json(
        { error: 'Matsalar Database: ' + fetchError.message },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email ko Password ba daidai bane' },
        { status: 401 }
      );
    }

    // 2. Kwatanta Password Hash
    const isPasswordValid = await bcrypt.compare(rawPassword, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ko Password ba daidai bane' },
        { status: 401 }
      );
    }

    // 3. Update updatedAt dake cikin Table ɗinka
    const nowIso = new Date().toISOString();
    await supabase
      .from('User')
      .update({ updatedAt: nowIso })
      .eq('id', user.id);

    // 4. Mayar da sakamakon nasara
    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress || '',
          referralCode: user.referralCode || '',
          balance: Number(user.balance) || 0,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Login Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}