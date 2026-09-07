"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AUTHORIZED_ENGINEERS = [
  "contact.aprotech@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com",
];

export default function RoleManagerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("VALIDATOR");
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  // In-page Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("apn_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        const email = parsed.email ? parsed.email.trim().toLowerCase() : "";
        if (!AUTHORIZED_ENGINEERS.includes(email)) {
          router.push("/dashboard");
        }
      } catch (e) {
        router.push("/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;

    setSearching(true);
    setSearchedUser(null);
    try {
      const { data, error } = await supabase
        .from("User")
        .select("id, email, fullName, role, isVerified, balance, createdAt")
        .ilike("email", searchEmail.trim())
        .maybeSingle();

      if (error || !data) {
        showToast("error", "No user found with this email address.");
      } else {
        setSearchedUser(data);
        setSelectedRole(data.role || "USER");
      }
    } catch (err: any) {
      showToast("error", "Error searching for user.");
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!searchedUser) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/admin/change-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: searchedUser.email,
          newRole: selectedRole,
          adminEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setSearchedUser((prev: any) => ({ ...prev, role: selectedRole }));
      } else {
        showToast("error", data.message || "Failed to update role.");
      }
    } catch (err) {
      showToast("error", "Network connection error.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans relative">
      {/* GLOBAL TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all text-xs sm:text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
              : "bg-rose-950/90 border-rose-500 text-rose-300"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f19] border border-gray-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
            Executive Permission Hub
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">APN Rank & Role Dispatcher</h1>
        <p className="text-xs text-gray-400">
          Assign special ecosystem titles (Validator, Ambassador, Manager) to promote dedicated community members.
        </p>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800/80 space-y-4">
        <label className="text-xs font-bold text-gray-300 block uppercase font-mono">
          Find User By Registered Email
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="e.g. member@apnprotocol.ng"
            required
            className="flex-1 bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-950/50 disabled:opacity-50"
          >
            {searching ? "Searching..." : "🔍 Search User"}
          </button>
        </div>
      </form>

      {/* USER CARD & ROLE SELECTOR */}
      {searchedUser && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0b0f19] border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-gray-500">Target Member</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {searchedUser.fullName || "APN Member"}
                {searchedUser.isVerified && <span className="text-blue-400 text-xs">✓ Verified</span>}
              </h3>
              <p className="text-xs text-emerald-400 font-mono">{searchedUser.email}</p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
              Current: {searchedUser.role || "USER"}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 block uppercase font-mono">
              Assign New Official Network Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "APN User", value: "USER", color: "border-blue-500 text-blue-400" },
                { label: "APN Validator", value: "VALIDATOR", color: "border-emerald-500 text-emerald-400" },
                { label: "Ambassador", value: "AMBASSADOR", color: "border-purple-500 text-purple-400" },
                { label: "Regional Manager", value: "MANAGER", color: "border-indigo-500 text-indigo-400" },
              ].map((r) => (
                <div
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`p-4 rounded-xl cursor-pointer border text-center transition ${
                    selectedRole === r.value
                      ? `bg-gray-900 ${r.color} ring-2 ring-purple-500/40`
                      : "bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <p className="text-xs font-bold">{r.label}</p>
                  <span className="text-[9px] font-mono uppercase opacity-70 mt-1 block">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpdateRole}
            disabled={updating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-purple-950/50 disabled:opacity-50"
          >
            {updating ? "Deploying Role Permission..." : `Confirm & Upgrade Role to ${selectedRole} 🚀`}
          </button>
        </div>
      )}
    </div>
  );
 }
        
