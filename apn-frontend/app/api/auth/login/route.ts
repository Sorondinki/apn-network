import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    // Neman User daga Supabase Database
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Inganta Password ta hanyar Bcrypt Hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Tura Amintattun Bayanai zuwa Session na Frontend
    return NextResponse.json(
      { 
        message: 'Login successful!', 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          balance: user.balance,
          stakedBalance: user.stakedBalance,
          referralCode: user.referralCode,
          isMining: user.isMining,
          miningStartTime: user.miningStartTime
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}