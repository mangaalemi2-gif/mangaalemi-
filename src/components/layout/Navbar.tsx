"use client";
import Link from "next/link";
import { BookOpen, Search, User, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

interface UserData {
  id: string;
  username: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as any;
          setUser(data.user);
        }
      } catch {
        // Giriş yapılmamış
      }
    }
    checkAuth();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <BookOpen className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" />
              <span className="font-bold text-2xl tracking-tight text-white">
                Manga<span className="text-primary group-hover:text-accent transition-colors duration-300">Alemi</span>
              </span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full bg-surface-light text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all duration-300"
                placeholder="Manga veya Webtoon ara..."
              />
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full bg-primary text-black font-semibold text-sm hover:bg-white transition-colors shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-white/5 pt-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-surface-light transition-all"
                >
                  <User className="w-5 h-5" /> {user.username}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-surface-light transition-all w-full text-left"
                >
                  <LogOut className="w-5 h-5" /> Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-surface-light transition-all"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-xl text-primary font-bold hover:bg-surface-light transition-all"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
