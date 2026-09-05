"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface LivePrices {
  BTC: number;
  ETH: number;
  SOL: number;
  USDT: number;
  PI: number;
  SIDRA: number;
  CORE: number;
  RUBI: number;
  ICE: number;
}

export default function ExtendedSyntheticVaultPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [apnBalance, setApnBalance] = useState<number>(0);
  const [swapInput, setSwapInput] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("aSIDRA");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const APN_PRICE_USD = 0.15;

  const [prices] = useState<LivePrices>({
    BTC: 67450.0,
    ETH: 3520.0,
    SOL: 154.5,
    USDT: 1.0,
    PI: 31.4,
    SIDRA: 1.45,
    CORE: 1.28,
    RUBI: 0.65,
    ICE: 0.08,
  });

  // Live initial balances set strictly to 0
  const [synthBalances, setSynthBalances] = useState<Record<string, number>>({
    aBTC: 0,
    aETH: 0,
    aSOL: 0,
    aUSDT: 0,
    aPI: 0,
    aSIDRA: 0,
    aCORE: 0,
    aRUBI: 0,
    aICE: 0,
  });

  const loadUserData = useCallback(async () => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    const userId = parsed.id || parsed._id;

    // Fetch live user balance
    try {
      const profileRes = await fetch(`/api/user/profile?id=${encodeURIComponent(userId)}`);
      const profileData = await profileRes.json();
      if (profileData.success && profileData.user) {
        const bal = parseFloat(profileData.user.balance || "0");
        setApnBalance(bal);
        localStorage.setItem("apn_user_balance", bal.toString());
      }
    } catch {
      setApnBalance(parseFloat(parsed.balance || "0"));
    }

    // Fetch live synthetic balances from Supabase
    try {
      const synthRes = await fetch(`/api/synthetic/balances?userId=${encodeURIComponent(userId)}`);
      const synthData = await synthRes.json();
      if (synthData.success && synthData.balances) {
        setSynthBalances(synthData.balances);
      }
    } catch (e) {
      console.error("Failed to load synthetic balances:", e);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const tokenList = [
    { symbol: "aSIDRA", name: "Sidra Chain Synthetic", key: "SIDRA", category: "Web3 Mining" },
    { symbol: "aCORE", name: "Core DAO Synthetic", key: "CORE", category: "Web3 Mining" },
    { symbol: "aRUBI", name: "Rubi Block Synthetic", key: "RUBI", category: "Web3 Mining" },
    { symbol: "aICE", name: "Ice Open Network", key: "ICE", category: "Web3 Mining" },
    { symbol: "aPI", name: "Pi Network Synthetic", key: "PI", category: "Web3 Mining" },
    { symbol: "aBTC", name: "Bitcoin Synthetic", key: "BTC", category: "Major Crypto" },
    { symbol: "aETH", name: "Ethereum Synthetic", key: "ETH", category: "Major Crypto" },
    { symbol: "aSOL", name: "Solana Synthetic", key: "SOL", category: "Major Crypto" },
    { symbol: "aUSDT", name: "Tether USD Synthetic", key: "USDT", category: "Stablecoin" },
  ];

  const currentTokenInfo = tokenList.find((t) => t.symbol === selectedToken) || tokenList[0];
  const targetPriceUsd = prices[currentTokenInfo.key as keyof LivePrices] || 1;

  const calculateOutput = (inputAmount: string) => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return "0.000000";
    const totalUsdValue = amount * APN_PRICE_USD;
    const received = totalUsdValue / targetPriceUsd;
    return received < 0.001 ? received.toFixed(6) : received.toFixed(4);
  };

  const handleSwap = async () => {
    const amount = parseFloat(swapInput);
    if (isNaN(amount) || amount < 100) {
      toast.error("Minimum conversion threshold is 100 $APN.");
      return;
    }

    if (amount > apnBalance) {
      toast.error("Insufficient $APN balance in vault.");
      return;
    }

    setIsSwapping(true);
    const toastId = toast.loading(`Converting ${amount.toLocaleString()} $APN to ${selectedToken}...`);

    try {
      const res = await fetch("/api/synthetic/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || user._id,
          apnAmount: amount,
          targetToken: selectedToken,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setApnBalance(data.newApnBalance);
        setSynthBalances((prev) => ({
          ...prev,
          [selectedToken]: data.newSyntheticBalance,
        }));

        localStorage.setItem("apn_user_balance", data.newApnBalance.toString());
        const updatedUser = { ...user, balance: data.newApnBalance };
        setUser(updatedUser);
        localStorage.setItem("apn_user", JSON.stringify(updatedUser));

        setSwapInput("");
        toast.success(`Success! Received ${data.receivedAmount} ${selectedToken} 🚀`, { id: toastId });
      } else {
        toast.error(data.error || "Synthetic swap failed.", { id: toastId });
      }
    } catch {
      toast.error("Network communication error. Please try again.", { id: toastId });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 select-none font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #1e293b",
            borderRadius: "14px",
            fontSize: "13px",
          },
        }}
      />

      {/* HEADER HERO */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-black border border-indigo-500/30 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              💎 APN Extended Synthetic Asset Vault
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Multi-Chain Synthetic Ecosystem
            </h1>
            <p className="text-gray-400 text-xs max-w-xl leading-relaxed mt-1">
              Convert native $APN tokens (Oracle pegged at $0.15 USD) directly into synthetic cross-chain mining assets and top tier cryptocurrencies.
            </p>
          </div>

          <div className="p-5 bg-slate-950/80 border border-indigo-500/30 rounded-2xl text-left md:text-right shadow-inner">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
              Available APN Balance
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono block mt-1">
              {apnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $APN
            </span>
            <span className="text-[11px] text-indigo-300 font-bold font-mono block mt-0.5">
              ≈ ${(apnBalance * APN_PRICE_USD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      {/* EXTENDED ASSET GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenList.map((item) => (
          <div
            key={item.symbol}
            onClick={() => setSelectedToken(item.symbol)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
              selectedToken === item.symbol
                ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold tracking-wide">
                  {item.category}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <h3 className="text-white font-bold text-base">{item.symbol}</h3>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded font-mono font-bold">
                    (a)
                  </span>
                </div>
                <span className="text-xs text-gray-400 block">{item.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${prices[item.key as keyof LivePrices].toLocaleString()}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                  Vault Balance
                </span>
                <span className="text-lg font-extrabold text-white font-mono">
                  {(synthBalances[item.symbol] || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
              </div>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                APN Pegged
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SWAP ENGINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl space-y-5 shadow-2xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>⚡</span> Convert APN to {selectedToken}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              APN Amount (Min 100 $APN):
            </label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={swapInput}
              onChange={(e) => setSwapInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="text-[11px] text-emerald-400 font-mono font-bold block">
              1 APN = $0.15 USD (≈ ${((parseFloat(swapInput) || 0) * APN_PRICE_USD).toFixed(2)} USD)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-center">
            <span className="text-xs text-gray-400 font-medium">Estimated Synthetic Output:</span>
            <span className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
              {calculateOutput(swapInput)} {selectedToken}
            </span>
            <span className="text-[11px] text-slate-500 font-mono block mt-1">
              Oracle Index Price: ${targetPriceUsd.toLocaleString()} USD
            </span>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={isSwapping}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-black text-xs uppercase tracking-wider text-white rounded-xl transition-all shadow-lg shadow-indigo-950 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSwapping ? "Executing Consensus Conversion..." : `Swap Now to ${selectedToken} 🚀`}
        </button>
      </div>
    </div>
  );
}
    
