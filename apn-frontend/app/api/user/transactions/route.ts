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

    // Query transaction records: Nemi inda userId shine Sender KO kuma Recipient
    // Wannan shine zai sa duk wata mu'amala (shiga ko fita) ta bayyana radau!
    const { data: dbTransactions, error } = await supabase
      .from("Transaction")
      .select("*")
      .or(`userId.eq.${userId},recipientId.eq.${userId},toUserId.eq.${userId}`)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase Query Error:", error);
      // Fallback query idan sassan recipientId babu su a schema
      const { data: fallbackTx, error: fallbackErr } = await supabase
        .from("Transaction")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (fallbackErr) {
        return NextResponse.json(
          { success: false, message: "Failed to fetch transaction records from database." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        transactions: formatTransactionsList(fallbackTx || []),
      });
    }

    return NextResponse.json({
      success: true,
      transactions: formatTransactionsList(dbTransactions || []),
    });
  } catch (error: any) {
    console.error("Transactions API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper Function don Tsara Bayanan Transaction da Tsaro
function formatTransactionsList(dbTransactions: any[]) {
  return dbTransactions.map((tx) => {
    const shortId = tx.id ? String(tx.id).substring(0, 8) : "0x00";
    const txHash = tx.txHash || `0xapn${shortId}`;

    const formattedTimestamp = tx.createdAt
      ? new Date(tx.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19);

    let rawType = String(tx.type || "TRANSFER_IN").toUpperCase();

    // Daidaita ire-iren Airdrop da Transfers
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
      status: tx.status ? String(tx.status).toUpperCase() : "COMPLETED",
      timestamp: formattedTimestamp,
      description: tx.description || "APN Network Transaction",
    };
  });
}