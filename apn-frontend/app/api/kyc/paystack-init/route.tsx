import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, amount } = await request.json();

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { success: false, message: "Paystack secret key is missing in server environment variables." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || "user@apnprotocol.ng",
        amount: (amount || 1000) * 100, // Amount in Kobo (₦1,000 = 100000 kobo)
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://apnprotocol.ng"}/kyc?status=success`,
        metadata: {
          userId,
          custom_fields: [
            {
              display_name: "Verification Type",
              variable_name: "verification_type",
              value: "FAST_TRACK_VIP_KYC",
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (data.status) {
      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || "Initialization failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error connecting to Paystack." },
      { status: 500 }
    );
  }
}