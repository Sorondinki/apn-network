"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Endpoint selection
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { email, password, referralCode };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store User Session securely upon successful database authentication
      if (data.user) {
        localStorage.setItem("apn_user", JSON.stringify(data.user));
        if (data.user.balance !== undefined) {
          localStorage.setItem("apn_user_balance", data.user.balance.toString());
        }
      }

      setToast({
        type: "success",
        msg: isLogin ? "Login successful! Redirecting..." : "Registration successful! Redirecting...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="glass-card p-8 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl relative">
        
        {/* TAB TOGGLE SWITCHER */}
        <div className="flex bg-black/60 p-1 rounded-xl mb-6 border border-gray-800">
          <button
            type="button"
            onClick={() => { setIsLogin(false); setToast(null); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              !isLogin ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setToast(null); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              isLogin ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-semibold transition-all ${
              toast.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            {isLogin ? "Welcome Back to APN" : "Join APN Network"}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {isLogin
              ? "Access your Web3 Node & APN Wallet Vault"
              : "Create your decentralized Web3 identity & start mining APN."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="name@domain.com"
              className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Referral Code (Optional)</label>
              <input
                type="text"
                placeholder="Enter referrer ID"
                className="w-full p-3.5 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors text-sm font-mono"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-lg ${
              isLogin
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40"
                : "bg-green-600 hover:bg-green-500 shadow-green-900/40"
            }`}
          >
            {loading
              ? isLogin
                ? "Signing In..."
                : "Creating Account..."
              : isLogin
              ? "Sign In to Dashboard"
              : "Create Web3 Account"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setToast(null); }}
            className="text-blue-400 hover:underline font-semibold ml-1"
          >
            {isLogin ? "Create One" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}