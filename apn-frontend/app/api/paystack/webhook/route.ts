import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 1. Tabbatar da amincin sakon cewa DAGA PAYSTACK YAKE (Security Verification)
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ message: "Invalid Signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 2. Idan biyan kuɗi ya kammala cikin nasara (charge.success)
    if (event.event === "charge.success") {
      const { metadata, amount } = event.data;
      const userId = metadata?.userId;
      const plan = metadata?.plan; // "PRO" ko "ULTRA"

      if (userId && plan) {
        let multiplier = 1.0;
        if (plan === "PRO") multiplier = 2.5;
        if (plan === "ULTRA") multiplier = 5.0;

        // Ranar karewar booster (Kwanaki 30 daga yanzu)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        // A. AUTOMATIC APPROVAL: Update dake saita gudun ma amfani
        const { error: updateErr } = await supabase
          .from("User")
          .update({
            miningMultiplier: multiplier,
            boosterPlan: plan,
            boosterExpiresAt: expiryDate.toISOString(),
          })
          .eq("id", userId);

        if (updateErr) console.error("Error updating user booster:", updateErr);

        // B. Yi rikodin biyan kuɗi a teburin Transaction
        await supabase.from("Transaction").insert({
          userId: userId,
          amount: amount / 100, // Maida kobo zuwa Naira (₦)
          type: "BOOSTER_PURCHASE",
          description: `Purchased ${plan} Node Booster (${multiplier}x Speed)`,
        });
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  }
    
