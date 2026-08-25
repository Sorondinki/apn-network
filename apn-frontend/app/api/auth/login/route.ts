import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Tabbatar an sa Service Role Key ko Anon Key da sauri
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Make sure your Email and Password are correct' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const rawPassword = String(body.password).trim();

    // Query guda daya tak mai sauri zuwa Table din User
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('id, email, passwordHash, walletAddress, referralCode, balance')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase DB Query Error:', fetchError);
      return NextResponse.json(
        { error: 'There is problem when fetching data' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Duba bcrypt password hash
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

    // Maido da amsar login cikin sauri
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
    console.error('Login Catch Crash:', err);
    return NextResponse.json(
      { error: 'There is a problem with the server' },
      { status: 500 }
    );
  }
}