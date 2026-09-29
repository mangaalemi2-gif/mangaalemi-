"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, BookOpen, LogOut, Shield, Clock } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  badge: string | null;
  createdAt: string | null;
}

interface ReadingEntry {
  id: string;
  mangaSlug: string;
  chapterNumber: number;
  pageNumber: number;
  updatedAt: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [history, setHistory] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, historyRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/reading-history"),
        ]);

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const meData = (await meRes.json()) as any;
        setUser(meData.user);

        const historyData = (await historyRes.json()) as any;
        setHistory(historyData.history || []);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function getMangaTitle(slug: string): string {
    const titles: Record<string, string> = {
      "dragon-ball-1984": "Dragon Ball",
    };
    return titles[slug] || slug;
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profil Başlığı */}
      <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-extrabold text-black shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            {user.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-white">{user.username}</h1>
              {user.role === "admin" && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
              {user.badge && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full border border-accent/30">
                  {user.badge}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          <div className="flex gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all flex items-center gap-2"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-surface-light border border-white/10 text-gray-300 text-sm font-medium hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Okuma Geçmişi */}
      <div className="glass-panel rounded-3xl p-8 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-bold text-white">Okuma Geçmişin</h2>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Henüz bir manga okumadın.</p>
            <Link
              href="/manga/dragon-ball-1984"
              className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform"
            >
              Okumaya Başla
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((entry) => (
              <Link
                key={entry.id}
                href={`/manga/${entry.mangaSlug}/${entry.chapterNumber}`}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 hover:bg-surface-light border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-16 rounded-lg bg-surface overflow-hidden flex-shrink-0">
                    <img
                      src={`/mangas/${entry.mangaSlug}/Chapter1/1.jpg`}
                      alt={getMangaTitle(entry.mangaSlug)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                      {getMangaTitle(entry.mangaSlug)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Bölüm {entry.chapterNumber} • Sayfa {entry.pageNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    Devam Et →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
