"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Strict TypeScript Interfaces
interface User {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  balance?: number | string;
  miningSpeed?: number | string;
  miningBoost?: number | string;
  role?: string;
  isVerified?: boolean;
  isSuspended?: boolean;
  canWithdraw?: boolean;
  referralCount?: number;
  isBoosting?: boolean;
}

interface ActionPayload {
  action: string;
  adminId?: string;
  masterPin?: string;
  targetUserId?: string;
  targetUserIds?: string[];
  amount?: string | number;
  boostMultiplier?: number;
  boostSpeed?: number;
  userId?: string;
  status?: boolean;
  title?: string;
  content?: string;
  mediaUrl?: string;
  platform?: string;
  description?: string;
  reward?: string | number;
  link?: string;
  category?: string;
  name?: string;
  email?: string;
  balance?: string | number;
  miningSpeed?: string | number;
  role?: string;
  isVerified?: boolean;
  canWithdraw?: boolean;
}

export default function FounderAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search, Pagination & Selection State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Founder Treasury Token Balance Stats
  const TOTAL_FOUNDER_RESERVE = 250000000; // 250 Million APN Tokens
  const [totalDistributed, setTotalDistributed] = useState<number>(0);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Master PIN Authentication Modal State
  const [masterPin, setMasterPin] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Edit User / KYC & Boost Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editBalance, setEditBalance] = useState<string>("");
  const [editSpeed, setEditSpeed] = useState<string>("0.50");
  const [editRole, setEditRole] = useState<string>("USER");
  const [editIsVerified, setEditIsVerified] = useState<boolean>(false);
  const [editCanWithdraw, setEditCanWithdraw] = useState<boolean>(true);

  // Mining Speed Quick Select Modal State
  const [boostingUser, setBoostingUser] = useState<User | null>(null);

  // Token Transfer State
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  // New Task State
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDesc, setTaskDesc] = useState<string>("");
  const [taskReward, setTaskReward] = useState<string>("");
  const [taskLink, setTaskLink] = useState<string>("");
  const [taskCategory, setTaskCategory] = useState<string>("TWITTER");

  // Announcement State
  const [postTitle, setPostTitle] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [postMediaUrl, setPostMediaUrl] = useState<string>("");
  const [targetPlatform, setTargetPlatform] = useState<string>("ALL");

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Users Function with Server-Side Search & Pagination
  const fetchUsers = useCallback(async (adminId: string, search: string = "", page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?search=${encodeURIComponent(search)}&page=${page}&limit=100`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FETCH_USERS",
          adminId: adminId,
          search: search,
          page: page,
          limit: 100
        }),
      });
      const data = await res.json();
      if (data.success || Array.isArray(data.users)) {
        setUsers(data.users || []);
        setTotalUsersCount(data.totalCount || (data.users ? data.users.length : 0));
        setTotalPages(data.totalPages || 1);
        if (data.totalDistributedTokens !== undefined) {
          setTotalDistributed(data.totalDistributedTokens);
        }
      } else {
        showToast(data.error || "Failed to load user records.", "error");
      }
    } catch (e) {
      showToast("Network error fetching user database.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // CHECK AUTHORIZATION
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    try {
      const userData: User = JSON.parse(savedUser);
      const email = userData.email?.toLowerCase();

      const isFounderEmail =
        email === "contact.aprotech@gmail.com" ||
        email === "sorondinkiseeme@gmail.com";

      const hasAdminRole = userData.role === "FOUNDER" || userData.role === "ADMIN";

      if (!isFounderEmail && !hasAdminRole) {
        showToast("Access Denied: Founder/Admin credentials required.", "error");
        setTimeout(() => router.push("/dashboard"), 1500);
        return;
      }

      setAdmin(userData);
      fetchUsers(userData.id || "founder-root", searchTerm, currentPage);
    } catch (err) {
      console.error("Failed to parse user data", err);
      router.push("/login");
    }
  }, [router, fetchUsers, showToast]);

  // Handle Search Input with Debounce/Trigger
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    fetchUsers(admin?.id || "founder-root", val, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchUsers(admin?.id || "founder-root", searchTerm, newPage);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Trigger Master PIN Confirmation
  const triggerAction = (actionData: ActionPayload) => {
    setPendingAction(actionData);
    setShowPinModal(true);
  };

  // Execute Action After PIN Provided
  const executeActionWithPin = async () => {
    if (!masterPin) {
      showToast("Please enter Master Security PIN!", "error");
      return;
    }

    try {
      let endpoint = "/api/admin";
      let payload: any = {
        ...pendingAction,
        adminId: admin?.id || "founder-root",
        masterPin: masterPin,
      };

      if (pendingAction?.action === "TRANSFER_MENTOR_TOKENS") {
        endpoint = "/api/admin/send-tokens";
        payload = {
          adminId: admin?.id || "founder-root",
          mentorUserId: pendingAction.targetUserId,
          targetUserId: pendingAction.targetUserId,
          amount: pendingAction.amount,
          masterPin: masterPin,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message || "Action executed successfully! 🚀", "success");
        setShowPinModal(false);
        setMasterPin("");
        setPendingAction(null);
        setEditingUser(null);
        setBoostingUser(null);
        setSelectedUserIds([]);

        // Reset inputs
        setTaskTitle(""); setTaskDesc(""); setTaskReward(""); setTaskLink("");
        setPostTitle(""); setPostContent(""); setPostMediaUrl("");
        setTransferAmount(""); setTransferTargetId("");

        fetchUsers(admin?.id || "founder-root", searchTerm, currentPage);
      } else {
        showToast(data.error || "Execution failed. Check Master PIN.", "error");
      }
    } catch (e) {
      showToast("Network connection error.", "error");
    }
  };

  if (!admin) return null;

  const availableReserve = TOTAL_FOUNDER_RESERVE - totalDistributed;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans relative">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-xl animate-bounce">
          <span>{toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}</span>
          <span className="text-xs font-semibold text-white">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-purple-900/40 border border-emerald-500/30 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/40">
            🛡️ APN Network Founder Console
          </div>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Founder Executive Portal</h1>
          <p className="text-gray-400 text-xs mt-1">Manage network users, mining speed boosts, verification approvals, and APN tokens.</p>
        </div>
        <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 text-right">
          <span className="text-[10px] text-gray-400 font-bold block uppercase">Primary Admin</span>
          <span className="text-emerald-400 font-bold text-sm font-mono">{admin.email}</span>
        </div>
      </div>

      {/* 250 MILLION APN FOUNDER TREASURY & RESERVE DASHBOARD CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-900/20 border border-amber-500/40 shadow-2xl relative overflow-hidden col-span-1 md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/40">
                💎 Founder Master Vault Reserve
              </div>
              <h2 className="text-2xl font-black text-white mt-3 font-mono">
                {TOTAL_FOUNDER_RESERVE.toLocaleString()} <span className="text-amber-400 text-lg">APN</span>
              </h2>
              <p className="text-gray-400 text-xs mt-1">Total Genesis Founder Allocation for Airdrops, Boost Rewards & Staking Pools.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-medium block">Circulating / Minted</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">
                {totalDistributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APN
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-between items-center text-xs">
            <span className="text-gray-300">Remaining Vault Reserve:</span>
            <span className="font-mono font-bold text-amber-300">
              {availableReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APN
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Database Users</span>
            <div className="text-3xl font-black text-white mt-2 font-mono">{totalUsersCount.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400 mt-1">Live synchronized record from Supabase cluster.</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
            <span>Server Search:</span>
            <span className="text-emerald-400 font-bold">Active (ilike)</span>
          </div>
        </div>
      </div>

      {/* MAIN ACTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* FORM 1: ANNOUNCEMENT */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3 text-xs">
            <h3 className="text-md font-bold text-purple-400 flex items-center gap-2">
              🌐 Broadcast Announcement
            </h3>
            <input
              type="text"
              placeholder="Announcement Title"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
            />
            <textarea
              placeholder="Post Content / Update details..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none h-20"
            />
            <input
              type="text"
              placeholder="Banner Image URL (Optional)"
              value={postMediaUrl}
              onChange={(e) => setPostMediaUrl(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
            />
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
            >
              <option value="ALL">All APN Feeds & Telegram</option>
              <option value="TWITTER">Twitter/X Channel</option>
              <option value="TELEGRAM">Telegram Announcement Group</option>
            </select>
          </div>
          <button
            onClick={() => triggerAction({
              action: "CREATE_ANNOUNCEMENT",
              title: postTitle,
              content: postContent,
              mediaUrl: postMediaUrl,
              platform: targetPlatform,
            })}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl transition shadow-lg shadow-purple-900/40 mt-3"
          >
            📢 Broadcast Update
          </button>
        </div>

        {/* FORM 2: POST A NEW TASK */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3 text-xs">
            <h3 className="text-md font-bold text-emerald-400 flex items-center gap-2">
              🚀 Post Network Task
            </h3>
            <input
              type="text"
              placeholder="Task Title (e.g., Follow APN Twitter)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
            />
            <textarea
              placeholder="Task Instructions"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none h-20"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Reward (APN)"
                value={taskReward}
                onChange={(e) => setTaskReward(e.target.value)}
                className="bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
              />
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
              >
                <option value="TWITTER">Twitter/X</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Task Link URL"
              value={taskLink}
              onChange={(e) => setTaskLink(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <button
            onClick={() => triggerAction({
              action: "CREATE_TASK",
              title: taskTitle,
              description: taskDesc,
              reward: taskReward,
              link: taskLink,
              category: taskCategory,
            })}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl transition shadow-lg shadow-emerald-900/40 mt-3"
          >
            ⚡ Publish Task
          </button>
        </div>

        {/* FORM 3: TOKEN TRANSFER / BULK AIRDROP */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3 text-xs">
            <h3 className="text-md font-bold text-blue-400 flex items-center gap-2">
              💎 Direct Token Transfer
            </h3>
            <p className="text-xs text-gray-400">Transfer native APN to single user or selected bulk users.</p>

            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            >
              <option value="">-- Single Recipient (Optional if Bulk) --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.name || "User"} ({u.email || "No email"}) - Speed: {Number(u.miningSpeed || 0.5).toFixed(2)}x
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount in APN (e.g. 50)"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => triggerAction({
              action: selectedUserIds.length > 0 ? "BULK_AIRDROP" : "TRANSFER_TOKENS",
              targetUserId: transferTargetId || undefined,
              targetUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
              amount: transferAmount,
            })}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl transition shadow-lg shadow-blue-900/40 mt-3"
          >
            {selectedUserIds.length > 0 
              ? `🎁 Airdrop ${transferAmount || 0} APN to (${selectedUserIds.length}) Selected` 
              : "💸 Transfer APN Tokens"}
          </button>
        </div>

      </div>

      {/* USER DATABASE & BULK CONTROL PANEL */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-gray-800 backdrop-blur-md space-y-4 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-white">📋 Registered Network Users</h3>
            <p className="text-xs text-gray-400">Select users for mining speed boosting, verification approvals, airdrops, or suspensions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Search email or name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-black/80 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none w-full md:w-72"
            />
            <span className="text-xs bg-slate-800 px-3 py-2 rounded-xl text-gray-300 font-mono border border-gray-700">
              Total: <b>{totalUsersCount}</b>
            </span>
          </div>
        </div>

        {/* BULK ACTIONS TOOLBAR */}
        {selectedUserIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-wrap justify-between items-center gap-4 animate-fade-in">
            <div className="text-xs font-bold text-emerald-400">
              🎯 Selected ({selectedUserIds.length}) Accounts
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => triggerAction({
                  action: "BULK_APPLY_BOOST",
                  targetUserIds: selectedUserIds,
                  boostMultiplier: 2.5,
                })}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
              >
                ⚡ Boost 2.5x (3.0x Total)
              </button>

              <button
                onClick={() => triggerAction({
                  action: "BULK_APPLY_BOOST",
                  targetUserIds: selectedUserIds,
                  boostMultiplier: 5.0,
                })}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
              >
                🔥 Boost 5.0x (5.5x Total)
              </button>

              <button
                onClick={() => triggerAction({
                  action: "BULK_VERIFY",
                  targetUserIds: selectedUserIds,
                  status: true,
                })}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
              >
                ✅ Verify Selected
              </button>

              <button
                onClick={() => triggerAction({
                  action: "BULK_TOGGLE_WITHDRAW",
                  targetUserIds: selectedUserIds,
                  status: true,
                })}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow"
              >
                🚫 Suspend Selected
              </button>
            </div>
          </div>
        )}

        {/* USERS TABLE */}
        {loading ? (
          <p className="text-gray-400 text-xs animate-pulse p-4">Loading user records from database...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono">
                  <th className="p-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Mining Speed</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">Withdrawal</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No matching users found for "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const currentSpeed = Number(u.miningSpeed || 0.50);
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleSelectUser(u.id)}
                            className="rounded accent-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.fullName || u.name || "N/A"}
                            {u.isVerified && <span className="text-blue-400 text-sm" title="Verified Account">☑️</span>}
                          </div>
                          <div className="text-gray-400 text-[11px] font-mono">{u.email}</div>
                        </td>

                        {/* MINING SPEED COLUMN */}
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md font-mono font-bold text-[11px] ${
                            currentSpeed >= 5.0 
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                              : currentSpeed >= 3.0 
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            ⚡ {currentSpeed.toFixed(2)}x / hr
                          </span>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => triggerAction({
                              action: "TOGGLE_VERIFY",
                              targetUserId: u.id,
                              status: !u.isVerified,
                            })}
                            className={`px-2 py-1 rounded-md font-bold text-[10px] transition ${
                              u.isVerified 
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                                : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-emerald-600/20 hover:text-emerald-400"
                            }`}
                          >
                            {u.isVerified ? "☑️ Verified" : "⏳ Approve KYC"}
                          </button>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => triggerAction({
                              action: "TOGGLE_WITHDRAW",
                              targetUserId: u.id,
                              status: !(u.canWithdraw ?? true),
                            })}
                            className={`px-2 py-1 rounded-md font-bold text-[10px] transition ${
                              (u.canWithdraw ?? true)
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {(u.canWithdraw ?? true) ? "🟢 Allowed" : "🔴 Blocked"}
                          </button>
                        </td>
                        <td className="p-3 font-mono font-semibold text-emerald-400">
                          {Number(u.balance || 0).toFixed(2)} APN
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                            u.isSuspended 
                              ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {u.isSuspended ? "🚫 Suspended" : "✅ Active"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* 1. Maɓallin Approve 3.0x Speed */}
                            <button
                              onClick={() => triggerAction({
                                action: "TOGGLE_BOOST",
                                userId: u.id,
                                boostSpeed: 3.00,
                              })}
                              className={`px-2 py-1 rounded text-xs font-bold transition ${
                                Number(u.miningSpeed) === 3.0
                                  ? "bg-amber-500 text-black font-extrabold"
                                  : "bg-gray-800 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                            >
                              ⚡ 3.0x Boost
                            </button>
                            {/* 2. Maɓallin Approve 5.50x Speed */}
                            <button
                              onClick={() => triggerAction({
                                action: "TOGGLE_BOOST",
                                userId: u.id,
                                boostSpeed: 5.50,
                              })}
                              className={`px-2 py-1 rounded text-xs font-bold transition ${
                                Number(u.miningSpeed) === 5.5
                                  ? "bg-emerald-500 text-black font-extrabold"
                                  : "bg-gray-800 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              }`}
                            >
                              ⚡ 5.5x Boost
                            </button>

                            {/* 3. Maɓallin Reset Speed zuwa Normal (0.50x) */}
                            {(u.isBoosting || Number(u.miningSpeed) > 0.5) && (
                              <button
                                onClick={() => triggerAction({
                                  action: "TOGGLE_BOOST",
                                  userId: u.id,
                                  boostSpeed: 0.50,
                                })}
                                className="px-1.5 py-1 text-xs text-red-400 hover:text-red-300 underline"
                                title="Mayar da mutum 0.50x"
                              >
                                Remove
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditName(u.fullName || u.name || "");
                                setEditEmail(u.email || "");
                                setEditBalance(String(u.balance || 0));
                                setEditSpeed(String(u.miningSpeed || 0.50));
                                setEditRole(u.role || "USER");
                                setEditIsVerified(u.isVerified || false);
                                setEditCanWithdraw(u.canWithdraw ?? true);
                              }}
                              className="px-2.5 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 rounded-lg border border-amber-500/30 font-bold"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => triggerAction({
                                action: "TOGGLE_SUSPEND",
                                targetUserId: u.id,
                                status: !u.isSuspended,
                              })}
                              className="px-2.5 py-1 bg-orange-600/20 text-orange-400 hover:bg-orange-600/40 rounded-lg border border-orange-500/30 font-bold"
                            >
                              {u.isSuspended ? "Unsuspend" : "Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION NAVIGATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-800 text-xs">
            <span className="text-gray-400 font-mono">
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-xl font-bold transition"
              >
                ◀ Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl font-bold transition"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK SPEED BOOST MODAL */}
      {boostingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-purple-500/40 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 className="text-lg font-black text-purple-400">⚡ Apply Mining Speed Boost</h3>
            <p className="text-xs text-gray-300">
              Select boost package for <b>{boostingUser.fullName || boostingUser.name}</b> ({boostingUser.email}):
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => triggerAction({
                  action: "TOGGLE_BOOST",
                  userId: boostingUser.id,
                  boostSpeed: 3.00,
                })}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg flex justify-between px-4 items-center"
              >
                <span>⚡ 3.0x Boost Package</span>
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded">3.00x Speed</span>
              </button>

              <button
                onClick={() => triggerAction({
                  action: "TOGGLE_BOOST",
                  userId: boostingUser.id,
                  boostSpeed: 5.50,
                })}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-lg flex justify-between px-4 items-center"
              >
                <span>🔥 5.5x Boost Package</span>
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded">5.50x Speed</span>
              </button>
            </div>
            <button
              onClick={() => setBoostingUser(null)}
              className="w-full py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EDIT USER KYC & VERIFICATION MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-amber-400">✏️ Edit KYC & Custom Mining Speed</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Full Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Email Address:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">APN Balance:</label>
                  <input
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Mining Speed (x):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSpeed}
                    onChange={(e) => setEditSpeed(e.target.value)}
                    className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">User Role:</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-white outline-none"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="FOUNDER">FOUNDER</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="verifyCheckbox"
                  checked={editIsVerified}
                  onChange={(e) => setEditIsVerified(e.target.checked)}
                  className="rounded accent-blue-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="verifyCheckbox" className="text-blue-400 font-bold cursor-pointer">
                  Mark User as Verified (KYC Approved ☑️)
                </label>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="canWithdrawCheckbox"
                  checked={editCanWithdraw}
                  onChange={(e) => setEditCanWithdraw(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="canWithdrawCheckbox" className="text-emerald-400 font-bold cursor-pointer">
                  Allow User to Withdraw Funds (canWithdraw)
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="w-1/2 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>

              <button
                onClick={() => triggerAction({
                  action: "UPDATE_USER",
                  targetUserId: editingUser.id,
                  name: editName,
                  email: editEmail,
                  balance: editBalance,
                  miningSpeed: editSpeed,
                  role: editRole,
                  isVerified: editIsVerified,
                  canWithdraw: editCanWithdraw,
                })}
                className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-900/50"
              >
                Save Changes 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-500/40 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 className="text-lg font-black text-white">Master PIN Authentication</h3>
            <p className="text-xs text-gray-400">Enter your Founder Master Security PIN to confirm action.</p>
            <input
              type="password"
              placeholder="Enter Master PIN"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              className="w-full bg-black/80 border border-red-500/50 rounded-xl p-3 text-center text-white text-sm focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPinModal(false); setMasterPin(""); }}
                className="w-1/2 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeActionWithPin}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/50"
              >
                Confirm 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
