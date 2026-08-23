// app/api/user/update-profile/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, phone, country, city, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Dynamic Data Object don kaucewa sabunta filin da bai zo ba
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
      updateData.avatar_url = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No profile data provided to update" },
        { status: 400 }
      );
    }

    // Update user profile details in Supabase DB
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, wallet_address, walletAddress, name, phone, country, city, avatar_url, avatarUrl")
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