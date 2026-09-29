"use client";
import Link from "next/link";
import { BookOpen, Search, User, Menu, LogOut, MessagesSquare, BarChart3, LifeBuoy, Compass, Trophy, Mail, BookPlus } from "lucide-react";
import { useState, useEffect } from "react";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

interface UserData {
  id: string;
  username: string;
  role: string;
}

const NAV_LINKS = [
  { href: "/ara", label: "Keşfet", icon: Compass },
  { href: "/sohbet", label: "Sohbet", icon: MessagesSquare },
  { href: "/anketler", label: "Anketler", icon: BarChart3 },
  { href: "/liderlik", label: "Liderlik", icon: Trophy },
  { href: "/seri-oner", label: "Seri Öner", icon: BookPlus },
  { href: "/destek", label: "Destek", icon: LifeBuoy },
];

function MessagesIcon() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/messages?unread=1");
        if (res.ok && alive) {
          const data = (await res.json()) as any;
          setUnread(data.unread || 0);
        }
      } catch { /* yoksay */ }
    }
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return (
    <Link href="/mesajlar" className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-surface-light transition-all" title="Mesajlar">
      <Mail className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center keep-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
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
          <div className="flex-shrink-0 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <BookOpen className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" />
              <span className="font-bold text-2xl tracking-tight text-white">
                Manga<span className="text-primary group-hover:text-accent transition-colors duration-300">Alemi</span>
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-surface-light transition-all flex items-center gap-1.5"
                >
                  <l.icon className="w-4 h-4" /> {l.label}
                </Link>
              ))}
            </div>
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
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user && <MessagesIcon />}
            {user && <NotificationsBell />}
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
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            {user && <MessagesIcon />}
            {user && <NotificationsBell />}
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
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-surface-light transition-all"
              >
                <l.icon className="w-5 h-5" /> {l.label}
              </Link>
            ))}
            <div className="border-t border-white/5 pt-2 space-y-2">
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
          </div>
        )}
      </div>
    </nav>
  );
}
