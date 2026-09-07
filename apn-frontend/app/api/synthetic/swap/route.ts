import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const APN_PRICE_USD = 0.15;

const TOKEN_DB_MAP: Record<string, string> = {
  aBTC: "abtc_balance",
  aETH: "aeth_balance",
  aSOL: "asol_balance",
  aUSDT: "ausdt_balance",
  aPI: "api_balance",
  aSIDRA: "asidra_balance",
  aCORE: "acore_balance",
  aRUBI: "arubi_balance",
  aICE: "aice_balance",
};

// Fallback rates
const DEFAULT_PRICES: Record<string, number> = {
  aBTC: 67450.0,
  aETH: 3520.0,
  aSOL: 154.5,
  aUSDT: 1.0,
  aPI: 31.4,
  aSIDRA: 1.45,
  aCORE: 1.28,
  aRUBI: 0.65,
  aICE: 0.08,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, amount, token, mode = "BUY" } = body;
    const tradeAmount = parseFloat(amount);

    if ((!userId && !email) || isNaN(tradeAmount) || tradeAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid swap amount provided." },
        { status: 400 }
      );
    }

    const dbColumn = TOKEN_DB_MAP[token];
    if (!dbColumn) {
      return NextResponse.json(
        { error: "Invalid synthetic asset specified." },
        { status: 400 }
      );
    }

    // 1. Fetch current live price from Oracle route
    let currentTokenPrice = DEFAULT_PRICES[token] || 1.0;
    try {
      const oracleRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,coredao,ice-open-network&vs_currencies=usd");
      if (oracleRes.ok) {
        const live = await oracleRes.json();
        if (token === "aBTC" && live?.bitcoin?.usd) currentTokenPrice = live.bitcoin.usd;
        if (token === "aETH" && live?.ethereum?.usd) currentTokenPrice = live.ethereum.usd;
        if (token === "aSOL" && live?.solana?.usd) currentTokenPrice = live.solana.usd;
        if (token === "aUSDT" && live?.tether?.usd) currentTokenPrice = live.tether.usd;
        if (token === "aCORE" && live?.coredao?.usd) currentTokenPrice = live.coredao.usd;
        if (token === "aICE" && live?.["ice-open-network"]?.usd) currentTokenPrice = live["ice-open-network"].usd;
      }
    } catch (e) {
      console.warn("Oracle fetch error, using default index:", e);
    }

    // 2. Fetch user profile
    let userQuery = supabase.from("User").select("id, balance");
    if (userId) userQuery = userQuery.eq("id", userId);
    else if (email) userQuery = userQuery.eq("email", email);

    const { data: users, error: userError } = await userQuery;
    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const user = users[0];
    const targetUserId = user.id;
    const currentApnBalance = parseFloat(user.balance || "0");

    // 3. Fetch synthetic balances
    const { data: synthData } = await supabase
      .from("synthetic_balances")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const currentSynthBal = parseFloat(synthData ? synthData[dbColumn] || "0" : "0");

    // =========================================================================
    // MODE A: BUY SYNTHETIC WITH $APN
    // =========================================================================
    if (mode === "BUY") {
      if (tradeAmount < 100) {
        return NextResponse.json(
          { error: "Minimum conversion threshold is 100 $APN." },
          { status: 400 }
        );
      }

      if (currentApnBalance < tradeAmount) {
        return NextResponse.json(
          { error: "Insufficient $APN balance." },
          { status: 400 }
        );
      }

      const totalUsdValue = tradeAmount * APN_PRICE_USD;
      const rawReceived = totalUsdValue / currentTokenPrice;
      const receivedAmount =
        rawReceived < 0.001
          ? parseFloat(rawReceived.toFixed(6))
          : parseFloat(rawReceived.toFixed(4));

      const newApnBalance = currentApnBalance - tradeAmount;
      const newSynthBal = currentSynthBal + receivedAmount;

      // Update User APN
      await supabase.from("User").update({ balance: newApnBalance }).eq("id", targetUserId);

      // Update Synthetic Balances
      if (synthData) {
        await supabase
          .from("synthetic_balances")
          .update({ [dbColumn]: newSynthBal, updated_at: new Date().toISOString() })
          .eq("user_id", targetUserId);
      } else {
        await supabase.from("synthetic_balances").insert({
          user_id: targetUserId,
          abtc_balance: 0,
          aeth_balance: 0,
          asol_balance: 0,
          ausdt_balance: 0,
          api_balance: 0,
          asidra_balance: 0,
          acore_balance: 0,
          arubi_balance: 0,
          aice_balance: 0,
          [dbColumn]: newSynthBal,
        });
      }

      // Log trade
      await supabase.from("synthetic_swap_logs").insert({
        user_id: targetUserId,
        from_token: "APN",
        to_token: token,
        amount_spent: tradeAmount,
        amount_received: receivedAmount,
        oracle_rate: currentTokenPrice,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        mode: "BUY",
        newApnBalance,
        newSyntheticBalance: newSynthBal,
        receivedAmount,
        rate: currentTokenPrice,
      });
    }

    // =========================================================================
    // MODE B: SELL SYNTHETIC BACK TO $APN (TAKE PROFIT)
    // =========================================================================
    if (mode === "SELL") {
      if (currentSynthBal < tradeAmount) {
        return NextResponse.json(
          { error: `Insufficient ${token} vault balance to complete swap.` },
          { status: 400 }
        );
      }

      // Calculate USD value of sold asset at live price
      const totalUsdValue = tradeAmount * currentTokenPrice;
      // Convert USD back to $APN tokens ($0.15 peg)
      const rawApnReceived = totalUsdValue / APN_PRICE_USD;
      const apnReceived = parseFloat(rawApnReceived.toFixed(4));

      const newSynthBal = currentSynthBal - tradeAmount;
      const newApnBalance = currentApnBalance + apnReceived;

      // Credit User $APN balance
      await supabase.from("User").update({ balance: newApnBalance }).eq("id", targetUserId);

      // Deduct Synthetic Token
      await supabase
        .from("synthetic_balances")
        .update({ [dbColumn]: newSynthBal, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId);

      // Log trade
      await supabase.from("synthetic_swap_logs").insert({
        user_id: targetUserId,
        from_token: token,
        to_token: "APN",
        amount_spent: tradeAmount,
        amount_received: apnReceived,
        oracle_rate: currentTokenPrice,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        mode: "SELL",
        newApnBalance,
        newSyntheticBalance: newSynthBal,
        receivedAmount: apnReceived,
        rate: currentTokenPrice,
      });
    }

    return NextResponse.json({ error: "Invalid trading operation." }, { status: 400 });
  } catch (err: any) {
    console.error("Trading Engine Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal swap engine failure." },
      { status: 500 }
    );
  }
}
    
