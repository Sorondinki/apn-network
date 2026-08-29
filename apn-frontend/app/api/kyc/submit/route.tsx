import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, docType, docNumber, docImage, selfieImage } = body;

    if (!userId || !fullName || !docNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required KYC credentials." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // DATABASE STORAGE PLACEHOLDER (Prisma / Supabase / Direct SQL)
    // -------------------------------------------------------------
    // await db.kycSubmission.create({
    //   data: { userId, fullName, docType, docNumber, docImage, selfieImage, status: "PENDING_MANUAL" }
    // });

    return NextResponse.json({
      success: true,
      message: "Free Standard KYC Request Submitted! Your 50 APN token reward will be credited upon manual review (7-14 days).",
    });
  } catch (error) {
    console.error("KYC Submit error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during submission." },
      { status: 500 }
    );
  }
}