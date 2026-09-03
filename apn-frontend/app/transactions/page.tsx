"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  txHash: string;
  type: string;
  amount: number;
  status: string;
  timestamp: string;
  description: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  const fetchTransactions = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/transactions?userId=${userId}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error loading transactions from server:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchTransactions(userData.id);
    } catch (e) {
      console.error("Failed to parse user session", e);
      router.push("/register");
    }
  }, [router, fetchTransactions]);

  const handleCopyHash = (txHash: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(txHash);
      setCopiedTx(txHash);
      setTimeout(() => setCopiedTx(null), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;

    const t = (tx.type || "").toUpperCase();

    if (filter === "MINING_REWARD") {
      return t.includes("MINING");
    }

    if (filter === "REFERRAL_BONUS") {
      return t.includes("REFERRAL") || t.includes("INVITE");
    }

    if (filter === "FOUNDER_AIRDROP") {
      return (
        t.includes("AIRDROP") ||
        t.includes("FOUNDER") ||
        t.includes("WELCOME") ||
        t === "BONUS"
      );
    }

    if (filter === "STAKING_YIELD") {
      return t.includes("STAKE") || t.includes("YIELD");
    }

    if (filter === "TRANSFER_OUT") {
      return (
        t.includes("OUT") ||
        t.includes("SENT") ||
        t.includes("WITHDRAW") ||
        t.includes("TRANSFER_OUT")
      );
    }

    return t === filter;
  });

  const totalEarned = transactions
    .filter((t) => !t.type.includes("OUT") && !t.type.includes("WITHDRAW") && t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalTransferred = transactions
    .filter((t) => (t.type.includes("OUT") || t.type.includes("WITHDRAW")) && t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            📜 On-Chain Ledger & History
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Transaction Activity Log
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            View real-time database records of your node mining rewards, referral commissions, founder airdrops, and token transfers.
          </p>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Earnings Received
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            +{totalEarned.toFixed(2)} <span className="text-xs font-normal text-gray-400">$APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Transfers Out
          </span>
          <p className="text-3xl font-black text-rose-400 mt-2 font-mono">
            -{totalTransferred.toFixed(2)} <span className="text-xs font-normal text-gray-400">$APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Records Logged
          </span>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono">
            {transactions.length} <span className="text-xs font-normal text-gray-400">Records</span>
          </p>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 border border-gray-800/80 rounded-2xl backdrop-blur-md">
        {[
          { label: "All Transactions", value: "ALL" },
          { label: "⛏️ Mining Rewards", value: "MINING_REWARD" },
          { label: "🎁 Referral Bonus", value: "REFERRAL_BONUS" },
          { label: "💎 Founder Airdrop", value: "FOUNDER_AIRDROP" },
          { label: "🔒 Staking Yields", value: "STAKING_YIELD" },
          { label: "💸 Transfers Out", value: "TRANSFER_OUT" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              filter === item.value
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-mono text-xs">
            Fetching live transactions from database...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono text-xs">
            No transaction records found in database for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[11px] text-gray-400 uppercase tracking-wider font-extrabold">
                  <th className="py-4 px-4">Type & Details</th>
                  <th className="py-4 px-4">Tx Hash</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const isOutflow =
                    tx.type.includes("OUT") || tx.type.includes("WITHDRAW");
                  const isPositive = !isOutflow;

                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/30 transition-all">
                      {/* TYPE & DESCRIPTION */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              tx.type.includes("MINING")
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : tx.type.includes("REFERRAL")
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : tx.type.includes("AIRDROP") || tx.type.includes("FOUNDER")
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : tx.type.includes("STAKE") || tx.type.includes("YIELD")
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {tx.type.includes("MINING")
                              ? "⛏️"
                              : tx.type.includes("REFERRAL")
                              ? "🎁"
                              : tx.type.includes("AIRDROP") || tx.type.includes("FOUNDER")
                              ? "💎"
                              : tx.type.includes("STAKE") || tx.type.includes("YIELD")
                              ? "🔒"
                              : "💸"}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.description}</p>
                            <span className="text-[10px] text-gray-500 uppercase font-mono">
                              {tx.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TX HASH */}
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-400">
                        <button
                          onClick={() => handleCopyHash(tx.txHash)}
                          className="hover:text-blue-400 transition-all flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-gray-800"
                        >
                          <span className="truncate max-w-[120px] sm:max-w-none">{tx.txHash}</span>
                          <span className="text-[10px]">
                            {copiedTx === tx.txHash ? "✓" : "📋"}
                          </span>
                        </button>
                      </td>

                      {/* TIMESTAMP */}
                      <td className="py-4 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                        {tx.timestamp}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            tx.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : tx.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* AMOUNT */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span
                          className={isPositive ? "text-emerald-400" : "text-rose-400"}
                        >
                          {isPositive ? "+" : "-"}
                          {tx.amount.toFixed(2)} $APN
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
