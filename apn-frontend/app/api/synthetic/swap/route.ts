import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// APN PRICE: Fixed at $0.15 USD
const APN_PRICE_USD = 0.15;

// Oracle Market Prices in USD
const MARKET_PRICES_USD: Record<string, number> = {
  aBTC: 67450.00,
  aETH: 3520.00,
  aSOL: 154.50,
  aUSDT: 1.00,
  aPI: 31.40,
  aSIDRA: 1.45,
  aCORE: 1.28,
  aRUBI: 0.65,
  aICE: 0.08,
};

export async function POST(req: Request) {
  try {
    const { userId, email, apnAmount, targetToken } = await req.json();
    const amountToSwap = parseFloat(apnAmount);

    if ((!userId && !email) || isNaN(amountToSwap) || amountToSwap < 100) {
      return NextResponse.json({ error: "Minimum swap amount is 100 APN." }, { status: 400 });
    }

    const targetPrice = MARKET_PRICES_USD[targetToken];
    if (!targetPrice) {
      return NextResponse.json({ error: "Invalid target synthetic token." }, { status: 400 });
    }

    let userQuery = supabase.from("User").select("id, balance");
    if (userId) userQuery = userQuery.eq("id", userId);
    else if (email) userQuery = userQuery.eq("email", email);

    const { data: users, error: userError } = await userQuery;

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const user = users[0];
    const currentBalance = parseFloat(user.balance || "0");

    if (currentBalance < amountToSwap) {
      return NextResponse.json({ error: "Insufficient APN balance for this swap." }, { status: 400 });
    }

    // LISSAFIN GASKIYA BASED ON $0.15 APN VALUE:
    const totalUsdValue = amountToSwap * APN_PRICE_USD;
    const rawReceived = totalUsdValue / targetPrice;
    
    const receivedAmount = rawReceived < 0.001 
      ? parseFloat(rawReceived.toFixed(6)) 
      : parseFloat(rawReceived.toFixed(4));

    const newApnBalance = currentBalance - amountToSwap;

    await supabase.from("User").update({ balance: newApnBalance }).eq("id", user.id);

    const { data: synthData } = await supabase
      .from("synthetic_balances")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const columnMap: Record<string, string> = {
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

    const dbColumn = columnMap[targetToken];
    const currentSynthBal = parseFloat(synthData ? synthData[dbColumn] || "0" : "0");
    const newSynthBal = currentSynthBal + receivedAmount;

    if (synthData) {
      await supabase
        .from("synthetic_balances")
        .update({ [dbColumn]: newSynthBal, updated_at: new Date() })
        .eq("user_id", user.id);
    } else {
      await supabase.from("synthetic_balances").insert({
        user_id: user.id,
        [dbColumn]: newSynthBal,
      });
    }

    await supabase.from("synthetic_swap_logs").insert({
      user_id: user.id,
      from_token: "APN",
      to_token: targetToken,
      amount_spent: amountToSwap,
      amount_received: receivedAmount,
      oracle_rate: targetPrice,
    });

    return NextResponse.json({
      success: true,
      newApnBalance,
      targetToken,
      receivedAmount,
      newSyntheticBalance: newSynthBal,
    });
  } catch (err: any) {
    console.error("Synthetic Swap Error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error." }, { status: 500 });
  }
}