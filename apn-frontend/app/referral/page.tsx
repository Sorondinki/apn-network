"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AadsBanner = dynamic(() => import("../components/AadsBanner"), {
  ssr: false,
});

export default function ReferralPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);

  // Referral List, Search & Filter State
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "IDLE">("ALL");

  const [stats, setStats] = useState({
    totalInvited: 0,
    activeMinersCount: 0,
    idleMinersCount: 0,
    commissionsEarned: "0.00",
    tier: "Level 1 Miner",
    level: 1,
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

    if (userData.id) {
      fetchReferralStats(userData.id);
    }
  }, [router]);

  async function fetchReferralStats(userId: string) {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/user/referrals?userId=${userId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStats({
          totalInvited: data.totalInvited || 0,
          activeMinersCount: data.activeMinersCount || 0,
          idleMinersCount: data.idleMinersCount || 0,
          commissionsEarned: data.commissionsEarned || "0.00",
          tier: data.tier || "Level 1 Miner",
          level: data.level || 1,
        });
        setReferralsList(data.referrals || []);
      }
    } catch (err) {
      console.error("Error fetching referral stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.apnprotocol.ng";
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
          text: `Use my invite code "${referralCode}" to claim 5.0 APN bonus and start 24h Web3 cloud mining on APN Network!`,
          url: referralLink,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  // WhatsApp Reminder
  const triggerWhatsAppReminder = (refUser: any) => {
    const minerName = refUser.fullName || refUser.name || "Miner";
    const text = encodeURIComponent(
      `Hello ${minerName}! Your APN Network Node is currently IDLE. Open the APN app now and click "Start Mining Session" so you don't miss out on your block rewards: ${origin}/dashboard`
    );

    let phone = refUser.phone ? String(refUser.phone).replace(/[^0-9]/g, "") : "";
    if (phone.startsWith("0")) {
      phone = "234" + phone.slice(1);
    }

    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Direct Text SMS Reminder
  const triggerSmsReminder = (refUser: any) => {
    if (!refUser.phone) {
      alert("This user has not registered a phone number in their profile.");
      return;
    }
    const minerName = refUser.fullName || refUser.name || "Miner";
    const body = encodeURIComponent(
      `Hello ${minerName}, restart your mining session on APN Network to keep receiving native tokens: ${origin}/dashboard`
    );
    window.open(`sms:${refUser.phone}?body=${body}`, "_blank");
  };

  // Filter and Search
  const filteredReferrals = useMemo(() => {
    return referralsList.filter((ref) => {
      const name = (ref.fullName || ref.name || "").toLowerCase();
      const email = (ref.email || "").toLowerCase();
      const phone = (ref.phone || "").toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch = name.includes(q) || email.includes(q) || phone.includes(q);
      if (!matchesSearch) return false;

      if (filterStatus === "ACTIVE") return ref.isMining === true;
      if (filterStatus === "IDLE") return !ref.isMining;
      return true;
    });
  }, [referralsList, searchTerm, filterStatus]);

  const progressPercent = ((stats.totalInvited % 10) / 10) * 100;

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto px-3 sm:px-6 pb-16 font-sans overflow-x-hidden text-gray-100">
      
      {/* HEADER HERO CARD */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-purple-950/80 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            🎁 APN Ecosystem Guild & Referral Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Invite, Lead & Earn APN
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
            Invite colleagues and friends to join APN Layer-1. Earn <span className="text-emerald-400 font-bold">5.0 APN</span> per verified recruit, plus unlock a permanent <span className="text-blue-400 font-bold">+2.5% hashrate boost</span> per node!
          </p>
        </div>
        
        {/* RANK STATUS & PROGRESS */}
        <div className="bg-black/60 p-5 rounded-2xl border border-emerald-500/30 w-full md:w-80 shadow-xl space-y-3 z-10">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rank Status</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Level {stats.level}</span>
          </div>
          <span className="text-emerald-400 font-extrabold text-base font-mono block truncate">{stats.tier}</span>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-400 font-medium">
              <span>Next Level Progress</span>
              <span className="text-amber-400">{stats.totalInvited % 10}/10 Miners</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* METRICS STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Total Invites
          </span>
          <p className="text-xl sm:text-3xl font-black text-blue-400 mt-2 font-mono">
            {stats.totalInvited} <span className="text-xs font-normal text-gray-500">Miners</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Active Hashers
          </span>
          <p className="text-xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono flex items-center gap-1.5">
            {stats.activeMinersCount}
            <span className="text-[10px] text-emerald-500 font-normal">({stats.idleMinersCount} Idle)</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Earned Bonus
          </span>
          <p className="text-xl sm:text-3xl font-black text-amber-400 mt-2 font-mono truncate">
            {stats.commissionsEarned} <span className="text-xs font-normal text-gray-500">APN</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Team Speed Boost
          </span>
          <p className="text-xl sm:text-3xl font-black text-purple-400 mt-2 font-mono">
            +{(stats.totalInvited * 2.5).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* PROMO ADS BANNER */}
      <div className="w-full overflow-hidden rounded-2xl border border-gray-800/80">
        <AadsBanner />
      </div>

      {/* REFERRAL LINK & CODE CONTAINER */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-md space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            🔗 Your Referral Code: <span className="text-emerald-400 font-mono">{referralCode}</span>
          </h3>
          <span className="text-xs text-gray-400">Share your invite link below</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full flex-1 p-3.5 bg-black/70 border border-gray-800 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none select-all"
          />
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={handleNativeShare}
              className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
            >
              🚀 Share
            </button>
          </div>
        </div>
      </div>

      {/* DOWNLINE TEAM LISTING */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-md space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👥 Your Network Downline</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                {referralsList.length} Total
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor your team's live mining activity and dispatch instant alerts to idle miners.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Filter Buttons */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === "ALL" ? "bg-gray-800 text-white" : "text-gray-400"
                }`}
              >
                All ({referralsList.length})
              </button>
              <button
                onClick={() => setFilterStatus("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === "ACTIVE" ? "bg-emerald-600 text-white" : "text-gray-400"
                }`}
              >
                Active ({stats.activeMinersCount})
              </button>
              <button
                onClick={() => setFilterStatus("IDLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === "IDLE" ? "bg-amber-600 text-white" : "text-gray-400"
                }`}
              >
                Idle ({stats.idleMinersCount})
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 min-w-[200px]"
            />
          </div>
        </div>

        {loadingStats ? (
          <div className="text-center py-12 text-gray-400 text-xs animate-pulse">
            Fetching downline network telemetry...
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-12 bg-black/30 rounded-2xl border border-gray-800/50">
            <p className="text-gray-400 text-xs">No referrals found matching your query or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-left text-xs text-gray-300 min-w-[580px]">
              <thead className="bg-black/60 text-gray-400 uppercase font-bold border-b border-gray-800 text-[11px]">
                <tr>
                  <th className="p-3.5">Miner</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5">Balance (APN)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredReferrals.map((ref) => {
                  const isActiveMining = ref.isMining === true;
                  const displayName = ref.fullName || ref.name || "APN Miner";
                  return (
                    <tr key={ref.id} className="hover:bg-gray-800/30 transition">
                      <td className="p-3.5 font-medium text-white">
                        <p className="font-bold text-xs truncate max-w-[150px]">{displayName}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">{ref.email || ref.phone || "No contact"}</p>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400 text-[11px]">
                        {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {parseFloat(ref.balance || "0").toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        {isActiveMining ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            MINING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-bold">
                            IDLE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* WhatsApp Reminder */}
                          <button
                            onClick={() => triggerWhatsAppReminder(ref)}
                            title="Send WhatsApp Reminder"
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <span>💬 WhatsApp</span>
                          </button>

                          {/* Direct SMS Reminder */}
                          {ref.phone && (
                            <button
                              onClick={() => triggerSmsReminder(ref)}
                              title="Send Direct SMS"
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <span>📱 SMS</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER BANNER */}
      <div className="w-full overflow-hidden rounded-2xl border border-gray-800/80">
        <AadsBanner />
      </div>
    </div>
  );
}
    
