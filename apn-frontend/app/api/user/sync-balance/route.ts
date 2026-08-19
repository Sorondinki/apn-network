// app/api/user/sync-balance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, balance, miningStartTime } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Check if user actually exists in Database first to prevent P2025 crash
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User record not found in database." },
        { status: 444 }
      );
    }

    // 2. Prepare update payload
    const updateData: any = {
      balance: parseFloat(balance),
    };

    if (miningStartTime !== undefined) {
      updateData.miningStartTime = miningStartTime ? BigInt(miningStartTime) : null;
    }

    // 3. Perform update safely
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
    });
  } catch (error: any) {
    console.error("Sync Balance Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}