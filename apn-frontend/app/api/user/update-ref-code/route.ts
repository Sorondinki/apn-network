// app/api/user/update-ref-code/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId, newReferralCode } = await req.json();

    if (!userId || !newReferralCode) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const cleanNewCode = String(newReferralCode).trim().toUpperCase();

    // Check if code is already taken in the correct 'User' table using camelCase column
    const { data: existingCode } = await supabase
      .from("User")
      .select("id")
      .eq("referralCode", cleanNewCode)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: "Referral code is already taken!" },
        { status: 400 }
      );
    }

    // Update user's referral code using correct camelCase columns
    const { error: updateError } = await supabase
      .from("User")
      .update({
        referralCode: cleanNewCode,
        hasChangedRefCode: true,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

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