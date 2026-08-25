import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId, adminEmail } = body;

    // --- 1. SECURITY CHECK: VERIFY ADMIN / FOUNDER PRIVILEGES ---
    let isAuthorized = false;

    // Hardcoded safety bypasses for Founder
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

    // Dynamic database check if not matched via fallback
    if (!isAuthorized && adminId) {
      // Trying capitalized table name 'User' first, fallback to 'users'
      let { data: adminUser } = await supabase
        .from("User")
        .select("*")
        .eq("id", adminId)
        .maybeSingle();

      if (!adminUser) {
        const { data: fallbackUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", adminId)
          .maybeSingle();
        adminUser = fallbackUser;
      }

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
        { success: false, error: "Unauthorized: You do not have Founder or Admin permissions." },
        { status: 403 }
      );
    }

    // Helper function to query correct table name ('User' vs 'users')
    const getTableName = async () => {
      const { error } = await supabase.from("User").select("id").limit(1);
      return error ? "users" : "User";
    };

    const targetTable = await getTableName();

    // --- 2. ACTIONS IMPLEMENTATION ---

    // A. FETCH ALL USERS WITH REFERRAL COUNTS
    if (action === "FETCH_USERS") {
      const { data: rawUsers, error: usersErr } = await supabase
        .from(targetTable)
        .select("*")
        .order("created_at", { ascending: false });

      if (usersErr) {
        // Retry ordering by 'id' if 'created_at' does not exist
        const { data: retryUsers, error: retryErr } = await supabase
          .from(targetTable)
          .select("*");
        if (retryErr) throw retryErr;
        
        return NextResponse.json({ success: true, users: retryUsers });
      }

      const usersWithRefs = await Promise.all(
        (rawUsers || []).map(async (u) => {
          let refCount = 0;
          try {
            const { count } = await supabase
              .from(targetTable)
              .select("id", { count: "exact", head: true })
              .eq("referred_by_id", u.id);
            refCount = count || 0;
          } catch (e) {
            refCount = 0;
          }

          return {
            id: u.id,
            fullName: u.name || u.full_name || u.fullName || "Unnamed User",
            email: u.email || "No Email",
            balance: u.balance || 0,
            role: u.role || "USER",
            isSuspended: Boolean(u.is_suspended || u.isSuspended),
            isVerified: Boolean(u.is_verified || u.isVerified || u.verified),
            referralCount: refCount,
            createdAt: u.created_at || u.createdAt || new Date().toISOString(),
          };
        })
      );

      return NextResponse.json({ success: true, users: usersWithRefs });
    }

    // B. TOGGLE / BULK VERIFY USER STATUS
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
        .from(targetTable)
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
          .from(targetTable)
          .select("balance")
          .eq("id", uid)
          .maybeSingle();

        const currentBalance = parseFloat(targetUser?.balance || "0");
        const newBalance = currentBalance + tokenAmount;

        await supabase
          .from(targetTable)
          .update({ balance: newBalance })
          .eq("id", uid);

        // Record Airdrop Transaction log
        try {
          await supabase.from("Transaction").insert([
            {
              user_id: uid,
              amount: tokenAmount,
              type: "FOUNDER_AIRDROP",
              description: `Founder direct airdrop distribution (+${tokenAmount} APN)`,
            },
          ]);
        } catch (txErr) {
          console.log("Transaction table logging skipped if not existing.");
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully distributed ${tokenAmount} APN to ${userIdsToProcess.length} user(s).`,
      });
    }

    // D. TOGGLE / BULK SUSPEND USER ACCOUNTS
    if (action === "TOGGLE_SUSPEND" || action === "BULK_SUSPEND") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      const { error } = await supabase
        .from(targetTable)
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
        .from(targetTable)
        .delete()
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "User account(s) deleted successfully." });
    }

    // F. UPDATE SINGLE USER DETAILS
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, role, isVerified } = body;
      const { data: updated, error } = await supabase
        .from(targetTable)
        .update({
          name: name,
          email: email,
          balance: parseFloat(balance || "0"),
          role: role || "USER",
          is_verified: Boolean(isVerified),
        })
        .eq("id", targetUserId)
        .select()
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({ success: true, user: updated });
    }

    // G. CREATE TASKS
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
        .maybeSingle();

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