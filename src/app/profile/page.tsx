"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, BookOpen, LogOut, Shield, MessageSquare, BarChart3, LifeBuoy, Settings, Save, ThumbsUp, Heart, Trophy } from "lucide-react";
import mangaManifest from "@/data/manga-manifest.json";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  badge: string | null;
  createdAt: any;
}

interface Stats {
  commentCount: number;
  likesReceived: number;
  likesGiven: number;
  pollCount: number;
  votesGiven: number;
  ticketCount: number;
}

interface ReadingEntry {
  id: string;
  mangaSlug: string;
  chapterNumber: number;
  pageNumber: number;
  updatedAt: string | null;
}

interface MyComment {
  id: string;
  content: string;
  context: string;
  slug: string | null;
  chapter: string | null;
  createdAt: any;
  likeCount: number;
}

type Tab = "overview" | "history" | "favorites" | "comments" | "stats" | "settings";

interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  progress: number;
  nextXp: number | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<ReadingEntry[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [seriesFollows, setSeriesFollows] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  // form
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, profileRes, historyRes, commentsRes, ticketsRes, favRes, sfRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/profile"),
          fetch("/api/reading-history"),
          fetch("/api/comments?mine=1"),
          fetch("/api/support"),
          fetch("/api/favorites"),
          fetch("/api/series-follow"),
        ]);

        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = (await meRes.json()) as any;
        setUser(meData.user);

        if (profileRes.ok) {
          const p = (await profileRes.json()) as any;
          if (p.user) {
            setUser(p.user);
            setBio(p.user.bio || "");
            setAvatarUrl(p.user.avatarUrl || "");
            setUsername(p.user.username || "");
          }
          setStats(p.stats || null);
          if (typeof p.xp === "number") {
            setXp(p.xp);
            setLevel({ level: p.level.level, title: p.level.title, xp: p.xp, progress: p.level.progress, nextXp: p.level.nextXp });
          }
        } else {
          setBio(meData.user?.bio || "");
          setAvatarUrl(meData.user?.avatarUrl || "");
          setUsername(meData.user?.username || "");
        }

        if (historyRes.ok) {
          const h = (await historyRes.json()) as any;
          setHistory(h.history || []);
        }
        if (commentsRes.ok) {
          const c = (await commentsRes.json()) as any;
          setMyComments(c.comments || []);
        }
        if (ticketsRes.ok) {
          const t = (await ticketsRes.json()) as any;
          setMyTickets(t.tickets || []);
        }
        if (favRes.ok) {
          const f = (await favRes.json()) as any;
          setFavorites(f.favorites || []);
        }
        if (sfRes.ok) {
          const s = (await sfRes.json()) as any;
          setSeriesFollows(s.follows || []);
        }
      } catch {
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveMsg("");
    setSaveErr("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, avatarUrl, username }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        setSaveErr(data.error || "Kaydedilemedi.");
        return;
      }
      setSaveMsg("✓ Profil güncellendi!");
      // güncel kullanıcıyı yeniden çek
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = (await meRes.json()) as any;
        // /api/profile bio döndürmediği için me + form birleştir
        const pRes = await fetch("/api/profile");
        if (pRes.ok) {
          const p = (await pRes.json()) as any;
          setUser(p.user);
        } else {
          setUser(meData.user);
        }
      }
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaveMsg("");
    setSaveErr("");
    if (!curPass || !newPass) {
      setSaveErr("Mevcut ve yeni şifreyi gir.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        setSaveErr(data.error || "Şifre değiştirilemedi.");
        return;
      }
      setSaveMsg("✓ Şifren değiştirildi!");
      setCurPass("");
      setNewPass("");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteComment(id: string) {
    if (!confirm("Yorum silinsin mi?")) return;
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setMyComments((prev) => prev.filter((c) => c.id !== id));
  }

  function getMangaTitle(slug: string): string {
    const titles: Record<string, string> = {
      "dragon-ball-1984": "Dragon Ball",
      "chainsaw-man": "Chainsaw Man",
      "demon-slayer": "Demon Slayer",
      naruto: "Naruto",
    };
    return titles[slug] || slug;
  }

  function chapterPages(slug: string, ch: number): number {
    const arr = (mangaManifest as Record<string, string[]>)[`${slug}/Chapter${ch}`];
    return arr ? arr.length : 0;
  }

  function toMs(v: any): number {
    if (!v) return 0;
    if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
    const t = new Date(v).getTime();
    return isNaN(t) ? 0 : t;
  }

  function readingStats() {
    let chapters = 0;
    let pages = 0;
    let best = { slug: "", pages: 0 };
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return { date: d, count: 0 };
    });
    for (const h of history) {
      chapters += h.chapterNumber;
      let p = 0;
      for (let i = 1; i < h.chapterNumber; i++) p += chapterPages(h.mangaSlug, i);
      p += Math.min(h.pageNumber, chapterPages(h.mangaSlug, h.chapterNumber) || h.pageNumber);
      pages += p;
      if (p > best.pages) best = { slug: h.mangaSlug, pages: p };
      const t = toMs(h.updatedAt);
      if (t > 0) {
        const day = new Date(t);
        day.setHours(0, 0, 0, 0);
        const idx = days.findIndex((d) => d.date.getTime() === day.getTime());
        if (idx >= 0) days[idx].count += 1;
      }
    }
    return { series: history.length, chapters, pages, best, days, maxDay: Math.max(1, ...days.map((d) => d.count)) };
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Genel Bakış", icon: User },
    { key: "history", label: "Okuma Geçmişi", icon: BookOpen },
    { key: "favorites", label: `Favoriler (${favorites.length})`, icon: Heart },
    { key: "comments", label: `Yorumlarım (${myComments.length})`, icon: MessageSquare },
    { key: "stats", label: "İstatistikler", icon: BarChart3 },
    { key: "settings", label: "Profil Ayarları", icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Profil Başlığı */}
      <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-24 h-24 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_30px_rgba(57,255,20,0.2)]" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-extrabold text-black shadow-[0_0_30px_rgba(57,255,20,0.3)]">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
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
            {user.bio && <p className="text-gray-300 text-sm mt-2 max-w-lg">{user.bio}</p>}
            {level && (
              <div className="mt-3 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-primary flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Sv. {level.level} • {level.title}</span>
                  <span className="text-gray-500">{xp} XP{level.nextXp ? ` / ${level.nextXp}` : " (MAX)"}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${Math.round(level.progress * 100)}%` }} />
                </div>
              </div>
            )}
            {stats && (
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {stats.commentCount} yorum</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {stats.likesReceived} beğeni</span>
                <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {stats.pollCount} anket</span>
                <span className="flex items-center gap-1"><LifeBuoy className="w-3.5 h-3.5" /> {stats.ticketCount} destek</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
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

      {/* Sekmeler */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              tab === t.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-surface-light/50 text-gray-400 border border-white/5 hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-3">Hızlı Erişim</h3>
            <div className="grid gap-2">
              <Link href="/sohbet" className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-primary/30 text-sm text-gray-200 transition-all">💬 Genel Sohbete Katıl</Link>
              <Link href="/anketler" className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-accent/40 text-sm text-gray-200 transition-all">📊 Anketlere Oy Ver</Link>
              <Link href="/ara" className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-accent/40 text-sm text-gray-200 transition-all">🔍 Manga Keşfet</Link>
              <Link href="/liderlik" className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-yellow-500/30 text-sm text-gray-200 transition-all">🏆 Liderlik Tablosu</Link>
              <Link href="/destek" className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-yellow-500/30 text-sm text-gray-200 transition-all">🛟 Destek Talebi Oluştur</Link>
              <Link href={`/kullanici/${encodeURIComponent(user.username)}`} className="p-3 rounded-xl bg-surface-light/50 border border-white/5 hover:border-white/20 text-sm text-gray-200 transition-all">👁 Herkese Açık Profilini Gör</Link>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-3">Destek Taleplerim</h3>
            {myTickets.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz talebin yok. <Link href="/destek" className="text-primary hover:underline">Oluştur</Link></p>
            ) : (
              <div className="space-y-2">
                {myTickets.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="text-sm bg-surface-light/40 border border-white/5 rounded-xl p-3">
                    <p className="text-white font-medium">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">Durum: {t.status}</p>
                  </div>
                ))}
                <Link href="/destek" className="text-xs text-primary hover:underline">Tümünü gör →</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="glass-panel rounded-3xl p-8 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold text-white">Okuma Geçmişin</h2>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Henüz bir manga okumadın.</p>
              <Link href="/manga/dragon-ball-1984" className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform">
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
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                        {getMangaTitle(entry.mangaSlug)}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Bölüm {entry.chapterNumber} • Sayfa {entry.pageNumber}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    Devam Et →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "favorites" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/10">
            <h2 className="font-bold text-white mb-4">Favori Serilerin ({favorites.length})</h2>
            {favorites.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz favorin yok. Manga sayfalarındaki kalp butonuyla ekle. <Link href="/ara" className="text-primary hover:underline">Keşfet</Link></p>
            ) : (
              <div className="grid gap-3">
                {favorites.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 border border-white/5">
                    <Link href={`/manga/${f.mangaSlug}`} className="font-semibold text-white hover:text-primary transition-colors">
                      {getMangaTitle(f.mangaSlug)}
                    </Link>
                    <Link href={`/manga/${f.mangaSlug}/1`} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                      Oku →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass-panel rounded-3xl p-6 border border-white/10">
            <h2 className="font-bold text-white mb-4">Takip Edilen Seriler ({seriesFollows.length})</h2>
            <p className="text-xs text-gray-500 mb-3">Yeni bölüm eklenince bildirim alırsın.</p>
            {seriesFollows.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz seri takip etmiyorsun.</p>
            ) : (
              <div className="grid gap-3">
                {seriesFollows.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 border border-white/5">
                    <Link href={`/manga/${f.mangaSlug}`} className="font-semibold text-white hover:text-primary transition-colors">
                      {getMangaTitle(f.mangaSlug)}
                    </Link>
                    <Link href={`/manga/${f.mangaSlug}/1`} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                      Oku →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
          <h2 className="font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent" /> Okuma İstatistiklerin</h2>
          {(() => {
            const s = readingStats();
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Okunan Seri", value: s.series },
                    { label: "Okunan Bölüm", value: s.chapters },
                    { label: "Okunan Sayfa", value: s.pages.toLocaleString("tr-TR") },
                    { label: "Yorum", value: stats?.commentCount ?? myComments.length },
                  ].map((c) => (
                    <div key={c.label} className="bg-surface-light/40 border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-white">{c.value}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>
                {s.best.slug && (
                  <p className="text-sm text-gray-400">En çok okuduğun seri: <Link href={`/manga/${s.best.slug}`} className="text-primary font-bold hover:underline">{getMangaTitle(s.best.slug)}</Link> ({s.best.pages.toLocaleString("tr-TR")} sayfa)</p>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Son 7 gün aktivitesi</p>
                  <div className="flex items-end gap-2 h-24">
                    {s.days.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-accent/60 min-h-[4px]"
                          style={{ height: `${Math.max(4, (d.count / s.maxDay) * 80)}px` }}
                          title={`${d.count} aktivite`}
                        />
                        <span className="text-[10px] text-gray-600">{d.date.toLocaleDateString("tr-TR", { weekday: "narrow" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab === "comments" && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <h2 className="font-bold text-white mb-4">Yorumların ({myComments.length})</h2>
          {myComments.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz yorum yazmamışsın. <Link href="/sohbet" className="text-primary hover:underline">Sohbete katıl</Link></p>
          ) : (
            <div className="space-y-3">
              {myComments.map((c) => (
                <div key={c.id} className="bg-surface-light/40 border border-white/5 rounded-xl p-4">
                  <p className="text-gray-200 text-sm">{c.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {c.context === "chat" ? "Genel Sohbet" : c.context === "feedback" ? "Öneri" : c.context === "manga" ? `Manga: ${c.slug}` : `${c.slug} / Bölüm ${c.chapter}`} • {c.likeCount} beğeni
                    </p>
                    <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-gray-600 hover:text-red-400">Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="font-bold text-white">Profil Bilgileri</h2>
            <div>
              <label className="text-xs text-gray-400">Kullanıcı adı</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} className="mt-1 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Biyografi (max 500)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} placeholder="Kendini tanıt..." className="mt-1 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Avatar URL (https://...)</label>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50" />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>

          <form onSubmit={handleChangePassword} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="font-bold text-white">Şifre Değiştir</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="Mevcut şifre" className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50" />
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Yeni şifre (min 6)" className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50" />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-surface-light border border-white/10 text-sm text-white hover:border-primary/40 transition-colors disabled:opacity-50">
              Şifreyi Güncelle
            </button>
          </form>

          {saveErr && <p className="text-red-400 text-sm">{saveErr}</p>}
          {saveMsg && <p className="text-primary text-sm font-medium">{saveMsg}</p>}
        </div>
      )}
    </div>
  );
}
