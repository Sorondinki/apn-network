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

    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "1234567";

    if (action !== "FETCH_USERS" && masterPin !== MASTER_PIN) {
      return NextResponse.json(
        { success: false, error: "Invalid Master PIN provided." },
        { status: 401 }
      );
    }

    if (action === "FETCH_USERS") {
      const take = Number(limit);
      const from = (Number(page) - 1) * take;
      const to = from + take - 1;

      let query = supabase.from("User").select("*", { count: "exact" });

      // Search
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,fullName.ilike.%${search}%`);
      }

      // Tab Filtering a Database Level
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

      // Count na kowane rukuni domin nuna adadinsu a tabs
      const [verRes, boostRes, suspRes] = await Promise.all([
        supabase.from("User").select("id", { count: "exact", head: true }).eq("isVerified", true),
        supabase.from("User").select("id", { count: "exact", head: true }).or("isBoosting.eq.true,miningSpeed.gt.0.5"),
        supabase.from("User").select("id", { count: "exact", head: true }).eq("isSuspended", true)
      ]);

      const { data: transfers } = await supabase.from("FounderTransferLog").select("amount");
      let totalFounderTransferred = 0;
      if (transfers) {
        totalFounderTransferred = transfers.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      }

      return NextResponse.json({
        success: true,
        users: users || [],
        totalCount: count || 0,
        counts: {
          verified: verRes.count || 0,
          boosted: boostRes.count || 0,
          suspended: suspRes.count || 0
        },
        totalPages: Math.ceil((count || 0) / take) || 1,
        totalDistributedTokens: totalFounderTransferred,
        founderReserve: TOTAL_FOUNDER_RESERVE,
        maxSupply: TOTAL_MAX_SUPPLY,
      });
    }

    // Direct token transfer logic
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const transferAmount = Number(amount);

      if (!transferAmount || transferAmount <= 0) {
        return NextResponse.json({ success: false, error: "Please enter a valid $APN amount." }, { status: 400 });
      }

      if (action === "BULK_AIRDROP" && Array.isArray(targetUserIds)) {
        for (const id of targetUserIds) {
          const { data: u } = await supabase.from("User").select("balance").eq("id", id).single();
          await supabase.from("User").update({ balance: (Number(u?.balance) || 0) + transferAmount }).eq("id", id);
          await supabase.from("FounderTransferLog").insert([{ targetUserId: id, amount: transferAmount }]);
        }
        return NextResponse.json({ success: true, message: `Successfully airdropped ${transferAmount.toLocaleString()} $APN!` });
      }

      if (targetUserId) {
        const { data: u } = await supabase.from("User").select("balance").eq("id", targetUserId).single();
        await supabase.from("User").update({ balance: (Number(u?.balance) || 0) + transferAmount }).eq("id", targetUserId);
        await supabase.from("FounderTransferLog").insert([{ targetUserId, amount: transferAmount }]);
        return NextResponse.json({ success: true, message: `Successfully transferred ${transferAmount.toLocaleString()} $APN!` });
      }
    }

    // KYC, BOOST, SUSPEND toggles
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
      return NextResponse.json({ success: true, message: "User profile updated successfully!" });
    }

    if (action === "TOGGLE_VERIFY") {
      await supabase.from("User").update({ isVerified: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "KYC updated!" });
    }

    if (action === "TOGGLE_WITHDRAW") {
      await supabase.from("User").update({ canWithdraw: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "Withdraw status updated!" });
    }

    if (action === "TOGGLE_SUSPEND") {
      await supabase.from("User").update({ isSuspended: Boolean(body.status) }).eq("id", body.targetUserId);
      return NextResponse.json({ success: true, message: "Suspend status updated!" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
                 
