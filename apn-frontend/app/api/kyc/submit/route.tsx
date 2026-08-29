import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Update the record in the 'User' table using singular capital 'User'
    const { data: userData, error: fetchError } = await supabase
      .from("User")
      .select("id")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { success: false, message: "User account not found in database." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("User")
      .update({
        fullName: fullName,
        isVerified: false, // Standard verification is pending manual review
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to store KYC details." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Free Standard KYC Request Submitted! Your 50 APN token reward will be credited upon manual review (7-14 days).",
    });
  } catch (error) {
    console.error("KYC Submit error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during submission." },
      { status: 500 }
    );
  }
}