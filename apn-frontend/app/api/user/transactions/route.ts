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

    // Query live transaction records for the given user from Supabase
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
      // Generate a mock hash format if no on-chain txHash column exists
      const shortId = tx.id ? String(tx.id).substring(0, 8) : "0x00";
      const txHash = tx.txHash || `0xapn${shortId}`;

      // Convert timestamp into standard string format
      const formattedTimestamp = tx.createdAt
        ? new Date(tx.createdAt).toISOString().replace("T", " ").substring(0, 19)
        : new Date().toISOString().replace("T", " ").substring(0, 19);

      return {
        id: tx.id,
        txHash: txHash,
        type: tx.type || "TRANSFER_IN",
        amount: parseFloat(tx.amount || 0),
        status: tx.status || "COMPLETED",
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
