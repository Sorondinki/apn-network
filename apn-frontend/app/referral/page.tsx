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

  // Mentor Reminder Function (WhatsApp Direct Nudge)
  const triggerMentorReminder = (refUser: any) => {
    const text = encodeURIComponent(
      `Sannu ${refUser.name || "Aboki"}! An gano cewa Node dinka na APN Network bai fara mining ba a yanzu. Shiga manhajar APN ka danna "Start 24h Mining Session" domin kar a barku a baya: ${origin}/dashboard`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const filteredReferrals = referralsList.filter((ref) =>
    (ref.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ref.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans select-none">
      
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-purple-950/60 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            🎁 APN Ecosystem Referral & Mentor Hub
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Invite, Lead & Earn APN Rewards
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Expand the APN Layer-1 network. Earn <b className="text-emerald-400">5.0 APN</b> bonus per referral plus higher levels and node speed multipliers.
          </p>
        </div>
        
        <div className="bg-black/60 p-5 rounded-2xl border border-emerald-500/30 text-right w-full md:w-auto shadow-xl">
          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Your Mining Rank Status</span>
          <span className="text-emerald-400 font-extrabold text-base font-mono block mt-1">{stats.tier}</span>
          <span className="text-[11px] text-amber-400/90 block font-medium mt-0.5">
            Progress: {stats.totalInvited % 10}/10 Miners to Level {stats.level + 1}
          </span>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Invites
          </span>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono">
            {stats.totalInvited} <span className="text-xs font-normal text-gray-400">Miners</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Current Level Rank
          </span>
          <p className="text-3xl font-black text-purple-400 mt-2 font-mono">
            Level {stats.level}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Commissions Earned
          </span>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {stats.commissionsEarned} <span className="text-xs font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-xl">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Network Hash Boost
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            +{stats.totalInvited * 2.5}% <span className="text-xs font-normal text-gray-400">Speed</span>
          </p>
        </div>
      </div>

      {/* AADS ADVERTISING BANNER */}
      <AadsBanner />

      {/* REFERRAL LINK SHARING CARD */}
      <div className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md space-y-4 shadow-2xl">
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
          <button
            onClick={handleNativeShare}
            className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all text-xs"
          >
            🚀 Share
          </button>
        </div>
      </div>

      {/* MENTOR DASHBOARD: REFERRED MINERS LIVE MONITORING TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>👥 Your Network Downline</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
                {referralsList.length} Total
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Monitor your team activity live and remind idle miners to keep mining.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Table Content */}
        {loadingStats ? (
          <div className="text-center py-8 text-gray-400 text-xs animate-pulse">
            Loading team miners network profile...
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-10 bg-black/30 rounded-2xl border border-gray-800/50">
            <p className="text-gray-400 text-xs">No active referrals found in your network.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/60 text-gray-400 uppercase font-bold border-b border-gray-800">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Miner / User</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Node Status</th>
                  <th className="p-3.5 text-right rounded-r-xl">Action / Remind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredReferrals.map((ref) => {
                  const isActiveMining = ref.isMining === true;
                  return (
                    <tr key={ref.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div>
                          <p className="font-bold text-sm">{ref.name || "Anonymous Miner"}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{ref.email || "No Email"}</p>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">
                        {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        {parseFloat(ref.balance || "0").toFixed(2)} APN
                      </td>
                      <td className="p-3.5">
                        {isActiveMining ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            MINING ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-bold">
                            IDLE / OFFLINE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => triggerMentorReminder(ref)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-all"
                        >
                          🔔 Remind Miner
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
      <AadsBanner />
    </div>
  );
}
                
