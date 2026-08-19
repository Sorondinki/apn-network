// app/api/staking/stake/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount },
        stakedBalance: { increment: amount },
      },
    });

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      stakedBalance: updatedUser.stakedBalance,
    });
  } catch (error) {
    return NextResponse.json({ error: "Staking failed" }, { status: 500 });
  }
}