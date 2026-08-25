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

    // A. FETCH ALL USERS WITH VERIFICATION & REFERRAL COUNT
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
            id: u.id,
            fullName: u.name || u.full_name || u.fullName || "Unnamed User",
            email: u.email,
            balance: u.balance || 0,
            role: u.role || "USER",
            isSuspended: Boolean(u.is_suspended || u.isSuspended),
            isVerified: Boolean(u.is_verified || u.isVerified || u.verified),
            referralCount: count || 0,
            createdAt: u.created_at,
          };
        })
      );

      return NextResponse.json({ success: true, users: usersWithRefs });
    }

    // B. TOGGLE / BULK VERIFY USER STATUS (APPROVE / UNAPPROVE)
    if (action === "TOGGLE_VERIFY" || action === "BULK_VERIFY") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json(
          { success: false, error: "No user selected for verification." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ is_verified: Boolean(status) })
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Successfully updated verification status for ${userIdsToProcess.length} account(s).`,
      });
    }

    // C. BULK / SINGLE TOKEN AIRDROP & TRANSFER
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const tokenAmount = parseFloat(amount);

      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Please specify a valid positive token amount." },
          { status: 400 }
        );
      }

      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json(
          { success: false, error: "No target users selected for token distribution." },
          { status: 400 }
        );
      }

      for (const uid of userIdsToProcess) {
        const { data: targetUser } = await supabase
          .from("users")
          .select("balance")
          .eq("id", uid)
          .single();

        const currentBalance = parseFloat(targetUser?.balance || "0");
        const newBalance = currentBalance + tokenAmount;

        await supabase
          .from("users")
          .update({ balance: newBalance })
          .eq("id", uid);

        await supabase.from("transactions").insert([
          {
            user_id: uid,
            amount: tokenAmount,
            type: "FOUNDER_AIRDROP",
            description: `Founder direct airdrop distribution (+${tokenAmount} APN)`,
          },
        ]);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully distributed ${tokenAmount} APN to ${userIdsToProcess.length} user(s).`,
      });
    }

    // D. TOGGLE / BULK SUSPEND
    if (action === "TOGGLE_SUSPEND" || action === "BULK_SUSPEND") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      const { error } = await supabase
        .from("users")
        .update({ is_suspended: Boolean(status) })
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, count: userIdsToProcess.length });
    }

    // E. BULK / SINGLE DELETE USER ACCOUNT
    if (action === "DELETE_USER" || action === "BULK_DELETE") {
      const { targetUserId, targetUserIds } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      const { error } = await supabase
        .from("users")
        .delete()
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "User account(s) deleted successfully." });
    }

    // F. EDIT USER FULL KYC DETAILS, VERIFICATION & ROLE
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, role, isVerified } = body;
      const { data: updated, error } = await supabase
        .from("users")
        .update({
          name: name,
          email: email,
          balance: parseFloat(balance || "0"),
          role: role || "USER",
          is_verified: Boolean(isVerified),
        })
        .eq("id", targetUserId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, user: updated });
    }

    // G. CREATE NEW TASK
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

    // H. CREATE ANNOUNCEMENT / SOCIAL BROADCAST
    if (action === "CREATE_ANNOUNCEMENT") {
      const { title, content, mediaUrl, platform } = body;

      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert([
          {
            title,
            content,
            media_url: mediaUrl || "",
            platform: platform || "ALL",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      return NextResponse.json({ success: true, announcement: newAnnouncement });
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