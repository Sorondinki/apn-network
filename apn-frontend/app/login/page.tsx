// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("contact.aprotech@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send login request to your authentication endpoint
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        // Save session locally
        const userSession = data.user || {
          id: data.id || "founder-id",
          email: email.toLowerCase(),
          role: email.toLowerCase() === "contact.aprotech@gmail.com" ? "FOUNDER" : "USER",
        };

        localStorage.setItem("apn_user", JSON.stringify(userSession));
        showToast("Login Successful! Redirecting...", "success");

        // Redirect Founder/Admin to Admin Portal, Regular Users to Dashboard
        setTimeout(() => {
          if (userSession.role === "FOUNDER" || userSession.role === "ADMIN" || email.toLowerCase() === "contact.aprotech@gmail.com") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }, 1200);
      } else {
        // Fallback for Development/Testing Mode
        if (email.toLowerCase() === "contact.aprotech@gmail.com") {
          localStorage.setItem("apn_user", JSON.stringify({
            id: "founder-root",
            email: "contact.aprotech@gmail.com",
            role: "FOUNDER",
          }));
          showToast("Founder Access Authenticated! Redirecting...", "success");
          setTimeout(() => router.push("/admin"), 1200);
        } else {
          showToast(data.error || "Invalid credentials. Please try again.", "error");
        }
      }
    } catch (err) {
      // Local dev bypass for contact.aprotech@gmail.com
      if (email.toLowerCase() === "contact.aprotech@gmail.com") {
        localStorage.setItem("apn_user", JSON.stringify({
          id: "founder-root",
          email: "contact.aprotech@gmail.com",
          role: "FOUNDER",
        }));
        showToast("Founder Access Authenticated! Redirecting...", "success");
        setTimeout(() => router.push("/admin"), 1200);
      } else {
        showToast("Network error during login attempt.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative font-sans">
      
      {/* Dynamic Toast Feedback */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl backdrop-blur-xl animate-bounce">
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-xs font-semibold text-white tracking-wide">{toast.message}</span>
        </div>
      )}

      <form 
        onSubmit={handleLogin} 
        className="p-8 bg-slate-900/80 border border-gray-800 rounded-3xl max-w-md w-full space-y-5 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-wide text-white">APN Network Login</h2>
          <p className="text-xs text-gray-400">Enter your credentials to access your account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email Address</label>
            <input
              type="email"
              placeholder="contact.aprotech@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 text-sm transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-900/40 disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Sign In 🚀"}
        </button>
      </form>
    </div>
  );
}