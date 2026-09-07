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
  const [tradeMode, setTradeMode] = useState<"BUY" | "SELL">("BUY");

  const APN_PRICE_USD = 0.15;

  const [prices, setPrices] = useState<LivePrices>({
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

  // Fetch Live Global Market Prices
  const fetchLivePrices = async () => {
    try {
      const res = await fetch("/api/synthetic/prices");
      const data = await res.json();
      if (data.success && data.prices) {
        setPrices(data.prices);
      }
    } catch (e) {
      console.error("Live Oracle fetch error:", e);
    }
  };

  const loadUserData = useCallback(async () => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    const userId = parsed.id || parsed._id;

    // Fetch user balance
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

    // Fetch user synthetic holdings
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
    fetchLivePrices();

    // Auto update live rates every 30 seconds
    const interval = setInterval(() => {
      fetchLivePrices();
    }, 30000);

    return () => clearInterval(interval);
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

  // Calculate Conversion based on BUY or SELL mode
  const calculateOutput = () => {
    const amount = parseFloat(swapInput);
    if (isNaN(amount) || amount <= 0) return "0.00";

    if (tradeMode === "BUY") {
      // Input is $APN -> Output is Target Coin
      const totalUsd = amount * APN_PRICE_USD;
      const received = totalUsd / targetPriceUsd;
      return received < 0.001 ? received.toFixed(6) : received.toFixed(4);
    } else {
      // Input is Target Coin -> Output is $APN (Taking Profit at $0.15 peg)
      const totalUsd = amount * targetPriceUsd;
      const apnReceived = totalUsd / APN_PRICE_USD;
      return apnReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  };

  const handleMaxClick = () => {
    if (tradeMode === "BUY") {
      setSwapInput(apnBalance.toString());
    } else {
      setSwapInput((synthBalances[selectedToken] || 0).toString());
    }
  };

  const handleSwap = async () => {
    const amount = parseFloat(swapInput);

    if (tradeMode === "BUY") {
      if (isNaN(amount) || amount < 100) {
        toast.error("Minimum purchase threshold is 100 $APN.");
        return;
      }
      if (amount > apnBalance) {
        toast.error("Insufficient $APN balance in vault.");
        return;
      }
    } else {
      const currentHolding = synthBalances[selectedToken] || 0;
      if (isNaN(amount) || amount <= 0) {
        toast.error(`Please specify a valid amount of ${selectedToken} to sell.`);
        return;
      }
      if (amount > currentHolding) {
        toast.error(`Insufficient ${selectedToken} balance in your vault.`);
        return;
      }
    }

    setIsSwapping(true);
    const toastId = toast.loading(
      tradeMode === "BUY"
        ? `Converting ${amount.toLocaleString()} $APN to ${selectedToken}...`
        : `Swapping ${amount.toLocaleString()} ${selectedToken} for $APN profit...`
    );

    try {
      const res = await fetch("/api/synthetic/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || user._id,
          amount: amount,
          token: selectedToken,
          mode: tradeMode,
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
        toast.success(
          tradeMode === "BUY"
            ? `Successfully acquired ${data.receivedAmount} ${selectedToken}!`
            : `Profit secured! Received +${data.receivedAmount} $APN tokens 🚀`,
          { id: toastId }
        );
      } else {
        toast.error(data.error || "Transaction failed.", { id: toastId });
      }
    } catch {
      toast.error("Network communication error. Please try again.", { id: toastId });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6 select-none font-sans">
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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-black border border-indigo-500/30 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                Live Oracle Multi-Chain Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Synthetic Liquidity & Trading Hub
            </h1>
            <p className="text-gray-400 text-xs max-w-xl leading-relaxed mt-1">
              Trade synthetic assets with live global crypto market rates. Buy dips and sell back to <strong>$APN (Pegged at $0.15)</strong> to harvest your profits directly.
            </p>
          </div>

          <div className="w-full md:w-auto p-4 sm:p-5 bg-slate-950/80 border border-indigo-500/30 rounded-2xl text-left md:text-right shadow-inner">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
              Available $APN Balance
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono block mt-1">
              {apnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $APN
            </span>
            <span className="text-[11px] text-indigo-300 font-bold font-mono block mt-0.5">
              ≈ ${(apnBalance * APN_PRICE_USD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      {/* LIVE ASSET GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenList.map((item) => {
          const liveVal = prices[item.key as keyof LivePrices] || 1;
          const userHolding = synthBalances[item.symbol] || 0;
          const userHoldingUsd = userHolding * liveVal;

          return (
            <div
              key={item.symbol}
              onClick={() => setSelectedToken(item.symbol)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                selectedToken === item.symbol
                  ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10 scale-[1.01]"
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

                <div className="text-right">
                  <span className="text-sm font-mono font-black text-emerald-400 block">
                    ${liveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">Live Oracle</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                    Vault Balance
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-white font-mono block">
                    {userHolding.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-mono block">
                    ≈ ${userHoldingUsd.toFixed(2)} USD
                  </span>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                  Tradeable
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TWO-WAY TRADING ENGINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl space-y-6 shadow-2xl">
        {/* TRADE MODE TOGGLE (BUY VS SELL TO APN) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span> APN Instant DEX Router
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select trade direction to swap into {selectedToken} or cash-out profits into $APN.
            </p>
          </div>

          <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setTradeMode("BUY");
                setSwapInput("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                tradeMode === "BUY"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Buy {selectedToken}
            </button>
            <button
              onClick={() => {
                setTradeMode("SELL");
                setSwapInput("");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                tradeMode === "SELL"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sell ➔ Take Profit ($APN)
            </button>
          </div>
        </div>

        {/* INPUT & CONVERSION BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {tradeMode === "BUY" ? "You Pay ($APN Tokens):" : `You Sell (${selectedToken}):`}
              </label>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-[11px] font-mono font-bold text-indigo-400 hover:underline cursor-pointer"
              >
                Max:{" "}
                {tradeMode === "BUY"
                  ? apnBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : (synthBalances[selectedToken] || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                placeholder={tradeMode === "BUY" ? "Min 100 APN" : "Amount to sell"}
                value={swapInput}
                onChange={(e) => setSwapInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
              <span className="absolute right-3 top-3.5 text-xs font-mono font-bold text-gray-400">
                {tradeMode === "BUY" ? "APN" : selectedToken}
              </span>
            </div>

            <span className="text-[11px] text-emerald-400 font-mono font-bold block">
              {tradeMode === "BUY"
                ? `1 APN = $0.15 USD (≈ $${((parseFloat(swapInput) || 0) * APN_PRICE_USD).toFixed(2)} USD)`
                : `1 ${selectedToken} = $${targetPriceUsd.toLocaleString()} USD (Live Oracle)`}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-center">
            <span className="text-xs text-gray-400 font-medium">
              {tradeMode === "BUY" ? "Estimated Output Received:" : "Estimated $APN Tokens Credited:"}
            </span>
            <span className="text-2xl font-black text-indigo-400 font-mono mt-1">
              {calculateOutput()} {tradeMode === "BUY" ? selectedToken : "$APN"}
            </span>
            <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 font-mono border-t border-slate-900 pt-2">
              <span>Oracle Peg Rate:</span>
              <span className="text-gray-300 font-bold">${targetPriceUsd.toLocaleString()} USD</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={isSwapping}
          className={`w-full py-4 font-black text-xs uppercase tracking-wider text-white rounded-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer ${
            tradeMode === "BUY"
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-950"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950"
          }`}
        >
          {isSwapping
            ? "Executing Consensus Settlement..."
            : tradeMode === "BUY"
            ? `Swap APN Now to ${selectedToken} 🚀`
            : `Sell ${selectedToken} & Harvest $APN Profit 💰`}
        </button>
      </div>
    </div>
  );
}
                  
