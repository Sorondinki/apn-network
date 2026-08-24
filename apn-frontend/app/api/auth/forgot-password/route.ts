// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Tabbatar an samu mai amfani a database din
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    // Tura sakon sake saita Password ta hanyar Supabase Auth Engine
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://apn-network.vercel.app'}/reset-password`,
    });

    if (resetError) {
      return NextResponse.json(
        { error: resetError.message || 'Failed to send password reset email.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Password recovery email sent successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}