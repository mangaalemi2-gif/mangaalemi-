"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, BookOpen, BarChart3, ArrowLeft, Eye } from "lucide-react";
import mangaManifest from "@/data/manga-manifest.json";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "mangas" | "users">("overview");
  const router = useRouter();

  // Manifest'ten manga ve bölüm bilgilerini çıkar
  const mangaData = Object.entries(mangaManifest as Record<string, string[]>);
  const mangaSlugs = [...new Set(mangaData.map(([key]) => key.split("/")[0]))];
  const totalChapters = mangaData.length;
  const totalPages = mangaData.reduce((sum, [, pages]) => sum + pages.length, 0);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.user.role !== "admin") {
          router.push("/");
          return;
        }
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Yetki kontrol ediliyor...</div>
      </div>
    );
  }

  if (!user) return null;

  function getChaptersBySlug(slug: string) {
    return mangaData
      .filter(([key]) => key.startsWith(slug + "/"))
      .map(([key, pages]) => ({
        name: key.split("/")[1],
        pageCount: pages.length,
      }))
      .sort((a, b) => {
        const numA = parseInt(a.name.replace("Chapter", ""));
        const numB = parseInt(b.name.replace("Chapter", ""));
        return numA - numB;
      });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Admin Üst Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-red-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">Hoş geldin, {user.username}</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 rounded-xl bg-surface-light border border-white/10 text-gray-300 text-sm font-medium hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Profil
          </Link>
        </div>
      </div>

      {/* Tab Navigasyonu */}
      <div className="flex gap-2">
        {[
          { key: "overview" as const, label: "Genel Bakış", icon: BarChart3 },
          { key: "mangas" as const, label: "Mangalar", icon: BookOpen },
          { key: "users" as const, label: "Kullanıcılar", icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-surface-light/50 text-gray-400 border border-white/5 hover:text-white hover:border-white/10"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Genel Bakış */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm text-gray-400 font-medium">Toplam Manga</span>
            </div>
            <p className="text-4xl font-extrabold text-white">{mangaSlugs.length}</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="w-5 h-5 text-accent" />
              <span className="text-sm text-gray-400 font-medium">Toplam Bölüm</span>
            </div>
            <p className="text-4xl font-extrabold text-white">{totalChapters}</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400 font-medium">Toplam Sayfa</span>
            </div>
            <p className="text-4xl font-extrabold text-white">{totalPages}</p>
          </div>
        </div>
      )}

      {/* Manga Listesi */}
      {activeTab === "mangas" && (
        <div className="space-y-6">
          {mangaSlugs.map((slug) => {
            const chapters = getChaptersBySlug(slug);
            return (
              <div key={slug} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-20 rounded-lg overflow-hidden bg-surface-light flex-shrink-0">
                      <img
                        src={`/mangas/${slug}/Chapter1/1.jpg`}
                        alt={slug}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {slug === "dragon-ball-1984" ? "Dragon Ball" : slug}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {chapters.length} Bölüm • {chapters.reduce((s, c) => s + c.pageCount, 0)} Sayfa
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
                    Aktif
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.name}
                      href={`/manga/${slug}/${ch.name.replace("Chapter", "")}`}
                      className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-primary/30 transition-all group text-center"
                    >
                      <p className="font-bold text-white group-hover:text-primary transition-colors text-sm">
                        {ch.name.replace("Chapter", "Bölüm ")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{ch.pageCount} sayfa</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kullanıcılar (şimdilik bilgilendirme) */}
      {activeTab === "users" && (
        <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Kullanıcı Yönetimi</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            D1 veritabanı bağlandığında burada kayıtlı kullanıcıları görebilecek, rol atayabilecek ve hesapları yönetebileceksiniz.
          </p>
        </div>
      )}
    </div>
  );
}
