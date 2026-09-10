export interface MiningPlan {
  id: string;
  name: string;
  multiplier: string;
  speedRate: number;
  price: number;
  currency: string;
  period: string;
  badge: string;
  isPopular: boolean;
  features: string[];
  ctaLabel: string;
}

export const MINING_PLANS: MiningPlan[] = [
  {
    id: "plan-starter-pulse",
    name: "Starter Pulse",
    multiplier: "1.5x Speed",
    speedRate: 1.5,
    price: 1.0,
    currency: "USDT",
    period: "month",
    badge: "Essential Tier",
    isPopular: false,
    features: [
      "1.5x Multiplier to Hashrate",
      "Daily Mining Rewards Settlement",
      "Instant BEP-20 Verification",
      "Standard Network Priority"
    ],
    ctaLabel: "Activate Starter"
  },
  {
    id: "plan-velocity-boost",
    name: "Velocity Boost",
    multiplier: "2.5x Speed",
    speedRate: 2.5,
    price: 2.0,
    currency: "USDT",
    period: "month",
    badge: "Most Popular",
    isPopular: true,
    features: [
      "2.5x Multiplier to Hashrate",
      "Daily Mining Rewards Settlement",
      "Priority Block Verification",
      "24/7 High-Bandwidth Node Access"
    ],
    ctaLabel: "Activate Velocity"
  },
  {
    id: "plan-quantum-forge",
    name: "Quantum Forge",
    multiplier: "5.5x Speed",
    speedRate: 5.5,
    price: 4.0,
    currency: "USDT",
    period: "month",
    badge: "Maximum Yield",
    isPopular: false,
    features: [
      "5.5x Maximum Hashrate Multiplier",
      "Real-Time Compounding Hashpower",
      "Zero Confirmation Delay",
      "Dedicated APN Validator Route"
    ],
    ctaLabel: "Activate Quantum"
  }
];
