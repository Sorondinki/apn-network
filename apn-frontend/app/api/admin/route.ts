import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client using Service Role Key for Admin Access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TOTAL_MAX_SUPPLY = 1000000000;
const TOTAL_FOUNDER_RESERVE = 250000000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, masterPin, search = "", page = 1, limit = 100 } = body;

    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "1234";

    if (action !== "FETCH_USERS" && masterPin !== MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Invalid Master PIN provided." },
        { status: 401 }
      );
    }

    // 1. FETCH USERS & STATS VIA SUPABASE
    if (action === "FETCH_USERS") {
      const take = Number(limit);
      const from = (Number(page) - 1) * take;
      const to = from + take - 1;

      let query = supabase.from("User").select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `email.ilike.%${search}%,name.ilike.%${search}%,fullName.ilike.%${search}%`
        );
      }

      const { data: users, count, error } = await query
        .order("createdAt", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Calculate Total Distributed Balance
      const { data: allUsers, error: sumError } = await supabase
        .from("User")
        .select("balance");

      if (sumError) throw sumError;

      const totalDistributedTokens = (allUsers || []).reduce(
        (acc, curr) => acc + (Number(curr.balance) || 0),
        0
      );

      return NextResponse.json({
        success: true,
        users: users || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / take) || 1,
        totalDistributedTokens,
        founderReserve: TOTAL_FOUNDER_RESERVE,
        maxSupply: TOTAL_MAX_SUPPLY,
      });
    }

    // 2. DIRECT TOKEN TRANSFER / BULK AIRDROP
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const transferAmount = Number(amount);

      if (!transferAmount || transferAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid APN token amount." },
          { status: 400 }
        );
      }

      if (action === "BULK_AIRDROP" && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
        for (const id of targetUserIds) {
          const { data: u } = await supabase.from("User").select("balance").eq("id", id).single();
          const currentBal = Number(u?.balance || 0);
          await supabase.from("User").update({ balance: currentBal + transferAmount }).eq("id", id);
        }

        return NextResponse.json({
          success: true,
          message: `Successfully airdropped ${transferAmount.toLocaleString()} APN to ${targetUserIds.length} users!`,
        });
      }

      if (targetUserId) {
        const { data: u } = await supabase.from("User").select("balance").eq("id", targetUserId).single();
        const currentBal = Number(u?.balance || 0);

        const { error } = await supabase
          .from("User")
          .update({ balance: currentBal + transferAmount })
          .eq("id", targetUserId);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Successfully transferred ${transferAmount.toLocaleString()} APN tokens!`,
        });
      }
    }

    // 3. MINING SPEED BOOST
    if (action === "TOGGLE_BOOST" || action === "BULK_APPLY_BOOST") {
      const { userId, targetUserIds, boostSpeed, boostMultiplier } = body;

      if (action === "BULK_APPLY_BOOST" && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
        const { error } = await supabase
          .from("User")
          .update({
            miningSpeed: Number(boostMultiplier) || 2.5,
            isBoosting: true,
          })
          .in("id", targetUserIds);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Mining speed boost applied to ${targetUserIds.length} accounts!`,
        });
      }

      if (userId && boostSpeed !== undefined) {
        const speedVal = Number(boostSpeed);
        const { error } = await supabase
          .from("User")
          .update({
            miningSpeed: speedVal,
            isBoosting: speedVal > 0.5,
          })
          .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Mining speed updated to ${speedVal.toFixed(2)}x / hr!`,
        });
      }
    }

    // 4. EDIT USER DATA & KYC
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, miningSpeed, role, isVerified, canWithdraw } = body;

      const { error } = await supabase
        .from("User")
        .update({
          fullName: name,
          name: name,
          email,
          balance: Number(balance),
          miningSpeed: Number(miningSpeed),
          role,
          isVerified: Boolean(isVerified),
          canWithdraw: Boolean(canWithdraw),
        })
        .eq("id", targetUserId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "User profile and KYC details updated successfully!",
      });
    }

    // 5. BULK / SINGLE VERIFICATION & STATUS TOGGLES
    if (action === "TOGGLE_VERIFY" || action === "BULK_VERIFY") {
      const { targetUserId, targetUserIds, status } = body;

      if (action === "BULK_VERIFY" && Array.isArray(targetUserIds)) {
        await supabase.from("User").update({ isVerified: Boolean(status) }).in("id", targetUserIds);
      } else if (targetUserId) {
        await supabase.from("User").update({ isVerified: Boolean(status) }).eq("id", targetUserId);
      }

      return NextResponse.json({
        success: true,
        message: "KYC verification status updated successfully!",
      });
    }

    if (action === "TOGGLE_WITHDRAW" || action === "BULK_TOGGLE_WITHDRAW") {
      const { targetUserId, targetUserIds, status } = body;

      if (action === "BULK_TOGGLE_WITHDRAW" && Array.isArray(targetUserIds)) {
        await supabase.from("User").update({ canWithdraw: Boolean(status) }).in("id", targetUserIds);
      } else if (targetUserId) {
        await supabase.from("User").update({ canWithdraw: Boolean(status) }).eq("id", targetUserId);
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal permission status updated!",
      });
    }

    if (action === "TOGGLE_SUSPEND") {
      const { targetUserId, status } = body;

      await supabase.from("User").update({ isSuspended: Boolean(status) }).eq("id", targetUserId);

      return NextResponse.json({
        success: true,
        message: "Account suspension status updated!",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action requested." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}