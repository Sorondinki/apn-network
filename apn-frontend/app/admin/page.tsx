// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FounderAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form States
  const [masterPin, setMasterPin] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Token Transfer State
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // New Task State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskReward, setTaskReward] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [taskCategory, setTaskCategory] = useState("TWITTER");

  // Social Announcement State
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("ALL");

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      const isFounderEmail = userData.email?.toLowerCase() === "contact.aprotech@gmail.com";
      const hasAdminRole = userData.role === "FOUNDER" || userData.role === "ADMIN";

      if (!isFounderEmail && !hasAdminRole) {
        showToast("Access Denied: Founder/Admin credentials required.", "error");
        setTimeout(() => router.push("/dashboard"), 1500);
        return;
      }

      setAdmin(userData);
      fetchUsers(userData.id || "founder-root");
    } catch (err) {
      console.error("Failed to parse user data", err);
      router.push("/login");
    }
  }, [router]);

  // Fetch Users Function Fix
  const fetchUsers = async (adminId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FETCH_USERS",
          adminId: adminId,
        }),
      });
      const data = await res.json();
      if (data.success || Array.isArray(data.users)) {
        setUsers(data.users || []);
      } else {
        showToast(data.error || "Failed to load user records.", "error");
      }
    } catch (e) {
      showToast("Network error fetching user database.", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerAction = (actionData: any) => {
    setPendingAction(actionData);
    setShowPinModal(true);
  };

  const executeActionWithPin = async () => {
    if (!masterPin) {
      showToast("Please enter Master Security PIN!", "error");
      return;
    }

    try {
      const payload = {
        ...pendingAction,
        adminId: admin?.id || "founder-root",
        masterPin: masterPin,
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Action executed successfully! 🚀", "success");
        setShowPinModal(false);
        setMasterPin("");
        setPendingAction(null);
        setEditingUser(null);

        // Reset forms
        setTaskTitle(""); setTaskDesc(""); setTaskReward(""); setTaskLink("");
        setPostTitle(""); setPostContent(""); setPostMediaUrl("");
        setTransferAmount("");

        fetchUsers(admin?.id || "founder-root");
      } else {
        showToast(data.error || "Execution failed. Check Master PIN.", "error");
      }
    } catch (e) {
      showToast("Network connection error.", "error");
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans relative">
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
          <p className="text-gray-400 text-xs mt-1">Manage network users, broadcast announcements, and distribute tokens.</p>
        </div>
        <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 text-right">
          <span className="text-[10px] text-gray-400 font-bold block uppercase">Primary Admin</span>
          <span className="text-emerald-400 font-bold text-sm font-mono">{admin.email}</span>
        </div>
      </div>

      {/* MAIN ACTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FORM 1: SOCIAL MEDIA ANNOUNCEMENT */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl">
          <h3 className="text-md font-bold text-purple-400 flex items-center gap-2">
            🌐 Social Broadcast Post
          </h3>
          <div className="space-y-3 text-xs">
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
            <button
              onClick={() => triggerAction({
                action: "CREATE_ANNOUNCEMENT",
                title: postTitle,
                content: postContent,
                mediaUrl: postMediaUrl,
                platform: targetPlatform,
              })}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl transition shadow-lg shadow-purple-900/40"
            >
              📢 Broadcast Update
            </button>
          </div>
        </div>

        {/* FORM 2: POST A NEW TASK */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl">
          <h3 className="text-md font-bold text-emerald-400 flex items-center gap-2">
            🚀 Post New Network Task
          </h3>
          <div className="space-y-3 text-xs">
            <input
              type="text"
              placeholder="Task Title (e.g., Retweet APN Post)"
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
              placeholder="Task URL"
              value={taskLink}
              onChange={(e) => setTaskLink(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
            />
            <button
              onClick={() => triggerAction({
                action: "CREATE_TASK",
                title: taskTitle,
                description: taskDesc,
                reward: taskReward,
                link: taskLink,
                category: taskCategory,
              })}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl transition shadow-lg shadow-emerald-900/40"
            >
              ⚡ Publish Task
            </button>
          </div>
        </div>

        {/* FORM 3: DIRECT TOKEN VAULT */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl">
          <h3 className="text-md font-bold text-blue-400 flex items-center gap-2">
            💎 Direct Token Distribution
          </h3>
          <p className="text-xs text-gray-400">Transfer native APN directly to member balances.</p>
          <div className="space-y-3 text-xs">
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            >
              <option value="">-- Select Recipient --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email} ({Number(u.balance || 0).toFixed(2)} APN)
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount in APN"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => triggerAction({
                action: "TRANSFER_TOKENS",
                targetUserId: transferTargetId,
                amount: transferAmount,
              })}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl transition shadow-lg shadow-blue-900/40"
            >
              💸 Transfer APN Tokens
            </button>
          </div>
        </div>

      </div>

      {/* USER DATABASE TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-gray-800 backdrop-blur-md space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-white">📋 Registered Network Users</h3>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-gray-300 font-mono">
            Total Accounts: <b>{users.length}</b>
          </span>
        </div>

        {loading ? (
          <p className="text-gray-400 text-xs animate-pulse p-4">Loading user records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono">
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3">Referrals</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{u.fullName || "Unnamed User"}</div>
                      <div className="text-gray-400 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-emerald-400">
                      {Number(u.balance || 0).toFixed(4)} APN
                    </td>
                    <td className="p-3 font-mono text-purple-400 font-bold">
                      👥 {u.referralCount || u._count?.referrals || 0}
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
                    <td className="p-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditName(u.fullName || "");
                          setEditEmail(u.email);
                        }}
                        className="px-2.5 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 rounded-lg border border-amber-500/30"
                      >
                        ✏️ KYC
                      </button>
                      <button
                        onClick={() => triggerAction({
                          action: "TOGGLE_SUSPEND",
                          targetUserId: u.id,
                          status: !u.isSuspended,
                        })}
                        className="px-2.5 py-1 bg-orange-600/20 text-orange-400 hover:bg-orange-600/40 rounded-lg border border-orange-500/30"
                      >
                        {u.isSuspended ? "Unsuspend" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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