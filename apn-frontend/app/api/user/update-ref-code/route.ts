// app/api/user/update-ref-code/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, newReferralCode } = await req.json();

    if (!userId || !newReferralCode) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if code is already taken
    const existingCode = await prisma.user.findFirst({
      where: { referralCode: newReferralCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: "Referral code is already taken!" },
        { status: 400 }
      );
    }

    // Update user's referral code
    await prisma.user.update({
      where: { id: userId },
      data: {
        referralCode: newReferralCode,
        hasChangedRefCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Referral code updated successfully!",
    });
  } catch (error: any) {
    console.error("Update Ref Code Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 }
    );
  }
}