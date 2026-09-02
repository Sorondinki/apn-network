import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, mentorUserId, targetUserId, amount, masterPin } = body;

    // Verify Master Security PIN
    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "1234";
    if (masterPin !== MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "The Master PIN you entered is incorrect!" },
        { status: 401 }
      );
    }

    const recipientId = mentorUserId || targetUserId;
    const tokenAmount = Number(amount);

    if (!recipientId || !tokenAmount || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please make sure to select a recipient and enter a valid APN token amount." },
        { status: 400 }
      );
    }

    /* 
       Execute Database Transaction here:
       1. Deduct tokens from Founder Reserve Treasury.
       2. Increment Mentor/User Account balance.
       
       Example (Prisma ORM):
       await db.$transaction([
         db.user.update({
           where: { id: recipientId },
           data: { balance: { increment: tokenAmount } }
         }),
         db.transactionHistory.create({
           data: {
             senderId: adminId,
             receiverId: recipientId,
             amount: tokenAmount,
             type: "FOUNDER_MENTOR_TRANSFER"
           }
         })
       ]);
    */

    return NextResponse.json({
      success: true,
      toastMessage: `Successfully transferred ${tokenAmount.toLocaleString()} APN tokens to the user's account! 💸`,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred on the server." },
      { status: 500 }
    );
  }
}
