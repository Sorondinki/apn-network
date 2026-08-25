import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json({ error: 'Tabbatar ka shigar da Email da Password' }, { status: 400 });
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // 1. Duba ko email din yana cikin tsarin
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Wannan Email ɗin an riga an yi amfani da shi' }, { status: 400 });
    }

    // 2. Hash din password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userId = crypto.randomUUID();
    const walletAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Saka sabon user a Supabase
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
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Register Insert Error:', insertError);
      return NextResponse.json({ error: 'Database connection failed: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Registration successful',
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
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}