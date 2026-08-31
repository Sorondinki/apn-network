import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, adminId, adminEmail } = body;

    // --- 1. SECURITY CHECK: VERIFY ADMIN / FOUNDER PRIVILEGES ---
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
      let { data: adminUser } = await supabase
        .from("User")
        .select("*")
        .eq("id", adminId)
        .maybeSingle();

      if (!adminUser) {
        const { data: fallbackUser } = await supabase
          .from("User")
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

    // --- 2. SECURITY CHECK: MASTER PIN VERIFICATION ---
    const providedPin = body.masterPin || body.pin;
    const VALID_MASTER_PIN = process.env.MASTER_PIN || "APN-FOUNDER-2026#SECURE";

    const pinProtectedActions = [
      "FETCH_USERS",
      "GET_FOUNDER_STATS",
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

    // --- HELPER FUNCTION: CALCULATE FOUNDER TREASURY BALANCE ---
    async function getFounderBalanceStats() {
      const TOTAL_FOUNDER_SUPPLY = 250000000; // 250 Million APN
      
      const { data: txData } = await supabase
        .from("Transaction")
        .select("amount")
        .in("type", ["FOUNDER_AIRDROP", "ADMIN_TRANSFER", "FOUNDER_BONUS"]);

      const totalDistributed = (txData || []).reduce(
        (acc, tx) => acc + parseFloat(tx.amount || 0),
        0
      );

      return {
        initialSupply: TOTAL_FOUNDER_SUPPLY,
        totalDistributed: totalDistributed,
        remainingBalance: Math.max(0, TOTAL_FOUNDER_SUPPLY - totalDistributed)
      };
    }

    // --- 3. IMPLEMENTATION OF ALL ACTIONS ---

    // A. FETCH ALL USERS & FOUNDER TREASURY METRICS
    if (action === "FETCH_USERS" || action === "GET_FOUNDER_STATS") {
      let rawUsers: any[] = [];
      
      const { data, error: usersErr } = await supabase
        .from(targetTable)
        .select("*")
        .order("createdAt", { ascending: false });

      if (usersErr) {
        const { data: retryUsers, error: retryErr } = await supabase
          .from(targetTable)
          .select("*");
        if (retryErr) throw retryErr;
        rawUsers = retryUsers || [];
      } else {
        rawUsers = data || [];
      }

      const usersWithRefs = await Promise.all(
        rawUsers.map(async (u) => {
          let refCount = 0;
          try {
            const { count } = await supabase
              .from(targetTable)
              .select("id", { count: "exact", head: true })
              .eq("referredById", u.id);
            refCount = count || 0;
          } catch (e) {
            refCount = 0;
          }

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
            referralCount: refCount,
            createdAt: u.createdAt || new Date().toISOString(),
          };
        })
      );

      const founderStats = await getFounderBalanceStats();

      return NextResponse.json({ 
        success: true, 
        users: usersWithRefs,
        founderTreasury: founderStats
      });
    }

    // B. APPLY PAYSTACK MINING SPEED BOOST (SINGLE OR BULK)
    if (action === "APPLY_MINING_BOOST" || action === "BULK_APPLY_BOOST") {
      const { targetUserId, targetUserIds, boostMultiplier } = body;
      const boostVal = parseFloat(boostMultiplier || "2.5");
      const BASE_SPEED = 0.50;
      const calculatedSpeed = BASE_SPEED + boostVal; // E.g., 0.50 + 2.50 = 3.00x or 0.50 + 5.00 = 5.50x

      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No target users selected for boost." }, { status: 400 });
      }

      // Safe update across potential DB column names
      const updateData: Record<string, any> = {
        miningSpeed: calculatedSpeed,
        miningBoost: boostVal,
      };

      const { error } = await supabase
        .from(targetTable)
        .update(updateData)
        .in("id", userIdsToProcess);

      if (error) {
        // Fallback for custom columns
        await supabase
          .from(targetTable)
          .update({ miningSpeed: calculatedSpeed })
          .in("id", userIdsToProcess);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully set Mining Speed to ${calculatedSpeed.toFixed(2)}x (+${boostVal.toFixed(1)}x boost) for ${userIdsToProcess.length} user(s).`,
      });
    }

    // C. TOGGLE / BULK VERIFY
    if (action === "TOGGLE_VERIFY" || action === "BULK_VERIFY") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No target users selected." }, { status: 400 });
      }

      const { error } = await supabase
        .from(targetTable)
        .update({ isVerified: Boolean(status) })
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Successfully updated verification for ${userIdsToProcess.length} user(s).`,
      });
    }

    // C.2. TOGGLE / BULK WITHDRAWAL PERMISSIONS
    if (action === "TOGGLE_WITHDRAW" || action === "BULK_TOGGLE_WITHDRAW") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No target users selected." }, { status: 400 });
      }

      try {
        const { error } = await supabase
          .from(targetTable)
          .update({ canWithdraw: Boolean(status) })
          .in("id", userIdsToProcess);

        if (error) throw error;
      } catch (e: any) {
        console.warn("canWithdraw column might be missing, skipping error:", e?.message);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated withdrawal permission for ${userIdsToProcess.length} user(s).`,
      });
    }

    // D. TRANSFER_TOKENS & BULK_AIRDROP
    if (action === "TRANSFER_TOKENS" || action === "BULK_AIRDROP") {
      const { targetUserId, targetUserIds, amount } = body;
      const tokenAmount = parseFloat(amount);

      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        return NextResponse.json({ success: false, error: "Please enter a valid positive token amount." }, { status: 400 });
      }

      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No target users selected." }, { status: 400 });
      }

      const totalRequired = tokenAmount * userIdsToProcess.length;
      const founderStats = await getFounderBalanceStats();

      if (founderStats.remainingBalance < totalRequired) {
        return NextResponse.json({
          success: false,
          error: `Insufficient Founder Treasury Balance. Available: ${founderStats.remainingBalance} APN, Required: ${totalRequired} APN`
        }, { status: 400 });
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

        try {
          await supabase.from("Transaction").insert([
            {
              userId: uid,
              amount: tokenAmount,
              type: "FOUNDER_AIRDROP",
              description: `Founder direct distribution (+${tokenAmount} APN)`,
              createdAt: new Date().toISOString()
            },
          ]);
        } catch (txErr) {
          console.log("Transaction logging fallback.");
        }
      }

      const updatedStats = await getFounderBalanceStats();

      return NextResponse.json({
        success: true,
        message: `Successfully distributed ${tokenAmount} APN to ${userIdsToProcess.length} user(s).`,
        founderTreasury: updatedStats
      });
    }

    // E. TOGGLE / BULK SUSPEND
    if (action === "TOGGLE_SUSPEND" || action === "BULK_SUSPEND") {
      const { targetUserId, targetUserIds, status } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No user selected." }, { status: 400 });
      }

      const { error } = await supabase
        .from(targetTable)
        .update({ isSuspended: Boolean(status) })
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, message: `Updated suspension status for ${userIdsToProcess.length} account(s).` });
    }

    // F. DELETE / BULK DELETE
    if (action === "DELETE_USER" || action === "BULK_DELETE") {
      const { targetUserId, targetUserIds } = body;
      const userIdsToProcess: string[] = targetUserIds || (targetUserId ? [targetUserId] : []);

      if (userIdsToProcess.length === 0) {
        return NextResponse.json({ success: false, error: "No user selected for deletion." }, { status: 400 });
      }

      const { error } = await supabase
        .from(targetTable)
        .delete()
        .in("id", userIdsToProcess);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "User account(s) deleted successfully." });
    }

    // G. UPDATE USER DETAILS & MINING SPEED
    if (action === "UPDATE_USER") {
      const { targetUserId, name, email, balance, miningSpeed, role, isVerified, canWithdraw } = body;
      
      const updatePayload: Record<string, any> = {
        name: name,
        fullName: name,
        email: email,
        balance: parseFloat(balance || "0"),
        miningSpeed: parseFloat(miningSpeed || "0.50"),
        role: role || "USER",
        isVerified: Boolean(isVerified),
      };

      if (canWithdraw !== undefined) {
        updatePayload.canWithdraw = Boolean(canWithdraw);
      }

      const { data: updated, error } = await supabase
        .from(targetTable)
        .update(updatePayload)
        .eq("id", targetUserId)
        .select()
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({ success: true, message: "User details & Mining speed updated successfully.", user: updated });
    }

    // H. CREATE TASK
    if (action === "CREATE_TASK") {
      const { title, description, reward, link, category } = body;

      if (!title || !reward || !link) {
        return NextResponse.json({ success: false, error: "Title, reward, and link URL are required." }, { status: 400 });
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
            isActive: true,
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({ success: true, message: "New task created successfully.", task: newTask });
    }

    // I. CREATE ANNOUNCEMENT
    if (action === "CREATE_ANNOUNCEMENT") {
      const { message: announcementMsg, title, content, mediaUrl, platform } = body;
      const postText = content || announcementMsg;

      if (!postText && !title) {
        return NextResponse.json({ success: false, error: "Announcement content cannot be empty." }, { status: 400 });
      }

      try {
        await supabase.from("announcements").insert([
          {
            title: title || "Network Announcement",
            content: postText,
            mediaUrl: mediaUrl || null,
            platform: platform || "ALL",
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.log("Announcement logging fallback.");
      }

      return NextResponse.json({ success: true, message: "Announcement broadcasted successfully." });
    }

    return NextResponse.json({ success: false, error: "Invalid action requested." }, { status: 400 });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
        
