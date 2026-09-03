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

    // Zaƙulo bayanan transactions kai tsaye ta userId domin gujewa error na columns da babu a table
    const { data: dbTransactions, error } = await supabase
      .from("Transaction")
      .select("id, userId, amount, type, description, createdAt")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase Transaction Fetch Error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: formatTransactionsList(dbTransactions || []),
    });
  } catch (error: any) {
    console.error("Transactions API Server Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

function formatTransactionsList(dbTransactions: any[]) {
  return dbTransactions.map((tx) => {
    const shortId = tx.id ? String(tx.id).replace(/-/g, "").substring(0, 10) : "000000";
    const txHash = `0xapn${shortId}`;

    const formattedTimestamp = tx.createdAt
      ? new Date(tx.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19);

    let rawType = String(tx.type || "MINING_REWARD").toUpperCase();

    // Rarraba type daban-daban yadda yakamata
    if (rawType.includes("MINING")) {
      rawType = "MINING_REWARD";
    } else if (rawType.includes("REFERRAL") || rawType.includes("INVITE")) {
      rawType = "REFERRAL_BONUS";
    } else if (rawType.includes("AIRDROP") || rawType.includes("FOUNDER") || rawType === "BONUS") {
      rawType = "FOUNDER_AIRDROP";
    } else if (rawType.includes("STAKE") || rawType.includes("YIELD")) {
      rawType = "STAKING_YIELD";
    } else if (rawType.includes("OUT") || rawType.includes("WITHDRAW")) {
      rawType = "TRANSFER_OUT";
    }

    return {
      id: String(tx.id),
      txHash: txHash,
      type: rawType,
      amount: parseFloat(tx.amount || 0),
      status: "COMPLETED",
      timestamp: formattedTimestamp,
      description: tx.description || "APN Consensus Reward",
    };
  });
}
