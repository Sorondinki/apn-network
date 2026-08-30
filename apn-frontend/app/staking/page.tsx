"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

export default function StakingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [claimableReward, setClaimableReward] = useState(0);
  const [stakeInput, setStakeInput] = useState("");
  const [unstakeInput, setUnstakeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Annual Percentage Yield (APY = 18.5%)
  const APY_RATE = 0.185; 

  const fetchUserData = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("apn_user");
      if (!savedUser) {
        router.push("/register");
        return;
      }

      const localUserData = JSON.parse(savedUser);
      setUser(localUserData);

      const userIdParam = localUserData.id || localUserData._id || "";
      const emailParam = localUserData.email || "";

      const res = await fetch(`/api/user/profile?userId=${userIdParam}&email=${emailParam}`);
      const data = await res.json();

      if (data && data.success && data.user) {
        const u = data.user;
        setUser(u);
        const currentBal = parseFloat(u.balance || "0");
        const currentStaked = parseFloat(u.staked_balance || u.stakedBalance || "0");

        setBalance(currentBal);
        setStakedAmount(currentStaked);

        localStorage.setItem("apn_user_balance", currentBal.toString());
        localStorage.setItem("apn_user", JSON.stringify(u));
      } else {
        setBalance(parseFloat(localUserData.balance || "0"));
        setStakedAmount(parseFloat(localUserData.staked_balance || localUserData.stakedBalance || "0"));
      }
    } catch (err) {
      console.error("Error fetching user staking profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Real-time Reward Counter Engine
  useEffect(() => {
    if (stakedAmount <= 0) {
      setClaimableReward(0);
      return;
    }

    const interval = setInterval(() => {
      const rewardPerSecond = (stakedAmount * APY_RATE) / (365 * 24 * 3600);
      setClaimableReward((prev) => prev + rewardPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [stakedAmount]);

  const handleStake = async () => {
    const amount = parseFloat(stakeInput);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      toast.error("Please enter a valid APN amount within your available balance.");
      return;
    }

    if (!user || (!user.id && !user.email)) {
      toast.error("User session invalid. Please log in again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Processing staking transaction...");

    try {
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id || user._id, 
          email: user.email,
          amount, 
          action: "STAKE" 
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newBal = parseFloat(data.balance);
        const newStaked = parseFloat(data.stakedBalance);

        setBalance(newBal);
        setStakedAmount(newStaked);
        localStorage.setItem("apn_user_balance", newBal.toString());

        const updatedUser = { ...user, balance: newBal, stakedBalance: newStaked, staked_balance: newStaked };
        setUser(updatedUser);
        localStorage.setItem("apn_user", JSON.stringify(updatedUser));

        setStakeInput("");
        toast.success("Tokens successfully locked in APN Vault! 🚀", { id: toastId });
      } else {
        toast.error(data.error || "Staking failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error, please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnstake = async () => {
    const amount = parseFloat(unstakeInput);
    if (isNaN(amount) || amount <= 0 || amount > stakedAmount) {
      toast.error("Please enter a valid amount within your current staked balance.");
      return;
    }

    if (!user || (!user.id && !user.email)) {
      toast.error("User session invalid. Please log in again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Processing unstaking transaction...");

    try {
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id || user._id, 
          email: user.email,
          amount, 
          action: "UNSTAKE" 
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newBal = parseFloat(data.balance);
        const newStaked = parseFloat(data.stakedBalance);

        setBalance(newBal);
        setStakedAmount(newStaked);
        localStorage.setItem("apn_user_balance", newBal.toString());

        const updatedUser = { ...user, balance: newBal, stakedBalance: newStaked, staked_balance: newStaked };
        setUser(updatedUser);
        localStorage.setItem("apn_user", JSON.stringify(updatedUser));

        setUnstakeInput("");
        toast.success("Tokens successfully unstaked! 🔓", { id: toastId });
      } else {
        toast.error(data.error || "Unstaking failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error, please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Loading APN Vault Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 select-none">
      {/* Toast Notification Provider for dark theme */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
            border: "1px solid #1f2937",
            fontSize: "14px",
            borderRadius: "12px",
          },
        }} 
      />

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium backdrop-blur-md">
            🔒 Liquid Proof-of-Stake Consensus Vault
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight">
            APN Staking Console
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            Lock your native APN tokens into the consensus protocol. Earn passive yield powered by 18.5% fixed APY network rewards.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/30">
            <Image
              src="/images/apn-token512x512.png"
              alt="APN Vault"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">AVAILABLE BALANCE</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-3">{balance.toFixed(6)} <span className="text-xs text-gray-400">APN</span></p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-blue-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">STAKED IN VAULT</span>
          <p className="text-2xl font-extrabold text-blue-400 font-mono mt-3">{stakedAmount.toFixed(6)} <span className="text-xs text-gray-400">APN</span></p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-amber-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">LIVE CLAIMABLE YIELD</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono mt-3 animate-pulse">
            +{claimableReward.toFixed(8)} <span className="text-xs text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-purple-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">ESTIMATED APY</span>
          <p className="text-2xl font-extrabold text-purple-400 font-mono mt-3">+18.5%</p>
        </div>
      </div>

      {/* STAKE & UNSTAKE ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Deposit/Stake Section */}
        <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📥</span> Deposit to Staking Vault
          </h3>
          <p className="text-xs text-gray-400">Lock your APN tokens to begin accumulating real-time APY yield.</p>
          
          <div className="space-y-3 pt-2">
            <input
              type="number"
              placeholder="Enter APN Amount"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={handleStake}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Stake Tokens 🚀"}
            </button>
          </div>
        </div>

        {/* Withdraw/Unstake Section */}
        <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📤</span> Withdraw from Vault
          </h3>
          <p className="text-xs text-gray-400">Unstake your locked tokens and return them directly to your main balance.</p>
          
          <div className="space-y-3 pt-2">
            <input
              type="number"
              placeholder="Enter APN Amount to Unstake"
              value={unstakeInput}
              onChange={(e) => setUnstakeInput(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={handleUnstake}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Unstake Tokens 🔓"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
 }
      
