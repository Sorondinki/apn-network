import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID missing" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // IDA SHAFIN YA HAƊA DA DATABASE (Prisma / Supabase / Direct SQL):
    // -------------------------------------------------------------
    // const userTransactions = await db.transaction.findMany({
    //   where: { userId: userId },
    //   orderBy: { createdAt: "desc" },
    // });
    // return NextResponse.json({ success: true, transactions: userTransactions });

    // -------------------------------------------------------------
    // DYNAMIC BACKEND FALLBACK LEDGER (Idan ana kan offline/mock state):
    // -------------------------------------------------------------
    const now = Date.now();
    const dynamicTransactions = [
      {
        id: `tx-${userId}-101`,
        txHash: "0xapn982f...a12c",
        type: "MINING_REWARD",
        amount: 24.0,
        status: "COMPLETED",
        timestamp: new Date(now - 3600000 * 2).toISOString().replace("T", " ").substring(0, 19),
        description: "24-Hour Node Mining Cycle Reward",
      },
      {
        id: `tx-${userId}-102`,
        txHash: "0xapn441b...7e99",
        type: "REFERRAL_BONUS",
        amount: 14.5,
        status: "COMPLETED",
        timestamp: new Date(now - 3600000 * 18).toISOString().replace("T", " ").substring(0, 19),
        description: "10% Mining Hash Rate Commission (Ref: APN-8902)",
      },
      {
        id: `tx-${userId}-103`,
        txHash: "0xapn110c...3b88",
        type: "STAKING_YIELD",
        amount: 8.75,
        status: "COMPLETED",
        timestamp: new Date(now - 3600000 * 24).toISOString().replace("T", " ").substring(0, 19),
        description: "+18.5% APY Staking Vault Daily Interest",
      },
      {
        id: `tx-${userId}-104`,
        txHash: "0xapn773d...11fe",
        type: "MINING_REWARD",
        amount: 24.0,
        status: "COMPLETED",
        timestamp: new Date(now - 3600000 * 26).toISOString().replace("T", " ").substring(0, 19),
        description: "24-Hour Node Mining Cycle Reward",
      },
      {
        id: `tx-${userId}-105`,
        txHash: "0xapn332e...99da",
        type: "TRANSFER_OUT",
        amount: 50.0,
        status: "COMPLETED",
        timestamp: new Date(now - 3600000 * 48).toISOString().replace("T", " ").substring(0, 19),
        description: "Mainnet Wallet Transfer to 0x3A...91bB",
      },
    ];

    return NextResponse.json({
      success: true,
      transactions: dynamicTransactions,
    });
  } catch (error) {
    console.error("Transactions API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}