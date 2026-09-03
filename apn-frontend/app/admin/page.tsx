"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  balance?: number | string;
  miningSpeed?: number | string;
  role?: string;
  isVerified?: boolean;
  isSuspended?: boolean;
  canWithdraw?: boolean;
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

  // Active Category Filter Tab State
  const [activeTab, setActiveTab] = useState<"ALL" | "VERIFIED" | "BOOSTED" | "SUSPENDED">("ALL");

  // Search, Pagination & Selection State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Tokenomics Architecture (1 Billion Max Supply)
  const TOTAL_MAX_SUPPLY = 1000000000;
  const TOTAL_FOUNDER_RESERVE = 250000000;
  const [totalDistributed, setTotalDistributed] = useState<number>(0);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Master PIN Authentication Modal State
  const [masterPin, setMasterPin] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<{
    referenceId: string;
    recipientName: string;
    recipientEmail: string;
    amount: string | number;
    date: string;
    status: string;
  } | null>(null);

  // Edit User / KYC Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editBalance, setEditBalance] = useState<string>("");
  const [editSpeed, setEditSpeed] = useState<string>("0.50");
  const [editRole, setEditRole] = useState<string>("USER");
  const [editIsVerified, setEditIsVerified] = useState<boolean>(false);
  const [editCanWithdraw, setEditCanWithdraw] = useState<boolean>(true);

  // Direct Token Transfer Inputs
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Users Function
  const fetchUsers = useCallback(async (adminId: string, search: string = "", page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FETCH_USERS",
          adminId,
          search,
          page,
          limit: 100,
        }),
      });
      const data = await res.json();
      if (data.success || Array.isArray(data.users)) {
        setUsers(data.users || []);
        setTotalUsersCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        if (data.totalDistributedTokens !== undefined) {
          setTotalDistributed(data.totalDistributedTokens);
        }
      } else {
        showToast(data.error || "Failed to load user records.", "error");
      }
    } catch (e) {
      showToast("Network error fetching database.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Auth Check
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
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
        showToast("Access Denied: Founder credentials required.", "error");
        setTimeout(() => router.push("/dashboard"), 1500);
        return;
      }

      setAdmin(userData);
      fetchUsers(userData.id || "founder-root", searchTerm, currentPage);
    } catch (err) {
      router.push("/login");
    }
  }, [router, fetchUsers, showToast]);

  // Tab switching clears explicit row selection
  const handleTabChange = (tab: "ALL" | "VERIFIED" | "BOOSTED" | "SUSPENDED") => {
    setActiveTab(tab);
    setSelectedUserIds([]);
  };

  // Client-Side Tab Filtering Logic
  const filteredUsers = users.filter((u) => {
    const speed = Number(u.miningSpeed || 0.5);
    if (activeTab === "VERIFIED") return u.isVerified === true;
    if (activeTab === "BOOSTED") return u.isBoosting === true || speed > 0.5;
    if (activeTab === "SUSPENDED") return u.isSuspended === true;
    return true; // "ALL"
  });

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
      setSelectedUserIds(filteredUsers.map((u) => u.id));
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

  const triggerAction = (actionData: ActionPayload) => {
    setPendingAction(actionData);
    setShowPinModal(true);
  };

  const executeActionWithPin = async () => {
    if (!masterPin) {
      showToast("Please enter Master Security PIN!", "error");
      return;
    }

    try {
      const isMentorTransfer =
        pendingAction?.action === "TRANSFER_MENTOR_TOKENS" ||
        pendingAction?.action === "TRANSFER_TOKENS";

      const endpoint = isMentorTransfer ? "/api/admin/send-tokens" : "/api/admin";

      const payload: any = {
        ...pendingAction,
        adminId: admin?.id || "founder-root",
        masterPin,
      };

      if (isMentorTransfer) {
        payload.mentorUserId = pendingAction?.targetUserId;
        payload.targetUserId = pendingAction?.targetUserId;
        payload.amount = pendingAction?.amount;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message || "Operation completed successfully!", "success");
        setShowPinModal(false);

        // Generate Receipt for Transfers/Airdrops
        if (isMentorTransfer && pendingAction) {
          const targetUser = users.find((u) => u.id === pendingAction.targetUserId);
          setReceiptData({
            referenceId: `APN-TX-${Math.floor(100000 + Math.random() * 900000)}`,
            recipientName: targetUser?.fullName || targetUser?.name || "User / Mentor",
            recipientEmail: targetUser?.email || "N/A",
            amount: pendingAction.amount || 0,
            date: new Date().toLocaleString(),
            status: "SUCCESSFUL (CONFIRMED)",
          });
        }

        setMasterPin("");
        setPendingAction(null);
        setEditingUser(null);
        setSelectedUserIds([]);
        setTransferAmount("");
        setTransferTargetId("");

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
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-xl animate-bounce">
          <span>{toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}</span>
          <span className="text-xs font-semibold text-white">{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-900/40 border border-amber-500/30 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/40">
            ⚡ APN FOUNDER COMMAND CENTER
          </div>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Executive Management Portal</h1>
          <p className="text-slate-400 text-xs mt-1">
            Alpha Proficiency Network • Mainnet Vault, Node Governance & Token Control
          </p>
        </div>
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-right">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Primary Founder</span>
          <span className="text-amber-400 font-bold text-sm font-mono">{admin.email}</span>
        </div>
      </div>

      {/* TOKENOMICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-900/20 border border-amber-500/40 shadow-2xl col-span-1 md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/40">
                💎 Founder & Team Reserve Vault (25%)
              </div>
              <h2 className="text-2xl font-black text-white mt-3 font-mono">
                {TOTAL_FOUNDER_RESERVE.toLocaleString()} <span className="text-amber-400 text-lg">APN</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1">Reserved for Core Development, Mentors, and Strategic Airdrops.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Total Transferred</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">
                {totalDistributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APN
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-between items-center text-xs">
            <span className="text-slate-300">Remaining Vault Reserve:</span>
            <span className="font-mono font-bold text-amber-300">
              {availableReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APN
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Global Max Supply</span>
            <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
              {(TOTAL_MAX_SUPPLY / 1000000000).toFixed(1)}B <span className="text-sm font-normal text-slate-400">APN</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Hard-capped max supply. 75% allocated to Public Mining.</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Total Registered Users:</span>
            <span className="text-white font-mono font-bold">{totalUsersCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* DIRECT TOKEN TRANSFER & AIRDROP PANEL */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
              🚀 Direct Founder Vault Allocation (Send Tokens / Mentor Airdrop)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Transfer $APN tokens directly and generate verified receipts.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            Vault Balance: {availableReserve.toLocaleString()} APN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block">Select Recipient / Mentor:</label>
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
            >
              <option value="">-- Choose User / Mentor --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.name || "User"} ({u.email}) - {Number(u.miningSpeed || 0.5).toFixed(2)}x
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block">Amount ($APN):</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono"
            />
          </div>

          <button
            onClick={() => {
              if (selectedUserIds.length === 0 && (!transferTargetId || !transferAmount)) {
                return alert("Please choose a target user/selected items and enter an amount!");
              }
              triggerAction({
                action: selectedUserIds.length > 0 ? "BULK_AIRDROP" : "TRANSFER_MENTOR_TOKENS",
                targetUserId: transferTargetId || undefined,
                targetUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
                amount: Number(transferAmount),
              });
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-amber-500/20 text-sm"
          >
            {selectedUserIds.length > 0
              ? `🎁 Bulk Airdrop ${transferAmount || 0} APN to (${selectedUserIds.length})`
              : "Transfer & Generate Receipt 🧾"}
          </button>
        </div>
      </div>

      {/* CATEGORY TAB FILTERS & USER DATABASE */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white">📋 Registered Users & Network Accounts</h3>
            <p className="text-xs text-slate-400">Filter accounts by state, manage mining speeds, and issue updates.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Search name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500 outline-none w-full md:w-64"
            />
            <span className="text-xs bg-slate-800 px-3 py-2.5 rounded-xl text-slate-300 font-mono border border-slate-700">
              Total: <b>{totalUsersCount}</b>
            </span>
          </div>
        </div>

        {/* CUSTOM CATEGORY FILTER TABS */}
        <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-slate-800 pb-3">
          <button
            onClick={() => handleTabChange("ALL")}
            className={`px-4 py-2.5 rounded-xl transition ${
              activeTab === "ALL"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            👥 All Users ({users.length})
          </button>

          <button
            onClick={() => handleTabChange("VERIFIED")}
            className={`px-4 py-2.5 rounded-xl transition ${
              activeTab === "VERIFIED"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/30"
                : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            ☑️ Verified Users ({users.filter((u) => u.isVerified).length})
          </button>

          <button
            onClick={() => handleTabChange("BOOSTED")}
            className={`px-4 py-2.5 rounded-xl transition ${
              activeTab === "BOOSTED"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/30"
                : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            ⚡ Boosted Users ({users.filter((u) => u.isBoosting || Number(u.miningSpeed || 0.5) > 0.5).length})
          </button>

          <button
            onClick={() => handleTabChange("SUSPENDED")}
            className={`px-4 py-2.5 rounded-xl transition ${
              activeTab === "SUSPENDED"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/30"
                : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            🚫 Suspended ({users.filter((u) => u.isSuspended).length})
          </button>
        </div>

        {/* BULK SELECTION ACTION TOOLBAR */}
        {selectedUserIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs font-bold text-amber-400">
              🎯 Selected ({selectedUserIds.length}) Accounts in current view
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  triggerAction({
                    action: "BULK_APPLY_BOOST",
                    targetUserIds: selectedUserIds,
                    boostMultiplier: 3.0,
                  })
                }
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
              >
                ⚡ Boost 3.0x Speed
              </button>

              <button
                onClick={() =>
                  triggerAction({
                    action: "BULK_APPLY_BOOST",
                    targetUserIds: selectedUserIds,
                    boostMultiplier: 5.5,
                  })
                }
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow"
              >
                🔥 Boost 5.5x Speed
              </button>

              <button
                onClick={() =>
                  triggerAction({
                    action: "BULK_VERIFY",
                    targetUserIds: selectedUserIds,
                    status: true,
                  })
                }
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow"
              >
                ✅ Verify Selected
              </button>

              <button
                onClick={() =>
                  triggerAction({
                    action: "BULK_TOGGLE_WITHDRAW",
                    targetUserIds: selectedUserIds,
                    status: false,
                  })
                }
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow"
              >
                🚫 Restrict Withdrawal
              </button>
            </div>
          </div>
        )}

        {/* USERS TABLE */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading database records...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                      className="rounded accent-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Mining Speed</th>
                  <th className="p-3">KYC Verified</th>
                  <th className="p-3">Withdrawal</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No records match the active tab filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const currentSpeed = Number(u.miningSpeed || 0.5);
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleSelectUser(u.id)}
                            className="rounded accent-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.fullName || u.name || "Anonymous"}
                            {u.isVerified && <span className="text-blue-400 text-sm">☑️</span>}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-md font-mono font-bold text-[11px] ${
                              currentSpeed >= 5.0
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : currentSpeed > 0.5
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            ⚡ {currentSpeed.toFixed(2)}x / hr
                          </span>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() =>
                              triggerAction({
                                action: "TOGGLE_VERIFY",
                                targetUserId: u.id,
                                status: !u.isVerified,
                              })
                            }
                            className={`px-2 py-1 rounded-md font-bold text-[10px] transition ${
                              u.isVerified
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-600/20"
                            }`}
                          >
                            {u.isVerified ? "☑️ Verified" : "⏳ Approve KYC"}
                          </button>
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() =>
                              triggerAction({
                                action: "TOGGLE_WITHDRAW",
                                targetUserId: u.id,
                                status: !(u.canWithdraw ?? true),
                              })
                            }
                            className={`px-2 py-1 rounded-md font-bold text-[10px] transition ${
                              (u.canWithdraw ?? true)
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {(u.canWithdraw ?? true) ? "🟢 Allowed" : "🔴 Blocked"}
                          </button>
                        </td>

                        <td className="p-3 font-mono font-semibold text-amber-300">
                          {Number(u.balance || 0).toLocaleString()} APN
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-md font-bold text-[10px] ${
                              u.isSuspended
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {u.isSuspended ? "🚫 Suspended" : "✅ Active"}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() =>
                                triggerAction({
                                  action: "TOGGLE_BOOST",
                                  userId: u.id,
                                  boostSpeed: 3.0,
                                })
                              }
                              className={`px-2 py-1 rounded text-xs font-bold transition ${
                                Number(u.miningSpeed) === 3.0
                                  ? "bg-amber-500 text-slate-950 font-extrabold"
                                  : "bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                            >
                              ⚡ 3.0x
                            </button>

                            <button
                              onClick={() =>
                                triggerAction({
                                  action: "TOGGLE_BOOST",
                                  userId: u.id,
                                  boostSpeed: 5.5,
                                })
                              }
                              className={`px-2 py-1 rounded text-xs font-bold transition ${
                                Number(u.miningSpeed) === 5.5
                                  ? "bg-emerald-500 text-slate-950 font-extrabold"
                                  : "bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              }`}
                            >
                              ⚡ 5.5x
                            </button>

                            {(u.isBoosting || Number(u.miningSpeed) > 0.5) && (
                              <button
                                onClick={() =>
                                  triggerAction({
                                    action: "TOGGLE_BOOST",
                                    userId: u.id,
                                    boostSpeed: 0.5,
                                  })
                                }
                                className="px-1.5 py-1 text-xs text-red-400 hover:text-red-300 underline"
                              >
                                Reset
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditName(u.fullName || u.name || "");
                                setEditEmail(u.email || "");
                                setEditBalance(String(u.balance || 0));
                                setEditSpeed(String(u.miningSpeed || 0.5));
                                setEditRole(u.role || "USER");
                                setEditIsVerified(u.isVerified || false);
                                setEditCanWithdraw(u.canWithdraw ?? true);
                              }}
                              className="px-2.5 py-1 bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 rounded-lg border border-amber-500/30 font-bold"
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onClick={() =>
                                triggerAction({
                                  action: "TOGGLE_SUSPEND",
                                  targetUserId: u.id,
                                  status: !u.isSuspended,
                                })
                              }
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
          <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 rounded-xl font-bold transition"
              >
                ◀ Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-black hover:bg-amber-400 disabled:opacity-40 rounded-xl transition"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-amber-400">✏️ Edit KYC & User Profile</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email Address:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">$APN Balance:</label>
                  <input
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mining Speed (x):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSpeed}
                    onChange={(e) => setEditSpeed(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">User Role:</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
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
                  Allow User Withdrawal (canWithdraw)
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  triggerAction({
                    action: "UPDATE_USER",
                    targetUserId: editingUser.id,
                    name: editName,
                    email: editEmail,
                    balance: editBalance,
                    miningSpeed: editSpeed,
                    role: editRole,
                    isVerified: editIsVerified,
                    canWithdraw: editCanWithdraw,
                  })
                }
                className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20"
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
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <h3 className="text-lg font-black text-amber-400">Security PIN Required</h3>
            <p className="text-xs text-slate-400">Enter your Founder Master Security PIN to confirm action.</p>
            <input
              type="password"
              placeholder="Enter Master PIN"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-center text-white text-xl tracking-widest outline-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setMasterPin("");
                }}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeActionWithPin}
                className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20"
              >
                Confirm 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-500/50 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative text-white font-sans">
            <div className="text-center border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                ⚡ Alpha Proficiency Network
              </div>
              <h2 className="text-xl font-black text-white">Transfer Receipt</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Founder Treasury Allocation</p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-center">
              <span className="text-xs text-emerald-400 font-bold uppercase block">
                Transferred Amount
              </span>
              <div className="text-3xl font-black text-emerald-300 font-mono mt-1">
                +{Number(receiptData.amount).toLocaleString()} <span className="text-lg font-bold text-emerald-400">$APN</span>
              </div>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                {receiptData.status}
              </span>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Ref ID:</span>
                <span className="text-white font-bold">{receiptData.referenceId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Recipient Name:</span>
                <span className="text-amber-300 font-bold">{receiptData.recipientName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Recipient Email:</span>
                <span className="text-blue-400 font-bold">{receiptData.recipientEmail}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Source Vault:</span>
                <span className="text-amber-400 font-bold">Founder Treasury (25%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-slate-300 text-[10px]">{receiptData.date}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition"
              >
                🖨️ Print / Save PDF
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/40 transition"
              >
                Done 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
