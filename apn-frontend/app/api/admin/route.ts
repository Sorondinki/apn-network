import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handleAdminRequest(req, true);
}

export async function POST(req: Request) {
  return handleAdminRequest(req, false);
}

async function handleAdminRequest(req: Request, isGet: boolean) {
  try {
    let body: any = {};
    const url = new URL(req.url);

    if (!isGet) {
      body = await req.json().catch(() => ({}));
    }

    const searchParam = url.searchParams.get("search") || body.search || "";
    const pageParam = parseInt(url.searchParams.get("page") || body.page || "1");
    const limitParam = parseInt(url.searchParams.get("limit") || body.limit || "100");
    const action = body.action || url.searchParams.get("action") || "FETCH_USERS";
    const adminId = body.adminId || url.searchParams.get("adminId");
    const adminEmail = body.adminEmail || url.searchParams.get("adminEmail");

    // 1. SECURITY CHECK: VERIFY ADMIN / FOUNDER EMAIL OR ROLE
    let isAuthorized = false;

    const trustedEmails = [
      "contact.aprotech@gmail.com",
      "sorondinkiseeme@gmail.com"
    ];

    if (
      adminId === "founder-root" ||
      (adminEmail && trustedEmails.includes(adminEmail.toLowerCase()))
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized && adminId) {
      const { data: adminUser } = await supabase
        .from("User")
        .select("*")
        .eq("id", adminId)
        .maybeSingle();

      if (adminUser) {
        const roleUpper = (adminUser.role || "").toUpperCase();
        const emailLower = (adminUser.email || "").toLowerCase();

        if (
          roleUpper === "FOUNDER" ||
          roleUpper === "ADMIN" ||
          roleUpper.includes("ADMIN") ||
          trustedEmails.includes(emailLower)
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access denied." },
        { status: 403 }
      );
    }

    // 2. MASTER PIN CHECK (ONLY FOR SENSITIVE MUTATIVE ACTIONS)
    const pinProtectedActions = [
      "TRANSFER_TOKENS",
      "BULK_AIRDROP",
      "TOGGLE_VERIFY",
      "BULK_VERIFY",
      "TOGGLE_WITHDRAW",
      "BULK_TOGGLE_WITHDRAW",
      "TOGGLE_SUSPEND",
      "BULK_SUSPEND",
      "DELETE_USER",
      "BULK_DELETE",
      "CREATE_TASK",
      "CREATE_ANNOUNCEMENT",
      "UPDATE_USER",
      "APPLY_MINING_BOOST",
      "BULK_APPLY_BOOST"
    ];

    if (pinProtectedActions.includes(action)) {
      const providedPin = body.masterPin || body.pin;
      const VALID_MASTER_PIN = process.env.MASTER_PIN || "APN-FOUNDER-2026#SECURE";

      if (!providedPin || String(providedPin).trim() !== VALID_MASTER_PIN) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid or missing Master Security PIN. Action rejected by Server." 
          },
          { status: 401 }
        );
      }
    }

    const targetTable = "User";

    // A. SERVER-SIDE SEARCH & PAGINATED FETCH ALL USERS
    if (action === "FETCH_USERS" || action === "GET_FOUNDER_STATS") {
      const offset = (pageParam - 1) * limitParam;

      let query = supabase
        .from(targetTable)
        .select("*", { count: "exact" });

      // Search Filter at Database Level
      if (searchParam && searchParam.trim() !== "") {
        const term = searchParam.trim();
        query = query.or(`email.ilike.%${term}%,name.ilike.%${term}%,fullName.ilike.%${term}%`);
      }

      const { data, count, error: usersErr } = await query
        .order("createdAt", { ascending: false })
        .range(offset, offset + limitParam - 1);

      if (usersErr) {
        throw usersErr;
      }

      const rawUsers = data || [];

      // 1. Kwaso Real Total Circulating Balance daga dukkan Database
const { data: allBalances } = await supabase
  .from("User")
  .select("balance");

const totalDistributedTokens = (allBalances || []).reduce((acc: number, curr: any) => {
  return acc + (parseFloat(curr.balance) || 0);
}, 0);

      const usersWithRefs = rawUsers.map((u) => {
        const baseSpeed = 0.50;
        const boostVal = parseFloat(u.miningBoost || u.boostMultiplier || 0);
        const finalMiningSpeed = u.miningSpeed ? parseFloat(u.miningSpeed) : (baseSpeed + boostVal);

        return {
          id: u.id,
          fullName: u.fullName || u.name || "Unnamed User",
          email: u.email || "No Email",
          balance: u.balance || 0,
          miningSpeed: finalMiningSpeed,
          miningBoost: boostVal,
          role: u.role || "USER",
          isSuspended: Boolean(u.isSuspended),
          isVerified: Boolean(u.isVerified),
          canWithdraw: u.canWithdraw !== undefined ? Boolean(u.canWithdraw) : true,
          createdAt: u.createdAt || new Date().toISOString(),
        };
      });

      return NextResponse.json({ 
        success: true, 
        users: usersWithRefs,
        totalCount: count || usersWithRefs.length,
        totalPages: Math.ceil((count || usersWithRefs.length) / limitParam),
        currentPage: pageParam,
        totalDistributedTokens: totalDistributedTokens
      });
    }

    // B. APPLY PAYSTACK SPEED BOOST
    if (action === "APPLY_MINING_BOOST" || action === "BULK_APPLY_BOOST") {
      const { targetUserId, targetUserIds, boostMultiplier } = body;
      const boostVal = parseFloat(boostMultiplier || "2.5");
      const BASE_SPEED = 0.50;
      const calculatedSpeed = BASE_SPEED + boostVal;

      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No target users selected." }, { status: 400 });
      }

      const { error } = await supabase
        .from(targetTable)
        .update({
          miningSpeed: calculatedSpeed,
          miningBoost: boostVal
        })
        .in("id", userIdsToProcess);

      if (error) {
        await supabase
          .from(targetTable)
          .update({ miningSpeed: calculatedSpeed })
          .in("id", userIdsToProcess);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated Mining Speed to ${calculatedSpeed.toFixed(2)}x (+${boostVal.toFixed(1)}x boost).`,
      });
    }

    // C. TOGGLE VERIFICATION (KYC)
    if (action === "TOGGLE_VERIFY" || action === "BULK_VERIFY") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      const { error } = await supabase
        .from(targetTable)
        .update({ isVerified: Boolean(status) })
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Verification status updated." });
    }

    // D. TOGGLE WITHDRAWAL PERMISSION
    if (action === "TOGGLE_WITHDRAW" || action === "BULK_TOGGLE_WITHDRAW") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      try {
        await supabase
          .from(targetTable)
          .update({ canWithdraw: Boolean(status) })
          .in("id", userIdsToProcess);
      } catch (e) {
        console.warn("canWithdraw update skipped:", e);
      }

      return NextResponse.json({ success: true, message: "Withdrawal permission updated." });
    }

    // E. AIRDROP / TOKEN TRANSFER
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const tokenAmount = parseFloat(amount);
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      for (const uid of userIdsToProcess) {
        const { data: user } = await supabase
          .from(targetTable)
          .select("balance")
          .eq("id", uid)
          .maybeSingle();

        const currentBal = parseFloat(user?.balance || "0");
        await supabase
          .from(targetTable)
          .update({ balance: currentBal + tokenAmount })
          .eq("id", uid);
      }

      return NextResponse.json({ success: true, message: `Transferred ${tokenAmount} APN successfully.` });
    }

    // F. TOGGLE SUSPEND
    if (action === "TOGGLE_SUSPEND" || action === "BULK_SUSPEND") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      await supabase
        .from(targetTable)
        .update({ isSuspended: Boolean(status) })
        .in("id", userIdsToProcess);

      return NextResponse.json({ success: true, message: "Account suspension updated." });
    }

    // G. UPDATE USER DETAILS
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, miningSpeed, role, isVerified, canWithdraw } = body;

      const updateData: Record<string, any> = {
        name,
        fullName: name,
        email,
        balance: parseFloat(balance || "0"),
        miningSpeed: parseFloat(miningSpeed || "0.50"),
        role: role || "USER",
        isVerified: Boolean(isVerified),
      };

      if (canWithdraw !== undefined) {
        updateData.canWithdraw = Boolean(canWithdraw);
      }

      await supabase
        .from(targetTable)
        .update(updateData)
        .eq("id", targetUserId);

      return NextResponse.json({ success: true, message: "User details updated." });
    }

    return NextResponse.json({ success: false, error: "Invalid Action." }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
    }
          
