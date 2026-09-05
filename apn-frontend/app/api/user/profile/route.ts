import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("userId") || searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID parameter is required." },
        { status: 400 }
      );
    }

    // Zaɓar takamaiman columns da Frontend ke buƙata don Profile da Staking Engine
    const { data: user, error } = await supabase
      .from("User")
      .select(
        "id, name, email, balance, stakedBalance, lastYieldClaimTime, unclaimedYield"
      )
      .eq("id", id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
