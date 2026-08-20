import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Direct Database Query With Error Handling
    const cleanEmail = email.trim().toLowerCase();
    
    const user = await prisma.user.findUnique({ 
      where: { email: cleanEmail } 
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Inganta Password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' }, 
        { status: 401 }
      );
    }

    // Maida Response tare da kariya daga null Values
    return NextResponse.json(
      { 
        message: 'Login successful!', 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name || '', 
          role: user.role || 'USER',
          balance: user.balance ?? 0,
          stakedBalance: user.stakedBalance ?? 0,
          referralCode: user.referralCode || '',
          isMining: Boolean(user.isMining),
          miningStartTime: user.miningStartTime ? user.miningStartTime.toISOString() : null
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