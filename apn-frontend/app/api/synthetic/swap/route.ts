import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// APN Pegged Oracle Valuation: Fixed at $0.15 USD
const APN_PRICE_USD = 0.15;

// Oracle Market Prices in USD
const MARKET_PRICES_USD: Record<string, { price: number; column: string }> = {
  aBTC: { price: 67450.00, column: "abtc_balance" },
  aETH: { price: 3520.00, column: "aeth_balance" },
  aSOL: { price: 154.50, column: "asol_balance" },
  aUSDT: { price: 1.00, column: "ausdt_balance" },
  aPI: { price: 31.40, column: "api_balance" },
  aSIDRA: { price: 1.45, column: "asidra_balance" },
  aCORE: { price: 1.28, column: "acore_balance" },
  aRUBI: { price: 0.65, column: "arubi_balance" },
  aICE: { price: 0.08, column: "aice_balance" },
};

// =========================================================================
// 1. GET: Fetch Live Synthetic Holdings (by userId or walletAddress)
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId") || searchParams.get("id");
    const walletAddress = searchParams.get("walletAddress");

    // Lookup user by external/internal wallet address if userId is omitted
    if (!userId && walletAddress) {
      const { data: userProfile } = await supabase
        .from("User")
        .select("id")
        .eq("walletAddress", walletAddress)
        .maybeSingle();

      if (userProfile) {
        userId = userProfile.id;
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        balances: {
          aBTC: 0,
          aETH: 0,
          aSOL: 0,
          aUSDT: 0,
          aPI: 0,
          aSIDRA: 0,
          aCORE: 0,
          aRUBI: 0,
          aICE: 0,
        },
      });
    }

    const { data: synth, error: fetchErr } = await supabase
      .from("synthetic_balances")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const formattedBalances = {
      aBTC: parseFloat(synth?.abtc_balance || "0"),
      aETH: parseFloat(synth?.aeth_balance || "0"),
      aSOL: parseFloat(synth?.asol_balance || "0"),
      aUSDT: parseFloat(synth?.ausdt_balance || "0"),
      aPI: parseFloat(synth?.api_balance || "0"),
      aSIDRA: parseFloat(synth?.asidra_balance || "0"),
      aCORE: parseFloat(synth?.acore_balance || "0"),
      aRUBI: parseFloat(synth?.arubi_balance || "0"),
      aICE: parseFloat(synth?.aice_balance || "0"),
    };

    return NextResponse.json({
      success: true,
      balances: formattedBalances,
    });
  } catch (err: any) {
    console.error("Fetch Synthetic Holdings Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch synthetic balances." },
      { status: 500 }
    );
  }
}

// =========================================================================
// 2. POST: Execute Synthetic Swap Transaction
// =========================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, apnAmount, targetToken } = body;
    const amountToSwap = parseFloat(apnAmount);

    if ((!userId && !email) || isNaN(amountToSwap) || amountToSwap < 100) {
      return NextResponse.json(
        { error: "Minimum conversion threshold is 100 $APN." },
        { status: 400 }
      );
    }

    const targetConfig = MARKET_PRICES_USD[targetToken];
    if (!targetConfig) {
      return NextResponse.json(
        { error: "Invalid target synthetic asset specified." },
        { status: 400 }
      );
    }

    // 1. Fetch user record
    let userQuery = supabase.from("User").select("id, balance");
    if (userId) userQuery = userQuery.eq("id", userId);
    else if (email) userQuery = userQuery.eq("email", email);

    const { data: users, error: userError } = await userQuery;

    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const user = users[0];
    const targetUserId = user.id;
    const currentBalance = parseFloat(user.balance || "0");

    if (currentBalance < amountToSwap) {
      return NextResponse.json(
        { error: "Insufficient $APN balance for conversion." },
        { status: 400 }
      );
    }

    // 2. Compute Oracle conversion output
    const totalUsdValue = amountToSwap * APN_PRICE_USD;
    const rawReceived = totalUsdValue / targetConfig.price;
    const receivedAmount =
      rawReceived < 0.001
        ? parseFloat(rawReceived.toFixed(6))
        : parseFloat(rawReceived.toFixed(4));

    const newApnBalance = currentBalance - amountToSwap;

    // 3. Deduct APN balance from User table
    const { error: deductError } = await supabase
      .from("User")
      .update({ balance: newApnBalance })
      .eq("id", targetUserId);

    if (deductError) throw deductError;

    // 4. Update or Insert into synthetic_balances table
    const { data: synthData, error: synthFetchError } = await supabase
      .from("synthetic_balances")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (synthFetchError) throw synthFetchError;

    const dbColumn = targetConfig.column;
    const currentSynthBal = parseFloat(synthData ? synthData[dbColumn] || "0" : "0");
    const newSynthBal = currentSynthBal + receivedAmount;

    if (synthData) {
      const { error: updateSynthError } = await supabase
        .from("synthetic_balances")
        .update({
          [dbColumn]: newSynthBal,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);

      if (updateSynthError) throw updateSynthError;
    } else {
      const initialRow: Record<string, any> = {
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
      };

      const { error: insertSynthError } = await supabase
        .from("synthetic_balances")
        .insert(initialRow);

      if (insertSynthError) throw insertSynthError;
    }

    // 5. Record log in synthetic_swap_logs
    await supabase.from("synthetic_swap_logs").insert({
      user_id: targetUserId,
      from_token: "APN",
      to_token: targetToken,
      amount_spent: amountToSwap,
      amount_received: receivedAmount,
      oracle_rate: targetConfig.price,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newApnBalance,
      targetToken,
      receivedAmount,
      newSyntheticBalance: newSynthBal,
    });
  } catch (err: any) {
    console.error("Synthetic Swap Execution Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during swap execution." },
      { status: 500 }
    );
  }
 }
                         
