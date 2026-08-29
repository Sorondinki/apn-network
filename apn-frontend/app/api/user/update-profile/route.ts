import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, fullName, phone, country, city, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Build update object based on provided fields matching the 'User' table schema
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No profile data provided to update" },
        { status: 400 }
      );
    }

    // Add timestamp update
    updateData.updatedAt = new Date().toISOString();

    // Perform database update on table 'User'
    const { data: updatedUser, error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, walletAddress, name, fullName, phone, country, city, avatarUrl, balance, isMining, canWithdraw, isVerified")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}