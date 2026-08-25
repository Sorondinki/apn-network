import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Tabbatar ka shigar da Email da Password' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // 1. Samo user daga Supabase
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 2. Duba inda Password Hash yake
    const dbHash = user.passwordHash || user.password_hash;
    if (!dbHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Kwatanta Password
    const isPasswordValid = await bcrypt.compare(rawPassword, dbHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Update dynamic timestamp (idan ana bukata)
    const nowIso = new Date().toISOString();
    await supabase
      .from('User')
      .update({ updatedAt: nowIso })
      .eq('id', user.id)
      .catch(() => null);

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress || user.wallet_address || '',
          referralCode: user.referralCode || user.referral_code || '',
          balance: Number(user.balance) || 0,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Login Catch Error:', err);
    return NextResponse.json(
      { error: 'There is a problem with the server' },
      { status: 500 }
    );
  }
}