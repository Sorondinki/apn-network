import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    // 1. Check if user is already marked verified in User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id, email, isVerified, fullName")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (userData.isVerified) {
      return NextResponse.json({
        success: true,
        status: "VERIFIED",
        user: userData,
      });
    }

    // 2. Check for recent submission using createdAt
    const { data: kycData } = await supabase
      .from("KYC_Submissions")
      .select("id, status, verificationType, createdAt")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kycData && kycData.status === "PENDING") {
      return NextResponse.json({
        success: true,
        status: "PENDING",
        submission: kycData,
      });
    }

    return NextResponse.json({
      success: true,
      status: "NOT_SUBMITTED",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
