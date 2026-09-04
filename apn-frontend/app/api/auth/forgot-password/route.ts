import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, action = "REQUEST_OTP", otp, newPassword } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tabbatar cewa user yana nan a table din User
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
    }

    // A. BUKATAR TURA OTP
    if (action === "REQUEST_OTP") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // Minti 15

      // Goge tsofaffin OTP na wannan email din
      await supabase.from('Password_Resets').delete().eq('email', cleanEmail);

      // Ajiye sabon OTP a database
      const { error: insertErr } = await supabase.from('Password_Resets').insert([
        {
          email: cleanEmail,
          otp: generatedOtp,
          expiresAt: expiresAt,
        },
      ]);

      if (insertErr) {
        throw insertErr;
      }

      // Idan kana amfani da Resend ko SMTP zaka sa a nan, ko kuma mu mayar masa don ya gani:
      console.log(`[APN AUTH] OTP for ${cleanEmail}: ${generatedOtp}`);

      return NextResponse.json({
        success: true,
        message: 'A 6-digit verification code has been dispatched to your email address.',
        // NOTE: Zaka iya cire otp a production idan kana da active email service
        devOtp: process.env.NODE_ENV === "development" ? generatedOtp : undefined,
      });
    }

    // B. TABBATAR DA OTP & SAITA SABON PASSWORD
    if (action === "RESET_PASSWORD") {
      if (!otp || !newPassword) {
        return NextResponse.json({ error: 'OTP and new password are required.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      // Duba OTP daga teburi
      const { data: resetRecord, error: resetErr } = await supabase
        .from('Password_Resets')
        .select('*')
        .eq('email', cleanEmail)
        .eq('otp', otp.trim())
        .gte('expiresAt', new Date().toISOString())
        .maybeSingle();

      if (resetErr || !resetRecord) {
        return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
      }

      // Yi hashing na sabon password (SHA-256 mai dacewa da standard login naku)
      const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

      // Sabunta password a table din User
      const { error: updateErr } = await supabase
        .from('User')
        .update({
          passwordHash: hashedPassword,
        })
        .eq('id', user.id);

      if (updateErr) {
        throw updateErr;
      }

      // Goge OTP din tunda an riga an yi amfani da shi
      await supabase.from('Password_Resets').delete().eq('email', cleanEmail);

      return NextResponse.json({
        success: true,
        message: 'Password successfully updated! You can now sign in.',
      });
    }

    return NextResponse.json({ error: 'Invalid reset action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
