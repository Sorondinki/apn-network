"use client";

import React, { useState } from "react";

export interface Plan {
  id: string;
  name: string;
  multiplier: string;
  speedFactor: number;
  price: number;
  currency: string;
  period: string;
  badge?: string;
  isPopular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter-pulse",
    name: "Starter Pulse",
    multiplier: "1.5x Speed",
    speedFactor: 1.5,
    price: 1.0,
    currency: "$",
    period: "14 days",
    badge: "Essential Tier",
    isPopular: false,
  },
  {
    id: "velocity-boost",
    name: "Velocity Boost",
    multiplier: "2.3x Speed",
    speedFactor: 2.3,
    price: 2.0,
    currency: "$",
    period: "14 days",
    badge: "Most Popular",
    isPopular: true,
  },
  {
    id: "quantum-forge",
    name: "Quantum Forge",
    multiplier: "4.5x Speed",
    speedFactor: 4.5,
    price: 4.0,
    currency: "$",
    period: "14 days",
    badge: "Maximum Yield",
    isPopular: false,
  },
];

interface FeedbackState {
  type: "idle" | "loading" | "success" | "error";
  message: string;
}

const TREASURY_ADDRESS = "0x0ff84c1b85a65db180e8be26c64160a891ac5bdc";

export default function MiningPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]);
  const [txHash, setTxHash] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    type: "idle",
    message: "",
  });

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(TREASURY_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanHash = txHash.trim();
    if (!cleanHash) {
      setFeedback({
        type: "error",
        message: "Please enter a valid BSC transaction hash.",
      });
      return;
    }

    setFeedback({
      type: "loading",
      message: "Verifying BEP-20 transaction on Binance Smart Chain...",
    });

    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "anonymous-node-user",
          planName: selectedPlan.name,
          expectedAmount: selectedPlan.price,
          txHash: cleanHash,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Payment confirmed! ${selectedPlan.name} (${selectedPlan.multiplier}) activated for ${selectedPlan.period}.`,
        });
        setTxHash("");
      } else {
        setFeedback({
          type: "error",
          message:
            data.message ||
            "Verification failed. Ensure the transaction is confirmed on BSC.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error: Unable to communicate with payment gateway.",
      });
    }
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Supercharge Your APN Node
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Scale your mining throughput with automated BEP-20 verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 border-indigo-500 shadow-2xl shadow-indigo-950/60 ring-2 ring-indigo-500 scale-105"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50"
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    {plan.badge || "Most Popular"}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    {plan.badge && !plan.isPopular && (
                      <span className="text-xs font-medium text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="w-full py-2 bg-indigo-950/50 border border-indigo-500/20 rounded-lg text-center mb-6">
                    <span className="text-indigo-400 font-bold text-base">
                      {plan.multiplier}
                    </span>
                  </div>

                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      {plan.currency}
                      {plan.price.toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-neutral-400">
                      / {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8 text-sm text-neutral-300">
                    <li className="flex items-center space-x-2">
                      <span className="text-indigo-400">✓</span>
                      <span>{plan.speedFactor}x Mining Multiplier</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-indigo-400">✓</span>
                      <span>Daily APN Reward Settlement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-indigo-400">✓</span>
                      <span>{plan.period} Active Boost Duration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-indigo-400">✓</span>
                      <span>Instant On-Chain Verification</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                  }`}
                >
                  {isSelected ? "Plan Selected" : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Deposit & Verification Box */}
        <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-1">
            Confirm {selectedPlan.name} (${selectedPlan.price.toFixed(2)} USDT)
          </h3>
          <p className="text-xs text-neutral-400 mb-6">
            Transfer exact amount of BEP-20 USDT on BNB Smart Chain to the APN Treasury address below:
          </p>

          <div className="mb-6 p-4 rounded-xl bg-black/60 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Network</span>
              <span className="text-amber-400 font-bold">BNB Smart Chain (BEP-20)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Deposit Address</span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <div className="font-mono text-xs text-neutral-200 break-all bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 select-all">
              {TREASURY_ADDRESS}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="txHash"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2"
              >
                Transaction Hash (0x...)
              </label>
              <input
                id="txHash"
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x4e6b..."
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={feedback.type === "loading"}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {feedback.type === "loading"
                ? "Verifying Payment..."
                : `Verify Payment ($${selectedPlan.price.toFixed(2)})`}
            </button>
          </form>

          {feedback.type !== "idle" && (
            <div
              className={`mt-4 p-3.5 rounded-lg text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-950/70 border border-emerald-500/30 text-emerald-400"
                  : feedback.type === "error"
                  ? "bg-rose-950/70 border border-rose-500/30 text-rose-400"
                  : "bg-indigo-950/70 border border-indigo-500/30 text-indigo-300"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
                     
