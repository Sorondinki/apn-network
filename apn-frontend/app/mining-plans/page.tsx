"use client";

import React, { useState } from "react";
import { MINING_PLANS, MiningPlan } from "../data/plans-data";

interface MiningPlansProps {
  userId: string;
}

interface VerificationState {
  type: "idle" | "loading" | "success" | "error";
  message: string;
}

export default function MiningPlans({ userId }: MiningPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan>(MINING_PLANS[1]);
  const [txHash, setTxHash] = useState<string>("");
  const [verification, setVerification] = useState<VerificationState>({
    type: "idle",
    message: ""
  });

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!txHash.trim()) {
      setVerification({
        type: "error",
        message: "Please enter your BSC transaction hash."
      });
      return;
    }

    setVerification({
      type: "loading",
      message: "Verifying payment on Binance Smart Chain..."
    });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://127.0.0.1:5000";

      const res = await fetch(`${apiBase}/api/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId || "anonymous-node-user",
          planName: selectedPlan.name,
          expectedAmount: selectedPlan.price,
          txHash: txHash.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVerification({
          type: "success",
          message: `Success! ${selectedPlan.name} (${selectedPlan.multiplier}) has been activated.`
        });
        setTxHash("");
      } else {
        setVerification({
          type: "error",
          message:
            data.message ||
            "Transaction verification failed. Confirm details on BscScan."
        });
      }
    } catch {
      setVerification({
        type: "error",
        message: "Network error: Unable to connect to APN Payment Gateway."
      });
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Supercharge Your APN Hashrate
        </h2>
        <p className="mt-4 text-lg text-neutral-400">
          Scale your node generation rate with instant on-chain BEP-20 verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {MINING_PLANS.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative flex flex-col justify-between p-8 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-neutral-900 border-indigo-500 ring-2 ring-indigo-500 shadow-xl shadow-indigo-950/40 scale-105"
                  : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-90 hover:opacity-100"
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  {!plan.isPopular && (
                    <span className="text-xs font-medium text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-md">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="inline-block w-full py-2 px-3 bg-indigo-950/50 border border-indigo-500/20 rounded-lg text-center mb-6">
                  <span className="text-indigo-400 font-bold text-lg">
                    {plan.multiplier}
                  </span>
                </div>

                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-extrabold text-white">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-neutral-400">
                    / {plan.period}
                  </span>
                </div>

                Ga yadda zaka tsara TypeScript/JavaScript data structure din cikin fayil mai suna `plansData.ts` (ko kai tsaye a cikin component) tare da cikakken types da clean format:

```typescript
// plansData.ts

export interface Plan {
  id: string;
  name: string;
  multiplier: string;
  speedFactor: number; // Domin saukin calculations a logic
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
    period: "/ month",
    badge: "Essential Tier",
    isPopular: false,
  },
  {
    id: "velocity-boost",
    name: "Velocity Boost",
    multiplier: "2.5x Speed",
    speedFactor: 2.5,
    price: 2.0,
    currency: "$",
    period: "/ month",
    badge: "Most Popular",
    isPopular: true,
  },
  {
    id: "quantum-forge",
    name: "Quantum Forge",
    multiplier: "5.5x Speed",
    speedFactor: 5.5,
    price: 4.0,
    currency: "$",
    period: "/ month",
    isPopular: false,
  },
];
