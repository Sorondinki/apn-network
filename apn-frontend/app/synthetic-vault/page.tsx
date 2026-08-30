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

  // DARASIN APN TOKEN: fixed at $0.15 USD per APN
  const APN_PRICE_USD = 0.15;

  // Oracle Pegged Market Prices (USD)
  const [prices] = useState<LivePrices>({
    BTC: 67450.00,
    ETH: 3520.00,
    SOL: 154.50,
    USDT: 1.00,
    PI: 31.40,
    SIDRA: 1.45,
    CORE: 1.28,
    RUBI: 0.65,
    ICE: 0.08,
  });

  const [synthBalances, setSynthBalances] = useState<Record<string, number>>({
    aBTC: 0.00015,
    aETH: 0.0045,
    aSOL: 0.125,
    aUSDT: 12.50,
    aPI: 25.00,
    aSIDRA: 10.00,
    aCORE: 15.00,
    aRUBI: 35.00,
    aICE: 150.00,
  });

  const loadUserData = useCallback(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    const savedBal = localStorage.getItem("apn_user_balance");
    if (savedBal) {
      setApnBalance(parseFloat(savedBal));
    } else {
      setApnBalance(parseFloat(parsed.balance || "0"));
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

  // DYNAMIC CONVERSION CALCULATOR (@ $0.15 USD per APN)
  const calculateOutput = (inputAmount: string) => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return "0.000000";
    const totalUsdValue = amount * APN_PRICE_USD;
    const received = totalUsdValue / targetPriceUsd;
    
    if (received < 0.001) return received.toFixed(6);
    return received.toFixed(4);
  };

  const handleSwap = async () => {
    const amount = parseFloat(swapInput);
    if (isNaN(amount) || amount < 100) {
      toast.error("Mafi ƙarancin APN da zaka iya sauyawa shine 100 APN.");
      return;
    }

    if (amount > apnBalance) {
      toast.error("Ba ka da isasshen APN balance.");
      return;
    }

    setIsSwapping(true);
    const toastId = toast.loading(`Processing conversion to ${selectedToken}...`);

    try {
      const res = await fetch("/api/synthetic/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || user._id,
          email: user.email,
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
        toast.success(`Nasara! An canja ${amount} APN zuwa ${data.receivedAmount} ${selectedToken}! 🚀`, { id: toastId });
      } else {
        toast.error(data.error || "Swap failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error, try again.", { id: toastId });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 select-none">
      <Toaster position="top-right" toastOptions={{ style: { background: "#0f172a", color: "#fff", borderRadius: "12px" } }} />

      {/* HEADER HERO */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
              💎 APN Extended Synthetic Asset Vault
            </span>
            <h1 className="text-3xl font-black text-white mt-2">Multi-Chain Synthetic Ecosystem</h1>
            <p className="text-gray-400 text-xs max-w-xl">
              Convert APN tokens (Valued at $0.15 USD) into Web3 Mining Assets and Major Cryptos.
            </p>
          </div>

          <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-2xl text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Available APN Balance</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{apnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} APN</span>
            <span className="text-[11px] text-indigo-400 font-bold block mt-0.5">≈ ${(apnBalance * APN_PRICE_USD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          </div>
        </div>
      </div>

      {/* EXTENDED ASSET GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenList.map((item) => (
          <div
            key={item.symbol}
            onClick={() => setSelectedToken(item.symbol)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              selectedToken === item.symbol
                ? "bg-indigo-950/50 border-indigo-500 scale-[1.02] shadow-lg shadow-indigo-500/10"
                : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                  {item.category}
                </span>
                <h3 className="text-white font-bold text-base mt-1">{item.symbol}</h3>
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${prices[item.key as keyof LivePrices].toLocaleString()}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/60 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Vault Balance</span>
                <span className="text-lg font-extrabold text-white font-mono">
                  {synthBalances[item.symbol] || 0}
                </span>
              </div>
              <span className="text-[11px] text-indigo-400 font-semibold">Pegged</span>
            </div>
          </div>
        ))}
      </div>

      {/* SWAP ENGINE */}
      <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800 backdrop-blur-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>⚡</span> Convert APN to {selectedToken}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">APN Amount (Min 100):</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={swapInput}
              onChange={(e) => setSwapInput(e.target.value)}
              className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-emerald-400 font-bold block">
              1 APN = $0.15 USD ({swapInput && !isNaN(parseFloat(swapInput)) ? `≈ $${(parseFloat(swapInput) * APN_PRICE_USD).toFixed(2)} USD` : "$0.00 USD"})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-gray-800 flex flex-col justify-center">
            <span className="text-xs text-gray-400 font-medium">You Will Receive ({selectedToken}):</span>
            <span className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
              {calculateOutput(swapInput)}
            </span>
            <span className="text-[11px] text-gray-500 block mt-1">
              Target Asset Market Price: ${targetPriceUsd.toLocaleString()} USD
            </span>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={isSwapping}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSwapping ? "Converting Assets..." : `Swap Now to ${selectedToken} 🚀`}
        </button>
      </div>
    </div>
  );
}