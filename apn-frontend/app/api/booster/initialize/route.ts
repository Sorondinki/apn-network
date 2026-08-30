import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, plan } = await req.json();

    if (!userId || !email || !plan) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let amountInKobo = 150000; // ₦1,500
    if (plan === "ULTRA") {
      amountInKobo = 350000; // ₦3,500
    }

    // Tura buƙata zuwa Paystack API
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: {
          userId,
          plan,
        },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://apnprotocol.ng"}/dashboard`,
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ success: false, error: data.message }, { status: 400 });
    }

    // Mayar da hanyar biyan kuɗi (authorization_url)
    return NextResponse.json({ success: true, authorizationUrl: data.data.authorization_url });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
