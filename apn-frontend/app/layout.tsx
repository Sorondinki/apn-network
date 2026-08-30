"use client";

import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const isAuthPage = pathname === '/register' || pathname === '/login' || pathname === '/';

  // Security Engine: Prevent context menu & common dev shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.ctrlKey && ["U", "u"].includes(e.key))
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

  // Hydration sync & session retrieval
  useEffect(() => {
    setIsMounted(true);
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

  const baseNavItems = [
    { name: '⛏️ Web Mining', path: '/dashboard' },
    { name: '🏛️ Synthetic Vault', path: '/synthetic-vault' },
    { name: '💳 Wallet & Withdraw', path: '/wallet' },
    { name: '📜 Transactions', path: '/transactions' },
    { name: '🔒 Staking Vault', path: '/staking' },
    { name: '🎯 Quests & Ads', path: '/tasks' },
    { name: '🌐 Explorer', path: '/explorer' },
    { name: '🎁 Referrals', path: '/referral' },
    { name: '🛡️ KYC', path: '/kyc' },
  ];

  // Gyara ta hanyar duba Email din Admin da duk nau'in Admin Roles
  const adminEmails = ["contact.aprotech@gmail.com"];
  const userRoleUpper = user?.role ? user.role.toString().toUpperCase() : "";

  const isAdmin =
    (user?.email && adminEmails.includes(user.email.toLowerCase())) ||
    userRoleUpper === "ADMIN" ||
    userRoleUpper === "FOUNDER" ||
    userRoleUpper === "GLOBAL ADMIN" ||
    userRoleUpper.includes("ADMIN");

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Alpha Proficiency Network - APN Protocol</title>

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APN Network" />
        <link rel="apple-touch-icon" href="/images/apn-network192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/images/apn-token512x512.png" />
      </head>
      <body className="flex flex-col md:flex-row min-h-screen md:h-screen w-full bg-[#080c14] text-white font-sans selection:bg-blue-600 selection:text-white select-none">
        
        {isMounted && !isAuthPage && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-[#0b0f19]/90 border-r border-gray-800/80 backdrop-blur-xl z-50 justify-between shrink-0 h-full">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-gray-800/80 space-y-4">
                  <Link href="/dashboard" className="flex items-center gap-3">
                    <Image 
                      src="/images/apn-network192x192.png" 
                      alt="APN Network Logo" 
                      width={36} 
                      height={36} 
                      className="object-contain rounded-lg"
                    />
                    <div>
                      <h1 className="text-xl font-black text-blue-500 tracking-wider flex items-center gap-1 leading-none">
                        APN <span className="text-white">NETWORK</span>
                      </h1>
                      <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest mt-1">
                        Protocol Mainnet
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-2 rounded-xl border border-gray-800/80">
                    <Image 
                      src="/images/apn-token512x512.png" 
                      alt="APN Token" 
                      width={22} 
                      height={22} 
                      className="object-contain"
                    />
                    <span className="text-xs font-semibold text-amber-400">APN Token</span>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/60 transition-all group cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="User Avatar"
                          className="w-9 h-9 rounded-xl object-cover border border-blue-500/40"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-white text-sm border border-blue-400/30">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0b0f19] rounded-full"></span>
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

                <div className="p-4 border-t border-gray-800/80 space-y-3">
                  <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-2">
                    <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link href="/roadmap" className="hover:text-blue-400 transition-colors">
                      Roadmap
                    </Link>
                    <span>•</span>
                    <Link href="/whitepaper" className="hover:text-blue-400 transition-colors">
                      Whitepaper
                    </Link>
                    <span>•</span>
                    <span>v1.0 Mainnet</span>
                  </div>

                  <button
                    onClick={handleGlobalLogout}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600/20 to-red-900/30 hover:from-red-600 hover:to-red-700 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-[#0b0f19]/95 border-b border-gray-800 z-50 shrink-0 sticky top-0 backdrop-blur-md">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image 
                  src="/images/apn-network192x192.png" 
                  alt="APN Logo" 
                  width={30} 
                  height={30} 
                  className="object-contain rounded-md"
                />
                <span className="text-base font-black text-blue-500 tracking-wider">APN</span>
              </Link>

              <div className="flex items-center gap-1.5 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                <Image 
                  src="/images/apn-token512x512.png" 
                  alt="APN Token" 
                  width={18} 
                  height={18} 
                  className="object-contain"
                />
                <span className="text-xs font-bold text-amber-400">APN</span>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white text-xl focus:outline-none"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </header>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-[60px] bg-[#0b0f19]/98 z-40 p-6 flex flex-col justify-between backdrop-blur-2xl overflow-y-auto">
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-gray-900 border border-gray-800"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{user?.name || "Node Validator"}</p>
                      <span className="text-[10px] text-blue-400">✏️ Edit Profile</span>
                    </div>
                  </Link>

                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center transition-all ${
                        pathname === item.path
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                          : 'text-gray-300 bg-gray-900/60 border border-gray-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Additional Pages for Mobile (Roadmap, Whitepaper, Privacy Policy) */}
                <div className="pt-6 space-y-3 border-t border-gray-800/80 mt-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-gray-400">
                    <Link 
                      href="/roadmap" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-gray-900/80 rounded-lg border border-gray-800 hover:text-blue-400"
                    >
                      🗺️ Roadmap
                    </Link>
                    <Link 
                      href="/whitepaper" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-gray-900/80 rounded-lg border border-gray-800 hover:text-blue-400"
                    >
                      📄 Whitepaper
                    </Link>
                    <Link 
                      href="/privacy-policy" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 bg-gray-900/80 rounded-lg border border-gray-800 hover:text-blue-400"
                    >
                      🛡️ Privacy
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleGlobalLogout();
                    }}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}