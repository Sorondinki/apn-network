import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const AUTHORIZED_ENGINEERS = [
  "contact.aprotech@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com",
];

export async function POST(request: NextRequest) {
  try {
    const { submissionId, userId, action, adminEmail } = await request.json();

    if (!adminEmail || !AUTHORIZED_ENGINEERS.includes(adminEmail.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access: Engineering access restricted." },
        { status: 403 }
      );
    }

    if (!submissionId || !userId || !action) {
      return NextResponse.json(
        { success: false, message: "Missing required payload parameters." },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // 1. Update KYC submission status
      const { error: subError } = await supabase
        .from("KYC_Submissions")
        .update({ status: "APPROVED", updated_at: new Date().toISOString() })
        .eq("id", submissionId);

      if (subError) throw subError;

      // 2. Fetch current balance to safely increment +50 APN reward
      const { data: userRecord, error: userFetchError } = await supabase
        .from("User")
        .select("balance")
        .eq("id", userId)
        .single();

      if (userFetchError) throw userFetchError;

      const currentBal = parseFloat(userRecord?.balance || "0");
      const updatedBal = currentBal + 50;

      // 3. Mark user verified and add completion bonus
      const { error: userUpdateError } = await supabase
        .from("User")
        .update({
          isVerified: true,
          balance: updatedBal,
        })
        .eq("id", userId);

      if (userUpdateError) throw userUpdateError;

      return NextResponse.json({
        success: true,
        message: "User verified successfully. +50 $APN bonus credited to account.",
      });
    }

    if (action === "REJECT") {
      const { error: subError } = await supabase
        .from("KYC_Submissions")
        .update({ status: "REJECTED", updated_at: new Date().toISOString() })
        .eq("id", submissionId);

      if (subError) throw subError;

      return NextResponse.json({
        success: true,
        message: "Submission rejected. The user form has been reset for new submission.",
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("KYC Action API error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
 }
    
