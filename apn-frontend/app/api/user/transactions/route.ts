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

    // Zaƙulo bayanan transactions kai tsaye daga table ɗin Transaction
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
    const shortId = tx.id ? String(tx.id).replace(/[^a-zA-Z0-9]/g, "").substring(0, 8) : "00000000";
    const txHash = `0xapn${shortId}`;

    const formattedTimestamp = tx.createdAt
      ? new Date(tx.createdAt).toISOString().replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19);

    const rawType = String(tx.type || "").trim().toUpperCase();
    const rawDesc = String(tx.description || "").trim().toUpperCase();

    let resolvedType = "MINING_REWARD";

    // 1. Duba Referral Bonus
    if (
      rawType.includes("REFERRAL") ||
      rawType.includes("INVITE") ||
      rawDesc.includes("REFERRAL") ||
      rawDesc.includes("INVITE") ||
      rawDesc.includes("DOWNLINE")
    ) {
      resolvedType = "REFERRAL_BONUS";
    }
    // 2. Duba Founder Airdrop & Signup Bonus
    else if (
      rawType.includes("AIRDROP") ||
      rawType.includes("FOUNDER") ||
      rawType.includes("WELCOME") ||
      rawType.includes("SIGNUP") ||
      rawType.includes("BONUS") ||
      rawDesc.includes("AIRDROP") ||
      rawDesc.includes("FOUNDER") ||
      rawDesc.includes("WELCOME") ||
      rawDesc.includes("SIGNUP")
    ) {
      resolvedType = "FOUNDER_AIRDROP";
    }
    // 3. Duba Staking Vault & Yields
    else if (
      rawType.includes("STAKE") ||
      rawType.includes("YIELD") ||
      rawDesc.includes("STAKE") ||
      rawDesc.includes("YIELD") ||
      rawDesc.includes("VAULT")
    ) {
      resolvedType = "STAKING_YIELD";
    }
    // 4. Duba Fitar da Kudade (Transfers Out & Withdrawals)
    else if (
      rawType.includes("OUT") ||
      rawType.includes("WITHDRAW") ||
      rawType.includes("DEBIT") ||
      rawType.includes("SENT") ||
      rawDesc.includes("WITHDRAW") ||
      rawDesc.includes("SENT") ||
      rawDesc.includes("TRANSFER OUT")
    ) {
      resolvedType = "TRANSFER_OUT";
    }
    // 5. Sauran ayyukan Mining
    else {
      resolvedType = "MINING_REWARD";
    }

    return {
      id: String(tx.id),
      txHash: txHash,
      type: resolvedType,
      amount: parseFloat(tx.amount || 0),
      status: "COMPLETED",
      timestamp: formattedTimestamp,
      description: tx.description || "APN Network Ecosystem Transaction",
    };
  });
}
