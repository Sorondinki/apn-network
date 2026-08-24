"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 1. Automatic Referral Code Detection from URL (?ref=... or ?referral=...)
  useEffect(() => {
    const refFromUrl = searchParams.get("ref") || searchParams.get("referral");
    if (refFromUrl) {
      setReferralCode(refFromUrl);
    }
  }, [searchParams]);

  // 2. Security: Anti-Tamper, Right-Click Block & DevTools Trap
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    const devToolsInterval = setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
      }
    }, 2000);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email: email.trim(), password } 
      : { email: email.trim(), password, referralCode: referralCode.trim() };

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

      if (data.user) {
        localStorage.setItem("apn_user", JSON.stringify(data.user));
        if (data.user.balance !== undefined) {
          localStorage.setItem("apn_user_balance", data.user.balance.toString());
        }
      }

      setToast({
        type: "success",
        msg: isLogin ? "Vault Unlocked! Establishing Node Connection..." : "Web3 Identity Provisioned! Initializing Vault...",
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

  const handleForgotPassword = async () => {
    if (!email) {
      setToast({ type: "error", msg: "Please enter your registered email address first." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch reset instructions.");
      setToast({ type: "success", msg: "Password recovery instructions sent to your email inbox!" });
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Unable to process password recovery." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card p-8 rounded-3xl border border-gray-800/80 w-full max-w-md shadow-2xl relative bg-gray-950/70 backdrop-blur-2xl">
        
        {/* Animated APN Token Header Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-lg animate-pulse" />
            <Image
              src="/images/apn-token512x512.png"
              alt="APN Protocol Token Logo"
              width={72}
              height={72}
              priority
              className="relative object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono tracking-wider uppercase">
            Layer-1 Protocol Engine
          </span>
        </div>

        {/* TAB TOGGLE SWITCHER */}
        <div className="flex bg-black/80 p-1.5 rounded-2xl mb-6 border border-gray-800/80 shadow-inner">
          <button
            type="button"
            onClick={() => { setIsLogin(false); setToast(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              !isLogin 
                ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-green-900/30" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setToast(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              isLogin 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div
            className={`mb-6 p-3.5 rounded-2xl text-xs font-medium border backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                : "bg-rose-950/60 text-rose-400 border-rose-800/60"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isLogin ? "Welcome Back to APN" : "Join APN Network"}
          </h2>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
            {isLogin
              ? "Access your Web3 Node & APN Wallet Vault"
              : "Create your decentralized Web3 identity & start mining APN."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Email Address</label>
            <input
              type="email"
              placeholder="name@domain.com"
              className="w-full p-3.5 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input with Show/Hide & Forgot Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot Password? 🔑
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-3.5 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm pr-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-900 border border-gray-800 transition"
              >
                {showPassword ? "HIDE 🙈" : "SHOW 👁️"}
              </button>
            </div>
          </div>

          {/* Referral Code Field (Auto-filled if linked) */}
          {!isLogin && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-400">Referral Code</label>
                {referralCode && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    ✓ Applied Automatically
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Enter referrer ID (optional)"
                className="w-full p-3.5 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 text-sm shadow-xl mt-2 ${
              isLogin
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30"
                : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-green-900/30"
            }`}
          >
            {loading
              ? isLogin
                ? "Verifying Session..."
                : "Provisioning Identity..."
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 font-mono text-xs">Loading Secure Authentication Engine...</div>}>
      <AuthForm />
    </Suspense>
  );
}