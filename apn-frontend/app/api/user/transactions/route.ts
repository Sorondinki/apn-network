import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID parameter is missing." },
        { status: 400 }
      );
    }

    // Query transaction records matching user ID from Supabase
    const { data: dbTransactions, error } = await supabase
      .from("Transaction")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase Query Error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch transaction records from database." },
        { status: 500 }
      );
    }

    // Map database column schema to frontend format
    const formattedTransactions = (dbTransactions || []).map((tx) => {
      const shortId = tx.id ? String(tx.id).substring(0, 8) : "0x00";
      const txHash = `0xapn${shortId}`;

      const formattedTimestamp = tx.createdAt
        ? new Date(tx.createdAt).toISOString().replace("T", " ").substring(0, 19)
        : new Date().toISOString().replace("T", " ").substring(0, 19);

      let rawType = String(tx.type || "TRANSFER_IN").toUpperCase();

      // Normalize all variations of founder transfers to FOUNDER_AIRDROP
      if (
        rawType.includes("FOUNDER") ||
        rawType.includes("AIRDROP") ||
        rawType.includes("BONUS") ||
        rawType === "ADMIN_TRANSFER"
      ) {
        if (rawType !== "REFERRAL_BONUS") {
          rawType = "FOUNDER_AIRDROP";
        }
      }

      return {
        id: String(tx.id),
        txHash: txHash,
        type: rawType,
        amount: parseFloat(tx.amount || 0),
        status: "COMPLETED",
        timestamp: formattedTimestamp,
        description: tx.description || "APN Network Transaction",
      };
    });

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error: any) {
    console.error("Transactions API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
