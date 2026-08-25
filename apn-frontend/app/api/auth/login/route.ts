import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // 1. Karɓi payload
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Tabbatar ka shigar da Email da Password' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // 2. Ƙirƙiri Supabase Client nan take a cikin handler ɗin (Guje wa Connection Hanging)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 3. Tambayi Database
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('id, email, passwordHash, walletAddress, referralCode, balance')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Database query error:', fetchError);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Kwatanta Hash
    const dbHash = user.passwordHash;
    if (!dbHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(rawPassword, dbHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Maido da Nasara
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
    console.error('Server Catch Error:', err);
    return NextResponse.json(
      { error: 'There is a problem with the server' },
      { status: 500 }
    );
  }
}