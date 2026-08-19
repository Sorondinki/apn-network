// app/api/user/referrals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch user referral details
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, balance: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 2. Fetch referrals created by this user
    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: { id: true, name: true, createdAt: true },
    });

    const totalInvited = referrals.length;
    const commissionsEarned = (totalInvited * 5.0).toFixed(2); // Example 5 APN bonus per referral

    return NextResponse.json({
      success: true,
      totalInvited,
      commissionsEarned,
      tier: totalInvited >= 10 ? "Level 2 Miner" : "Level 1 Miner",
    });
  } catch (error: any) {
    console.error("Referral Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}