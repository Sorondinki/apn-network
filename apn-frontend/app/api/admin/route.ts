import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TOTAL_MAX_SUPPLY = 1000000000;
const TOTAL_FOUNDER_RESERVE = 250000000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, masterPin, search = "", page = 1, limit = 100, filterTab = "ALL" } = body;

    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "1234";

    if (action !== "FETCH_USERS" && masterPin !== MASTER_PIN) {
      return NextResponse.json({ success: false, error: "Invalid Master PIN provided." }, { status: 401 });
    }

    if (action === "FETCH_USERS") {
      const take = Number(limit);
      const from = (Number(page) - 1) * take;
      const to = from + take - 1;

      let query = supabase.from("User").select("id, name, fullName, email, balance, miningSpeed, role, isVerified, isSuspended, canWithdraw, isBoosting", { count: "exact" });

      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,fullName.ilike.%${search}%`);
      }

      if (filterTab === "VERIFIED") {
        query = query.eq("isVerified", true);
      } else if (filterTab === "BOOSTED") {
        query = query.or("isBoosting.eq.true,miningSpeed.gt.0.5");
      } else if (filterTab === "SUSPENDED") {
        query = query.eq("isSuspended", true);
      }

      const { data: users, count, error } = await query
        .order("createdAt", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Dauko adadin abinda aka tura cikin sauri ba tare da faduwa ba
      let totalFounderTransferred = 0;
      try {
        const { data: transfers } = await supabase.from("FounderTransferLog").select("amount").limit(5000);
        if (transfers) {
          totalFounderTransferred = transfers.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        }
      } catch (err) {
        console.warn("FounderTransferLog query skipped:", err);
      }

      return NextResponse.json({
        success: true,
        users: users || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / take) || 1,
        totalDistributedTokens: totalFounderTransferred,
        founderReserve: TOTAL_FOUNDER_RESERVE,
        maxSupply: TOTAL_MAX_SUPPLY,
      });
    }

    // Direct Token Transfer / Bulk Airdrop
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const transferAmount = Number(amount);

      if (!transferAmount || transferAmount <= 0) {
        return NextResponse.json({ success: false, error: "Please enter a valid $APN amount." }, { status: 400 });
      }

      if (action === "BULK_AIRDROP" && Array.isArray(targetUserIds)) {
        for (const id of targetUserIds) {
          const { data: u } = await supabase.from("User").select("balance").eq("id", id).single();
          const nextBal = (Number(u?.balance) || 0) + transferAmount;
          await supabase.from("User").update({ balance: nextBal }).eq("id", id);
          await supabase.from("FounderTransferLog").insert([{ targetUserId: id, amount: transferAmount }]);
        }
        return NextResponse.json({ success: true, message: `Successfully airdropped ${transferAmount.toLocaleString()} $APN!` });
      }

      if (targetUserId) {
        const { data: u } = await supabase.from("User").select("balance").eq("id", targetUserId).single();
        const nextBal = (Number(u?.balance) || 0) + transferAmount;
        
        const { error: updErr } = await supabase.from("User").update({ balance: nextBal }).eq("id", targetUserId);
        if (updErr) throw updErr;

        await supabase.from("FounderTransferLog").insert([{ targetUserId, amount: transferAmount }]);

        return NextResponse.json({ success: true, message: `Successfully transferred ${transferAmount.toLocaleString()} $APN!` });
      }
    }

    // Toggle KYC Verification
    if (action === "TOGGLE_VERIFY") {
      await supabase.from("User").update({ isVerified: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "KYC verification updated!" });
    }

    // Toggle Withdraw
    if (action === "TOGGLE_WITHDRAW") {
      await supabase.from("User").update({ canWithdraw: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "Withdrawal permission updated!" });
    }

    // Toggle Suspend
    if (action === "TOGGLE_SUSPEND") {
      await supabase.from("User").update({ isSuspended: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "Suspension updated!" });
    }

    // Toggle Boost
    if (action === "TOGGLE_BOOST") {
      const speed = Number(body.boostSpeed);
      await supabase.from("User").update({ miningSpeed: speed, isBoosting: speed > 0.5 }).eq("id", body.userId);
      return NextResponse.json({ success: true, message: "Mining speed updated!" });
    }

    // Update User Profile
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, miningSpeed, role, isVerified, canWithdraw } = body;
      const { error } = await supabase.from("User").update({
        fullName: name,
        name,
        email,
        balance: Number(balance),
        miningSpeed: Number(miningSpeed),
        role,
        isVerified: Boolean(isVerified),
        canWithdraw: Boolean(canWithdraw),
      }).eq("id", targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Profile updated successfully!" });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
  }
            
