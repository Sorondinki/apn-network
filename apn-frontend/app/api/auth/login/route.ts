// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email and password' }, 
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Neman amfani daga Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Tabbatar da passwordHash ko password_hash daga database
    const userPasswordHash = user.passwordHash || user.password_hash;

    if (!userPasswordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Safely convert BigInt/Timestamp to ISO String
    const rawMiningTime = user.miningStartTime || user.mining_start_time;
    let formattedMiningTime: string | null = null;
    if (rawMiningTime !== null && rawMiningTime !== undefined) {
      formattedMiningTime = new Date(Number(rawMiningTime)).toISOString();
    }

    return NextResponse.json(
      { 
        message: 'Login successful!', 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name || '', 
          role: user.role || 'USER',
          balance: user.balance ?? 0,
          stakedBalance: user.stakedBalance ?? user.staked_balance ?? 0,
          referralCode: user.referralCode || user.referral_code || '',
          isMining: Boolean(user.isMining ?? user.is_mining),
          miningStartTime: formattedMiningTime
        } 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Critical Login Error:", error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}