import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");
    const walletAddress = searchParams.get("walletAddress");

    if (!userId && walletAddress) {
      const { data: user } = await supabase
        .from("User")
        .select("id")
        .eq("walletAddress", walletAddress)
        .maybeSingle();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, balances: {} });
    }

    const { data: synth } = await supabase
      .from("synthetic_balances")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const formatted = {
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

    return NextResponse.json({ success: true, balances: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
