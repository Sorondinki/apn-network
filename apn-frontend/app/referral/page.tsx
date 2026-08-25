"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for client-side rendering only
const AadsBanner = dynamic(() => import("../components/AadsBanner"), {
  ssr: false,
});

export default function ReferralPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [codeChanged, setCodeChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Referral List & Search State
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

    let refCode = userData.referralCode || userData.referral_code;
    if (!refCode) {
      const emailPrefix = userData.email
        ? userData.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")
        : `APN${Math.floor(1000 + Math.random() * 9000)}`;
      refCode = emailPrefix;
    }

    setReferralCode(refCode);
    setCustomCodeInput(refCode);
    setCodeChanged(userData.hasChangedRefCode || false);

    if (userData.id) {
      fetchReferralStats(userData.id);
    }
  }, [router]);

  async function fetchReferralStats(userId: string) {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/user/referrals?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          totalInvited: data.totalInvited || 0,
          commissionsEarned: data.commissionsEarned || "0.00",
          tier: data.tier || "Level 1 Miner",
        });
        setReferralsList(data.referrals || []);
      }
    } catch (err) {
      console.error("Error fetching referral stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }

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

  const shareMessage = encodeURIComponent(
    `Join me on APN Network! Mine native Web3 APN tokens daily. Register here: ${referralLink}`
  );

  const filteredReferrals = referralsList.filter((ref) =>
    (ref.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ref.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-purple-950/60 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            🎁 APN Ecosystem Referral Hub
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Invite & Earn APN Rewards
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Expand the APN Layer-1 validator network. Earn <b className="text-emerald-400">5.0 APN</b> bonus per referral plus lifetime mining speed multipliers.
          </p>
        </div>
        <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 text-right w-full md:w-auto">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Your Mining Tier</span>
          <span className="text-emerald-400 font-extrabold text-sm font-mono">{stats.tier}</span>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Invites
          </span>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono">
            {stats.totalInvited} <span className="text-sm font-normal text-gray-400">Miners</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Commission Earned
          </span>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {stats.commissionsEarned} <span className="text-sm font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Network Hash Boost
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            +{stats.totalInvited * 2.5}% <span className="text-sm font-normal text-gray-400">Speed</span>
          </p>
        </div>
      </div>

      {/* 💰 AADS ADVERTISING BANNER*/}
      <AadsBanner/>

      {/* APN INTERNAL ECOSYSTEM BANNER */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-emerald-900/40 border border-purple-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1 text-center md:text-left">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
              ⚡ APN Mainnet Staking Feature
            </span>
            <h3 className="text-lg font-bold text-white">Boost Your Daily Token Rewards by 300%!</h3>
            <p className="text-xs text-gray-300 max-w-lg">
              Encourage your downline miners to stay active daily and verify their accounts to unlock high-yield validator node rewards.
            </p>
          </div>
          <button
            onClick={handleNativeShare}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/50 whitespace-nowrap"
          >
            🔥 Invite Now & Mine Faster
          </button>
        </div>
      </div>

      {/* REFERRAL LINK CARD & REFERRED USERS LIST */}
      <div className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md space-y-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white">Your Unique Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 p-4 bg-black/80 border border-gray-800 rounded-2xl text-emerald-400 font-mono text-xs sm:text-sm focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all text-xs"
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
        </div>
      </div>

      {/* SECONDARY AADS BANNER AT THE BOTTOM */}
      <AadsBanner/>
    </div>
  );
}