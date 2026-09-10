import React, { useState } from 'react';

const PLANS = [
  {
    id: 'plan_starter',
    name: 'Starter Pulse',
    multiplier: '1.5x',
    price: 1,
    period: 'month',
    badge: 'Standard Tier',
    features: [
      '1.5x Multiplier to Hashrate',
      'Daily Mining Rewards Settlement',
      'Instant On-Chain Activation',
      'Standard Network Priority'
    ],
    popular: false
  },
  {
    id: 'plan_velocity',
    name: 'Velocity Boost',
    multiplier: '2.5x',
    price: 2,
    period: 'month',
    badge: 'Most Popular',
    features: [
      '2.5x Multiplier to Hashrate',
      'Daily Mining Rewards Settlement',
      'Priority Block Verification',
      '24/7 Priority Node Access'
    ],
    popular: true
  },
  {
    id: 'plan_quantum',
    name: 'Quantum Forge',
    multiplier: '5.5x',
    price: 4,
    period: 'month',
    badge: 'Maximum Yield',
    features: [
      '5.5x Maximum Hashrate Multiplier',
      'Instant Auto-Compounding Yield',
      'Zero Validation Slippage',
      'Dedicated APN High-Speed Node Access'
    ],
    popular: false
  }
];

export default function BoostingPlans({ currentUserId, userWalletAddress }) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Replace with your actual VPS IP or configured domain
  const API_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://YOUR_VPS_IP:5000';

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!txHash) {
      setStatusMessage({ type: 'error', text: 'Please enter the transaction hash.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUserId || 'guest_user',
          planName: selectedPlan.name,
          expectedAmount: selectedPlan.price,
          txHash: txHash.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `Plan activated! ${selectedPlan.name} is now active at ${selectedPlan.multiplier} speed.` 
        });
        setTxHash('');
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: result.message || 'Payment verification failed. Please confirm the transaction on BscScan.' 
        });
      }
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Network error: Unable to connect to verification server.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Supercharge Your APN Hashrate
        </h2>
        <p className="mt-4 text-base text-gray-400">
          Scale your node generation rate up to 5.5x with instant verification on Binance Smart Chain.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`cursor-pointer relative flex flex-col p-8 rounded-2xl border transition-all duration-200 ${
              selectedPlan.id === plan.id
                ? 'border-indigo-500 bg-gray-900 shadow-2xl scale-105'
                : 'border-gray-800 bg-gray-950 hover:border-gray-700'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs uppercase px-3 py-1 rounded-full font-semibold tracking-wider">
                {plan.badge}
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.badge}</p>
            </div>

            <div className="flex items-baseline my-6">
              <span className="text-4xl font-extrabold text-white">${plan.price}</span>
              <span className="text-gray-400 ml-2 text-sm">/ {plan.period}</span>
            </div>

            <div className="py-2 px-3 bg-indigo-950/60 border border-indigo-500/30 rounded-lg mb-6 text-center">
              <span className="text-indigo-400 font-bold text-lg">{plan.multiplier} Multiplier</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-300">
                  <span className="text-indigo-400 mr-2">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                selectedPlan.id === plan.id
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {selectedPlan.id === plan.id ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Submission Box */}
      <div className="mt-16 max-w-xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h4 className="text-lg font-bold text-white mb-2">
          Activate {selectedPlan.name} (${selectedPlan.price} USDT)
        </h4>
        <p className="text-xs text-gray-400 mb-6">
          Transfer exact USDT (BEP-20) amount to the official treasury address, then submit your transaction hash below:
        </p>

        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Binance Smart Chain Tx Hash
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              required
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Verifying on Chain...' : `Verify Payment ($${selectedPlan.price})`}
          </button>
        </form>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
