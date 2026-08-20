"use client";
import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const isAuthPage = pathname === '/register' || pathname === '/login' || pathname === '/';

  // Load user data to verify session identity securely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("apn_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      }
    }
  }, [pathname]);

  // Base Navigation Items
  const baseNavItems = [
    { name: '⛏️ Web Mining', path: '/dashboard' },
    { name: '💳 Wallet & Withdraw', path: '/wallet' },
    { name: '📜 Transactions', path: '/transactions' },
    { name: '🔒 Staking Vault', path: '/staking' },
    { name: '🎯 Quests & Ads', path: '/tasks' },
    { name: '🌐 Explorer', path: '/explorer' },
    { name: '🎁 Referrals', path: '/referral' },
    { name: '🛡️ Identity Verification', path: '/kyc' },
  ];

  // Dynamic Navigation based ONLY on backend-assigned Role (ADMIN / FOUNDER)
  const isAdmin = user?.role === "ADMIN" || user?.role === "FOUNDER";
  
  const navItems = isAdmin
    ? [...baseNavItems, { name: '⚙️ Node Admin', path: '/admin' }]
    : baseNavItems;

  const handleGlobalLogout = () => {
    const savedBalance = localStorage.getItem("apn_user_balance");
    const savedUser = localStorage.getItem("apn_user");

    if (savedUser && savedBalance) {
      try {
        const userData = JSON.parse(savedUser);
        fetch("/api/user/sync-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id, balance: parseFloat(savedBalance) }),
        });
      } catch (e) {
        console.error("Logout Sync Error:", e);
      }
    }

    localStorage.removeItem("apn_user");
    localStorage.removeItem("apn_user_balance");
    setUser(null);
    router.push("/register");
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <title>Alpha Proficiency Network - APN Protocol</title>
      </head>
      <body className="flex flex-col md:flex-row h-screen w-full bg-[#080c14] text-white overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
        
        {/* DESKTOP & MOBILE SIDEBAR */}
        {!isAuthPage && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-[#0b0f19]/90 border-r border-gray-800/80 backdrop-blur-xl z-50 justify-between shrink-0">
              <div className="flex flex-col h-full overflow-hidden">
                {/* APN Header + User Profile Card */}
                <div className="p-5 border-b border-gray-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-blue-500 tracking-wider flex items-center gap-2">
                        ⚡ APN
                      </h1>
                      <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
                        Alpha Proficiency Network
                      </p>
                    </div>
                  </div>

                  {/* USER AVATAR & EDIT PROFILE QUICK ACCESS */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/60 transition-all group cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="User Avatar"
                          className="w-10 h-10 rounded-xl object-cover border border-blue-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-white text-sm border border-blue-400/30">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0b0f19] rounded-full"></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {user?.name || "Node Validator"}
                      </p>
                      <span className="text-[10px] text-blue-400/80 group-hover:underline flex items-center gap-1">
                        ✏️ Edit Profile
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        pathname === item.path
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-950/40'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Privacy & Decentralized Footer Links */}
                <div className="px-4 py-2 text-center text-[10px] text-gray-500 flex items-center justify-center gap-2 border-t border-gray-800/40">
                  <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <span>v1.0 Mainnet</span>
                </div>

                {/* Desktop Logout Button */}
                <div className="p-4 border-t border-gray-800/80">
                  <button
                    onClick={handleGlobalLogout}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-600/20 to-red-900/30 hover:from-red-600 hover:to-red-700 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-[#0b0f19]/95 border-b border-gray-800 z-50 shrink-0">
              <div className="flex items-center gap-3">
                <Link href="/profile" className="relative shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-9 h-9 rounded-xl object-cover border border-blue-500/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-white text-xs border border-blue-400/30">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </Link>
                <div>
                  <h1 className="text-lg font-black text-blue-500 tracking-wider leading-none">⚡ APN</h1>
                  <Link href="/profile" className="text-[10px] text-gray-400 hover:text-blue-400 flex items-center gap-1 mt-0.5">
                    ✏️ Edit Profile
                  </Link>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white text-2xl focus:outline-none"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </header>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-[65px] bg-[#0b0f19]/98 z-40 p-6 flex flex-col justify-between backdrop-blur-2xl overflow-y-auto">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-3.5 rounded-xl text-sm font-bold flex items-center transition-all ${
                        pathname === item.path
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                          : 'text-gray-300 bg-gray-900/60 border border-gray-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="pt-6 space-y-4">
                  <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-3">
                    <Link href="/privacy-policy" onClick={() => setIsMobileMenuOpen(false)} className="underline">
                      Privacy Policy
                    </Link>
                  </div>

                  {/* Mobile Logout Button */}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleGlobalLogout();
                    }}
                    className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MAIN CONTENT CONTAINER */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}