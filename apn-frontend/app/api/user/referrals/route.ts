import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Nemi mutanen da id dinka ke matsayin referredById a gurinsu
    const { data: referrals, error, count } = await supabase
      .from("User")
      .select("id, name, email, createdAt, balance", { count: "exact" })
      .eq("referredById", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Fetch referrals error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // Lissafin lamba guda guda tare da Kariya (Safety Checks)
    const totalInvited = count ?? referrals?.length ?? 0;
    const bonusPerReferral = 5.0; // Kowani referral 5 APN
    const commissionsEarned = (totalInvited * bonusPerReferral).toFixed(2);

    return NextResponse.json({
      success: true,
      totalInvited,
      commissionsEarned,
      referrals: referrals || [],
    });
  } catch (err: any) {
    console.error("Referral API Crash Prevented:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}