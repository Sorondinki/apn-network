// app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId } = body;

    // --- SECURITY CHECK: VERIFY ADMIN / FOUNDER PRIVILEGES ---
    let isAuthorized = adminId === "founder-root";

    if (!isAuthorized && adminId) {
      const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
      if (
        adminUser &&
        (adminUser.role === "FOUNDER" ||
          adminUser.role === "ADMIN" ||
          adminUser.email?.toLowerCase() === "contact.aprotech@gmail.com" ||
          adminUser.email?.toLowerCase() === "sorondinkiseeme@gmail.com")
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not have Founder or Admin permissions." },
        { status: 403 }
      );
    }

    // --- ACTIONS ---

    // A. FETCH ALL USERS WITH REFERRAL COUNT
    if (action === "FETCH_USERS") {
      const rawUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Format BigInt fields da kuma lissafin referrals
      const usersWithRefs = await Promise.all(
        rawUsers.map(async (u) => {
          const refCount = await prisma.user.count({
            where: { referredById: u.id },
          });

          return {
            ...u,
            name: u.name || u.name || "",
            referralCount: refCount,
            // Safely convert BigInt to Number or ISO string to avoid JSON crash
            miningStartTime: u.miningStartTime ? Number(u.miningStartTime) : null,
          };
        })
      );

      return NextResponse.json({ success: true, users: usersWithRefs });
    }

    // B. SUSPEND / UNSUSPEND USER ACCOUNT
    if (action === "TOGGLE_SUSPEND") {
      const { targetUserId, status } = body;
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { isSuspended: Boolean(status) },
      });

      return NextResponse.json({
        success: true,
        isSuspended: updated.isSuspended,
      });
    }

    // C. DELETE USER ACCOUNT
    if (action === "DELETE_USER") {
      const { targetUserId } = body;
      await prisma.user.delete({ where: { id: targetUserId } });
      return NextResponse.json({
        success: true,
        message: "User account deleted successfully.",
      });
    }

    // D. EDIT USER DETAILS
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email } = body;
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { name, email },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    // E. FOUNDER TOKEN TRANSFER / VAULT DISTRIBUTION
    if (action === "TRANSFER_TOKENS") {
      const { targetUserId, amount } = body;
      const tokenAmount = parseFloat(amount);

      if (!targetUserId || isNaN(tokenAmount) || tokenAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid target user or token amount specified." },
          { status: 400 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { balance: { increment: tokenAmount } },
      });

      // Log transaction record
      await prisma.transaction.create({
        data: {
          userId: targetUserId,
          amount: tokenAmount,
          type: "FOUNDER_AIRDROP",
          description: "Direct token transfer from Founder Vault",
        },
      });

      return NextResponse.json({ success: true, newBalance: updated.balance });
    }

    // F. POST TASK TO TASKS PAGE
    if (action === "CREATE_TASK") {
      const { title, description, reward, link, category } = body;

      if (!title || !reward || !link) {
        return NextResponse.json(
          { success: false, error: "Task title, reward, and link URL are required." },
          { status: 400 }
        );
      }

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || "",
          reward: parseFloat(reward),
          link,
          category: category || "GENERAL",
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, task: newTask });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action requested." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}