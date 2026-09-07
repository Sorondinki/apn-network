import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const AUTHORIZED_ENGINEERS = [
  "contact.aprotech@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com",
];

export async function POST(request: NextRequest) {
  try {
    const { targetEmail, newRole, adminEmail } = await request.json();

    if (!adminEmail || !AUTHORIZED_ENGINEERS.includes(adminEmail.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Core Ops permissions required." },
        { status: 403 }
      );
    }

    if (!targetEmail || !newRole) {
      return NextResponse.json(
        { success: false, message: "Missing target user email or new role." },
        { status: 400 }
      );
    }

    // Verify allowed roles
    const validRoles = ["USER", "VALIDATOR", "AMBASSADOR", "MANAGER", "ADMIN"];
    if (!validRoles.includes(newRole.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "Invalid role assigned." },
        { status: 400 }
      );
    }

    // 1. Check if user exists
    const { data: userRecord, error: fetchErr } = await supabase
      .from("User")
      .select("id, email, role, fullName")
      .ilike("email", targetEmail.trim())
      .single();

    if (fetchErr || !userRecord) {
      return NextResponse.json(
        { success: false, message: "User not found with this email." },
        { status: 404 }
      );
    }

    // 2. Update role on 'User' table
    const { error: updateErr } = await supabase
      .from("User")
      .update({
        role: newRole.toUpperCase(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userRecord.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: `Role updated successfully to ${newRole.toUpperCase()} for ${userRecord.fullName || userRecord.email}!`,
    });
  } catch (error: any) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user role." },
      { status: 500 }
    );
  }
}
  
