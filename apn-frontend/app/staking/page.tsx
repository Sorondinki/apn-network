// app/staking/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StakingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [stakeInput, setStakeInput] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);

    const savedBal = localStorage.getItem("apn_user_balance");
    if (savedBal) setBalance(parseFloat(savedBal));

    if (userData.stakedBalance !== undefined) {
      setStakedAmount(parseFloat(userData.stakedBalance));
    }
  }, [router]);

  const handleStake = async () => {
    const amount = parseFloat(stakeInput);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      alert("Please enter a valid APN amount within your balance.");
      return;
    }

    try {
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount }),
      });

      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setStakedAmount(data.stakedBalance);
        localStorage.setItem("apn_user_balance", data.balance.toString());

        const updatedUser = { ...user, balance: data.balance, stakedBalance: data.stakedBalance };
        localStorage.setItem("apn_user", JSON.stringify(updatedUser));

        setStakeInput("");
        alert("Tokens staked successfully into Database Vault!");
      } else {
        alert(data.error || "Staking failed");
      }
    } catch (e) {
      alert("Network error, please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
          🔒 Liquid Proof-of-Stake Vault
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">APN Staking Console</h1>
        <p className="text-gray-400 text-xs max-w-xl">
          Lock your native APN tokens to secure the network consensus node and earn up to 18.5% APY rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">AVAILABLE BALANCE</span>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-3">{balance.toFixed(6)} APN</p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">STAKED IN VAULT (DB)</span>
          <p className="text-3xl font-extrabold text-blue-400 font-mono mt-3">{stakedAmount.toFixed(6)} APN</p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">ESTIMATED APY</span>
          <p className="text-3xl font-extrabold text-purple-400 font-mono mt-3">+18.5%</p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-4">
        <h3 className="text-lg font-bold text-white">Deposit to Staking Vault</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="number"
            placeholder="Enter APN Amount"
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            className="flex-1 bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={handleStake}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-900/40"
          >
            Stake Tokens
          </button>
        </div>
      </div>
    </div>
  );
}