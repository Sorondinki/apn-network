import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    // 1. Diba Client Connection Cikin Hanzari
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 2. Duba ko User ɗin yana nan a baya
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Wannan Email ɗin an riga an yi amfani da shi' },
        { status: 400 }
      );
    }

    // 3. Kirkirar Random Unique Wallet da Code a Sauri
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const randomHex = Array.from({ length: 20 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    const walletAddress = `0x${randomHex}`;
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 4. Saka sabon asusu a DB
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
      .select('id, email, walletAddress, referralCode, balance')
      .single();

    if (insertError) {
      console.error('Register Database Insert Error:', insertError);
      return NextResponse.json(
        { error: 'An samu matsala wajen yi ma rijista: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Rijista ta kammala cikin nasara!',
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
    console.error('Register Unhandled Crash:', err);
    return NextResponse.json(
      { error: err?.message || 'There is a problem with the server' },
      { status: 500 }
    );
  }
}