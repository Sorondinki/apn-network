import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, docType, docNumber, docImage, selfieImage, verificationType = "FREE" } = body;

    if (!userId || !fullName || !docNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required KYC credentials." },
        { status: 400 }
      );
    }

    // 1. Tabbatar cewa user yana nan a table din User
    const { data: userData, error: fetchError } = await supabase
      .from("User")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { success: false, message: "User account not found in database." },
        { status: 404 }
      );
    }

    // 2. Ajiye dukkan cikakkun bayanan KYC da hotuna a cikin table din KYC_Submissions
    const { error: insertError } = await supabase
      .from("KYC_Submissions")
      .insert({
        userId: userId,
        fullName: fullName,
        docType: docType,
        docNumber: docNumber,
        docImage: docImage || null,
        selfieImage: selfieImage || null,
        verificationType: verificationType,
        status: "PENDING",
      });

    if (insertError) {
      console.error("KYC Record Insert Error:", insertError);
      return NextResponse.json(
        { success: false, message: "Failed to store KYC documents in database: " + insertError.message },
        { status: 500 }
      );
    }

    // 3. Sabunta fullName a table din User
    await supabase
      .from("User")
      .update({
        fullName: fullName,
        isVerified: false,
      })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message:
        "Free Standard KYC Request Submitted! Your 50 $APN token reward will be credited upon manual review (7-14 days).",
    });
  } catch (error: any) {
    console.error("KYC Submit error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error during KYC submission." },
      { status: 500 }
    );
  }
}
