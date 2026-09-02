"use client";

import { useState, useEffect } from "react";
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

  // Referral List & Search State
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    totalInvited: 0,
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
      const res = await fetch(`/api/user/referrals?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          totalInvited: data.totalInvited || 0,
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

  // WhatsApp Reminder
  const triggerMentorReminder = (refUser: any) => {
    const minerName = refUser.fullName || refUser.name || "Aboki";
    const text = encodeURIComponent(
      `Sannu ${minerName}! An gano cewa Node dinka na APN Network bai fara mining ba a yanzu. Shiga manhajar APN ka danna "Start 24h Mining Session" domin kar a barku a baya: ${origin}/dashboard`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const filteredReferrals = referralsList.filter((ref) =>
    (ref.fullName || ref.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ref.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto px-3 sm:px-6 pb-12 font-sans overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-purple-950/80 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-bold">
            🎁 APN Ecosystem Referral & Mentor Hub
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Invite, Lead & Earn APN Rewards
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Expand the APN Layer-1 network. Earn <b className="text-emerald-400">5.0 APN</b> bonus per referral plus higher levels and node speed multipliers.
          </p>
        </div>
        
        <div className="bg-black/60 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-500/30 text-left md:text-right w-full md:w-auto shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Your Mining Rank Status</span>
          <span className="text-emerald-400 font-extrabold text-sm sm:text-base font-mono block mt-0.5">{stats.tier}</span>
          <span className="text-[11px] text-amber-400/90 block font-medium mt-0.5">
            Progress: {stats.totalInvited % 10}/10 Miners to Level {stats.level + 1}
          </span>
        </div>
      </div>

      {/* METRICS OVERVIEW GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Total Invites
          </span>
          <p className="text-xl sm:text-3xl font-black text-blue-400 mt-1 sm:mt-2 font-mono">
            {stats.totalInvited} <span className="text-[10px] sm:text-xs font-normal text-gray-400">Miners</span>
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Current Rank
          </span>
          <p className="text-xl sm:text-3xl font-black text-purple-400 mt-1 sm:mt-2 font-mono">
            Lvl {stats.level}
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Commissions
          </span>
          <p className="text-xl sm:text-3xl font-black text-amber-400 mt-1 sm:mt-2 font-mono truncate">
            {stats.commissionsEarned} <span className="text-[10px] sm:text-xs font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider block truncate">
            Hash Boost
          </span>
          <p className="text-xl sm:text-3xl font-black text-emerald-400 mt-1 sm:mt-2 font-mono">
            +{stats.totalInvited * 2.5}%
          </p>
        </div>
      </div>

      {/* AADS BANNER */}
      <div className="w-full overflow-hidden rounded-2xl">
        <AadsBanner />
      </div>

      {/* REFERRAL LINK CARD */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md space-y-4 shadow-2xl">
        <h3 className="text-base sm:text-xl font-bold text-white">Your Unique Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full flex-1 p-3.5 sm:p-4 bg-black/80 border border-gray-800 rounded-xl sm:rounded-2xl text-emerald-400 font-mono text-xs focus:outline-none truncate"
          />
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-4 sm:px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl sm:rounded-2xl transition-all text-xs text-center"
            >
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={handleNativeShare}
              className="px-4 sm:px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl sm:rounded-2xl transition-all text-xs text-center"
            >
              🚀 Share
            </button>
          </div>
        </div>
      </div>

      {/* DOWNLINE MONITORING TABLE */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>👥 Network Downline</span>
              <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                {referralsList.length} Total
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Monitor team activity live and send WhatsApp reminders to idle miners.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loadingStats ? (
          <div className="text-center py-8 text-gray-400 text-xs animate-pulse">
            Loading team miners network profile...
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-10 bg-black/30 rounded-2xl border border-gray-800/50">
            <p className="text-gray-400 text-xs">No active referrals found in your network.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs text-gray-300 min-w-[500px]">
              <thead className="bg-black/60 text-gray-400 uppercase font-bold border-b border-gray-800">
                <tr>
                  <th className="p-3">Miner</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Remind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredReferrals.map((ref) => {
                  const isActiveMining = ref.isMining === true;
                  const displayName = ref.fullName || ref.name || "Anonymous Miner";
                  return (
                    <tr key={ref.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 font-medium text-white">
                        <p className="font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{displayName}</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate max-w-[120px] sm:max-w-none">{ref.email || "No Email"}</p>
                      </td>
                      <td className="p-3 font-mono text-gray-400 text-[11px]">
                        {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-bold text-xs">
                        {parseFloat(ref.balance || "0").toFixed(2)}
                      </td>
                      <td className="p-3">
                        {isActiveMining ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-[9px] font-bold">
                            IDLE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => triggerMentorReminder(ref)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                        >
                          🔔 Remind
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECONDARY AADS BANNER */}
      <div className="w-full overflow-hidden rounded-2xl">
        <AadsBanner />
      </div>
    </div>
  );
}
            
