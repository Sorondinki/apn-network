import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CONVERSION_RATES: Record<string, number> = {
  aBTC: 0.00005,
  aETH: 0.0012,
  aSOL: 0.025,
  aUSDT: 3.50,
  aPI: 5.00,
  aSIDRA: 2.50,
  aCORE: 4.00,
  aRUBI: 8.50,
  aICE: 25.00,
};

export async function POST(req: Request) {
  try {
    const { userId, email, apnAmount, targetToken } = await req.json();
    const amountToSwap = parseFloat(apnAmount);

    if ((!userId && !email) || isNaN(amountToSwap) || amountToSwap < 100) {
      return NextResponse.json({ error: "Minimum swap amount is 100 APN." }, { status: 400 });
    }

    if (!CONVERSION_RATES[targetToken]) {
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

    const rate = CONVERSION_RATES[targetToken];
    const receivedAmount = (amountToSwap / 1000) * rate;
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
      oracle_rate: rate,
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
      
