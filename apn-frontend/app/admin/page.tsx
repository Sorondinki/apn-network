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

  // Helper for Custom Toast Notifications
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);

      // FOUNDER ACCESS CHECK: Allow by Email (contact.aprotech@gmail.com) OR Role (FOUNDER / ADMIN)
      const isFounderEmail = userData.email?.toLowerCase() === "contact.aprotech@gmail.com";
      const hasAdminRole = userData.role === "FOUNDER" || userData.role === "ADMIN";

      if (!isFounderEmail && !hasAdminRole) {
        showToast("Access Denied: You do not have permission to access the Founder Console.", "error");
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

  // Fetch Users
  const fetchUsers = async (adminId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FETCH_USERS",
          adminId: adminId,
          masterPin: "APN-FOUNDER-2026#SECURE", // Server Master Key Sync
        }),
      });
      const data = await res.json();
      if (data.success) {
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

  // Trigger Master PIN Prompt
  const triggerAction = (actionData: any) => {
    setPendingAction(actionData);
    setShowPinModal(true);
  };

  // Execute Action upon PIN Verification
  const executeActionWithPin = async () => {
    if (!masterPin) {
      showToast("Please enter your Master Security PIN!", "error");
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

        // Clear forms
        setTaskTitle("");
        setTaskDesc("");
        setTaskReward("");
        setTaskLink("");
        setTransferAmount("");

        fetchUsers(admin?.id || "founder-root");
      } else {
        showToast(data.error || "Execution failed. Invalid Security PIN.", "error");
      }
    } catch (e) {
      showToast("Network connection error. Please try again.", "error");
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans relative">
      
      {/* CUSTOM TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-xl animate-bounce">
          <span className="text-lg">
            {toast.type === "success" && "✅"}
            {toast.type === "error" && "⚠️"}
            {toast.type === "info" && "ℹ️"}
          </span>
          <span className="text-xs font-semibold text-white tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-purple-900/40 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/40">
            🛡️ APN Network Security & Founder Console
          </div>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Founder Executive Portal</h1>
          <p className="text-gray-400 text-xs mt-1">Manage users, distribute native tokens, publish tasks, and oversee network security.</p>
        </div>
        <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 text-right">
          <span className="text-[10px] text-gray-400 font-bold block uppercase">Primary Admin</span>
          <span className="text-emerald-400 font-bold text-sm font-mono">{admin.email}</span>
        </div>
      </div>

      {/* ACTION GRID: TASKS & TOKEN TRANSFER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FORM 1: POST A NEW TASK */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            📢 Post New Network Task
          </h3>
          <div className="space-y-3 text-xs">
            <input
              type="text"
              placeholder="Task Title (e.g., Follow APN Twitter)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
            />
            <textarea
              placeholder="Task Description"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none h-20"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Reward Amount (APN)"
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
                <option value="WEBSITE">Website</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Task Link URL (e.g. https://x.com/...)"
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
              🚀 Publish to Tasks Page
            </button>
          </div>
        </div>

        {/* FORM 2: DIRECT TOKEN DISTRIBUTION */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-gray-800 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
            💎 Direct Token Distribution (Founder Vault)
          </h3>
          <p className="text-xs text-gray-400">Transfer native APN tokens directly to members or buyers for staking.</p>
          <div className="space-y-3 text-xs">
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            >
              <option value="">-- Select Recipient User --</option>
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
              💸 Transfer APN Tokens Now
            </button>
          </div>
        </div>

      </div>

      {/* TABLE SECTION: USER MANAGEMENT & ANTI-FRAUD CONTROL */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-gray-800 backdrop-blur-md space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-white">📋 Registered Network Users</h3>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-gray-300 font-mono">
            Total Accounts: <b>{users.length}</b>
          </span>
        </div>

        {loading ? (
          <p className="text-gray-400 text-xs animate-pulse p-4">Loading user database records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono">
                  <th className="p-3">User / Email</th>
                  <th className="p-3">Wallet Balance</th>
                  <th className="p-3">Referrals</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-center">Executive Actions</th>
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
                      👥 {u.referralCount || 0}
                    </td>
                    <td className="p-3">
                      {u.isSuspended ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md font-bold">
                          🚫 Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-bold">
                          ✅ Active
                        </span>
                      )}
                    </td>
                    <td className="p-3 flex items-center justify-center gap-2">
                      
                      {/* EDIT KYC BUTTON */}
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditName(u.fullName || "");
                          setEditEmail(u.email);
                        }}
                        className="px-2.5 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 rounded-lg border border-amber-500/30 transition"
                      >
                        ✏️ Edit KYC
                      </button>

                      {/* SUSPEND / UNSUSPEND BUTTON */}
                      <button
                        onClick={() => triggerAction({
                          action: "TOGGLE_SUSPEND",
                          targetUserId: u.id,
                          status: !u.isSuspended,
                        })}
                        className={`px-2.5 py-1 rounded-lg border transition font-medium ${
                          u.isSuspended
                            ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                            : "bg-orange-600/20 text-orange-400 border-orange-500/30"
                        }`}
                      >
                        {u.isSuspended ? "Unsuspend" : "Suspend"}
                      </button>

                      {/* DELETE USER BUTTON */}
                      <button
                        onClick={() => triggerAction({
                          action: "DELETE_USER",
                          targetUserId: u.id,
                        })}
                        className="px-2.5 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg border border-red-500/30 transition"
                      >
                        🗑️ Delete
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-gray-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Update User KYC Profile</h3>
            <div className="space-y-3 text-xs">
              <label className="text-gray-400 block">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white"
              />
              <label className="text-gray-400 block">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => triggerAction({
                  action: "UPDATE_USER",
                  targetUserId: editingUser.id,
                  fullName: editName,
                  email: editEmail,
                })}
                className="px-4 py-2 bg-emerald-600 font-bold text-white rounded-xl text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER SECURITY PIN VERIFICATION MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-500/40 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl">
              🔐
            </div>
            <h3 className="text-lg font-black text-white">Master PIN Authentication</h3>
            <p className="text-xs text-gray-400">
              Enter your Founder Master Security PIN to execute this high-privilege network command.
            </p>
            <input
              type="password"
              placeholder="Enter Master PIN"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              className="w-full bg-black/80 border border-red-500/50 rounded-xl p-3 text-center text-white text-sm tracking-widest focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setMasterPin("");
                }}
                className="w-1/2 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeActionWithPin}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/50"
              >
                Confirm Action 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}