// app/referral/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferralPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [codeChanged, setCodeChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalInvited: 0,
    commissionsEarned: "0.00",
    tier: "Level 1 Miner",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);

    // Generate or fetch referral code
    let refCode = userData.referralCode;
    if (!refCode) {
      // Extract prefix from email e.g. sorondinkiseeme@gmail.com -> sorondinkiseeme
      const emailPrefix = userData.email
        ? userData.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")
        : `APN${Math.floor(1000 + Math.random() * 9000)}`;
      refCode = emailPrefix;
    }

    setReferralCode(refCode);
    setCustomCodeInput(refCode);
    setCodeChanged(userData.hasChangedRefCode || false);

    // Fetch live referral stats from server
    async function fetchReferralStats() {
      try {
        const res = await fetch(`/referrals?userId=${userData.id}`);
        const data = await res.json();
        if (data.success) {
          setStats({
            totalInvited: data.totalInvited || 0,
            commissionsEarned: data.commissionsEarned || "0.00",
            tier: data.tier || "Level 1 Miner",
          });
        }
      } catch (err) {
        console.error("Error fetching referral stats:", err);
      }
    }

    if (userData.id) fetchReferralStats();
  }, [router]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://apn.network";
  const referralLink = `${origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Alpha Proficiency Network (APN)",
          text: "Start mining native APN tokens on the next-gen Layer-1 Web3 network!",
          url: referralLink,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  const handleSaveCustomCode = async () => {
    if (!customCodeInput.trim() || customCodeInput.length < 3) {
      alert("Referral code must be at least 3 characters long.");
      return;
    }

    const cleanCode = customCodeInput.trim().replace(/\s+/g, "");

    setSaving(true);
    try {
      const res = await fetch("/api/user/update-ref-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newReferralCode: cleanCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReferralCode(cleanCode);
        setCodeChanged(true);
        setIsEditing(false);

        // Update local session
        const updatedUser = {
          ...user,
          referralCode: cleanCode,
          hasChangedRefCode: true,
        };
        localStorage.setItem("apn_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Referral code updated successfully! You cannot change it again.");
      } else {
        alert(data.message || "Failed to update referral code.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error updating referral code.");
    } finally {
      setSaving(false);
    }
  };

  const shareMessage = encodeURIComponent(
    `Join me on APN Network! Mine native Web3 APN tokens daily. Register here: ${referralLink}`
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            🎁 APN Ecosystem Growth
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            APN Referral Program
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Invite your peers to the APN Mainnet ecosystem and earn up to 10% lifetime hash rate commissions.
          </p>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Invited
          </span>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono">
            {stats.totalInvited} <span className="text-sm font-normal text-gray-400">Users</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Commissions Earned
          </span>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {stats.commissionsEarned} <span className="text-sm font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Bonus Tier
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            {stats.tier}
          </p>
        </div>
      </div>

      {/* REFERRAL LINK & CUSTOMIZATION CARD */}
      <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Your Exclusive Referral Link</h3>
            <p className="text-xs text-gray-400 mt-1">
              Share this link to claim rewards whenever a new validator signs up.
            </p>
          </div>

          {/* CODE EDIT BUTTON */}
          {!codeChanged && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold rounded-xl transition-all"
            >
              ✏️ Customize Code (Once Only)
            </button>
          )}

          {codeChanged && (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg">
              ✓ Custom Code Locked
            </span>
          )}
        </div>

        {/* CUSTOM CODE EDIT FORM */}
        {isEditing && (
          <div className="p-4 bg-black/50 border border-amber-500/30 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-amber-400">
              Set Your Custom Referral Code (e.g. Sorondinki):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                placeholder="Enter unique code"
                className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSaveCustomCode}
                disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all"
              >
                {saving ? "Saving..." : "Save Code"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-800 text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              ⚠️ Note: You can only customize your referral code once. Make sure it is unique!
            </p>
          </div>
        )}

        {/* LINK COPY & NATIVE SHARE INPUT */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 p-4 bg-black/60 border border-gray-800 rounded-2xl text-emerald-400 font-mono text-xs sm:text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30"
            >
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <button
              onClick={handleNativeShare}
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              🚀 Share
            </button>
          </div>
        </div>

        {/* DIRECT SOCIAL MEDIA QUICK-SHARE BUTTONS */}
        <div className="pt-4 border-t border-gray-800/80 space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
            Direct Share To Social Networks
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=${shareMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>💬</span> WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20APN%20Network`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 rounded-xl text-sky-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>✈️</span> Telegram
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>𝕏</span> Twitter / X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-xl text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>📘</span> Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}