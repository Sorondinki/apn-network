import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, referralCode } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique APN Web3 Wallet Address
    const walletAddress = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate a unique Referral Code for the new user
    const generatedReferralCode = "APN" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check for a valid referrer code
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Save new user to Database
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        walletAddress,
        referralCode: generatedReferralCode,
        referredById: referrerId,
        hasChangedRefCode: false,
      },
    });

    // Credit Referral Reward (5.0 APN) to the Referrer
    if (referrerId) {
      await prisma.user.update({
        where: { id: referrerId },
        data: { balance: { increment: 5.0 } },
      });

      await prisma.transaction.create({
        data: {
          userId: referrerId,
          amount: 5.0,
          type: 'REFERRAL_BONUS',
          description: `Referral bonus earned from inviting ${email}`,
        },
      });
    }

    return NextResponse.json(
      { message: 'Account created successfully!', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}