// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId } = body;

    // --- SECURITY CHECK: VERIFY ADMIN / FOUNDER PRIVILEGES ---
    let isAuthorized = adminId === "founder-root";

    if (!isAuthorized && adminId) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", adminId)
        .single();

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
      const { data: rawUsers, error: usersErr } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersErr) throw usersErr;

      const usersWithRefs = await Promise.all(
        (rawUsers || []).map(async (u) => {
          const { count } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("referred_by_id", u.id);

          return {
            ...u,
            name: u.name || "",
            referralCount: count || 0,
            miningStartTime: u.mining_start_time ? Number(u.mining_start_time) : null,
          };
        })
      );

      return NextResponse.json({ success: true, users: usersWithRefs });
    }

    // B. SUSPEND / UNSUSPEND USER ACCOUNT
    if (action === "TOGGLE_SUSPEND") {
      const { targetUserId, status } = body;
      const { data: updated, error } = await supabase
        .from("users")
        .update({ is_suspended: Boolean(status) })
        .eq("id", targetUserId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        isSuspended: updated.is_suspended,
      });
    }

    // C. DELETE USER ACCOUNT
    if (action === "DELETE_USER") {
      const { targetUserId } = body;
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", targetUserId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "User account deleted successfully.",
      });
    }

    // D. EDIT USER DETAILS
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email } = body;
      const { data: updated, error } = await supabase
        .from("users")
        .update({ name, email })
        .eq("id", targetUserId)
        .select()
        .single();

      if (error) throw error;

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

      // Fetch existing balance
      const { data: targetUser, error: fetchErr } = await supabase
        .from("users")
        .select("balance")
        .eq("id", targetUserId)
        .single();

      if (fetchErr) throw fetchErr;

      const currentBalance = parseFloat(targetUser?.balance || "0");
      const newBalance = currentBalance + tokenAmount;

      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", targetUserId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Log transaction record
      await supabase.from("transactions").insert([
        {
          user_id: targetUserId,
          amount: tokenAmount,
          type: "FOUNDER_AIRDROP",
          description: "Direct token transfer from Founder Vault",
        },
      ]);

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

      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert([
          {
            title,
            description: description || "",
            reward: parseFloat(reward),
            link,
            category: category || "GENERAL",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

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