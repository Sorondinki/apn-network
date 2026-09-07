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
      // 1. Update status to APPROVED
      const { error: subError } = await supabase
        .from("KYC_Submissions")
        .update({ status: "APPROVED" })
        .eq("id", submissionId);

      if (subError) throw subError;

      // 2. Increment balance by +50 APN
      const { data: userRecord, error: userFetchError } = await supabase
        .from("User")
        .select("balance")
        .eq("id", userId)
        .single();

      if (userFetchError) throw userFetchError;

      const currentBal = parseFloat(userRecord?.balance || "0");
      const updatedBal = currentBal + 50;

      // 3. Mark user verified
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
      // Update status to REJECTED so form re-opens for clean retry
      const { error: subError } = await supabase
        .from("KYC_Submissions")
        .update({ status: "REJECTED" })
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
