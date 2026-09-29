"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, BookOpen, BarChart3, ArrowLeft, Eye, MessageSquare, LifeBuoy, Flag, Trash2, Megaphone, Send, Ban, Pin, PinOff, BellPlus, BookPlus } from "lucide-react";
import mangaManifest from "@/data/manga-manifest.json";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
}

type Tab = "overview" | "mangas" | "users" | "comments" | "tickets" | "reports" | "polls" | "announcements" | "requests";

export default function AdminPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annMsg, setAnnMsg] = useState("");
  const [annSending, setAnnSending] = useState(false);
  const [bans, setBans] = useState<any[]>([]);
  const [ncSlug, setNcSlug] = useState("");
  const [ncChapter, setNcChapter] = useState("");
  const [ncSending, setNcSending] = useState(false);
  const [ncResult, setNcResult] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [siteStats, setSiteStats] = useState<any | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const router = useRouter();

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
        const data = await res.json() as { user: UserData };
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

  async function loadTab(tab: Tab) {
    setTabLoading(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const d = (await res.json()) as any;
          setSiteStats(d);
        }
      }
      if (tab === "users") {
        const [uRes, bRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/bans")]);
        if (uRes.ok) {
          const d = (await uRes.json()) as any;
          setUsers(d.users || []);
        }
        if (bRes.ok) {
          const d = (await bRes.json()) as any;
          setBans(d.bans || []);
        }
      } else if (tab === "comments") {
        const res = await fetch("/api/comments?all=1");
        if (res.ok) {
          const d = (await res.json()) as any;
          setComments(d.comments || []);
        }
      } else if (tab === "tickets") {
        const res = await fetch("/api/support?all=1");
        if (res.ok) {
          const d = (await res.json()) as any;
          setTickets(d.tickets || []);
        }
      } else if (tab === "reports") {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const d = (await res.json()) as any;
          setReports(d.reports || []);
        }
      } else if (tab === "polls") {
        const res = await fetch("/api/polls");
        if (res.ok) {
          const d = (await res.json()) as any;
          setPolls(d.polls || []);
        }
      } else if (tab === "announcements") {
        const res = await fetch("/api/admin/announcements");
        if (res.ok) {
          const d = (await res.json()) as any;
          setAnnouncements(d.announcements || []);
        }
      } else if (tab === "requests") {
        const res = await fetch("/api/series-requests?all=1");
        if (res.ok) {
          const d = (await res.json()) as any;
          setRequests(d.requests || []);
        }
      }
    } finally {
      setTabLoading(false);
    }
  }

  useEffect(() => {
    if (user && ["overview", "users", "comments", "tickets", "reports", "polls", "announcements", "requests"].includes(activeTab)) {
      loadTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

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

  async function updateUserRole(id: string, role: string) {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  async function deleteUser(id: string) {
    if (!confirm("Kullanıcı silinsin mi? Yorumları ve oyları da silinir!")) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else alert("Silinemedi (kendini silemezsin).");
  }

  async function banUser(userId: string, username: string) {
    const reason = prompt(`${username} neden banlanıyor?`);
    if (!reason?.trim()) return;
    const daysStr = prompt("Kaç gün? (boş bırak = süresiz)", "7");
    const days = daysStr?.trim() ? parseInt(daysStr) : null;
    const res = await fetch("/api/admin/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason: reason.trim(), days: days && !isNaN(days) ? days : null }),
    });
    if (res.ok) loadTab("users");
    else alert("Banlanamadı.");
  }

  async function unban(id: string) {
    await fetch(`/api/admin/bans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBans((prev) => prev.filter((b) => b.id !== id));
  }

  async function togglePin(id: string, pinned: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    });
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isPinned: !pinned } : a)));
  }

  async function sendNewChapter(e: React.FormEvent) {
    e.preventDefault();
    setNcResult("");
    if (!ncSlug.trim() || !ncChapter.trim() || ncSending) return;
    setNcSending(true);
    try {
      const res = await fetch("/api/admin/new-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug: ncSlug.trim(), chapter: ncChapter.trim() }),
      });
      const data = (await res.json()) as any;
      if (res.ok) {
        setNcResult(`✓ Duyuruldu, ${data.notified} takipçiye bildirim gitti.`);
        setNcSlug("");
        setNcChapter("");
      } else {
        setNcResult(data.error || "Gönderilemedi.");
      }
    } finally {
      setNcSending(false);
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("Yorum silinsin mi?")) return;
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function updateTicket(id: string, status: string) {
    await fetch("/api/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function updateReport(id: string, status: string) {
    await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function deletePoll(id: string) {
    if (!confirm("Anket silinsin mi?")) return;
    await fetch(`/api/polls?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setPolls((prev) => prev.filter((p) => p.id !== id));
  }

  async function updateRequest(id: string, status: string, adminNote?: string) {
    const note = adminNote !== undefined ? adminNote : prompt("Admin notu (opsiyonel):") || "";
    await fetch("/api/series-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNote: note }),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, adminNote: note || r.adminNote } : r)));
  }

  async function sendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annMsg.trim() || annSending) return;
    setAnnSending(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle.trim(), message: annMsg.trim() }),
      });
      if (res.ok) {
        setAnnTitle("");
        setAnnMsg("");
        loadTab("announcements");
      }
    } finally {
      setAnnSending(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Genel Bakış", icon: BarChart3 },
    { key: "mangas", label: "Mangalar", icon: BookOpen },
    { key: "users", label: `Kullanıcılar (${users.length || ""})`, icon: Users },
    { key: "comments", label: "Yorumlar", icon: MessageSquare },
    { key: "tickets", label: `Destek (${tickets.length || ""})`, icon: LifeBuoy },
    { key: "reports", label: `Bildirimler (${reports.length || ""})`, icon: Flag },
    { key: "polls", label: "Anketler", icon: BarChart3 },
    { key: "announcements", label: "Duyurular", icon: Megaphone },
    { key: "requests", label: `Seri Talepleri (${requests.length || ""})`, icon: BookPlus },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
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

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.key
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-surface-light/50 text-gray-400 border border-white/5 hover:text-white hover:border-white/10"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
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

          {siteStats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Üye", value: siteStats.totals.users },
                  { label: "Yorum", value: siteStats.totals.comments },
                  { label: "Özel Mesaj", value: siteStats.totals.messages },
                  { label: "Anket / Oy", value: `${siteStats.totals.polls} / ${siteStats.totals.votes}` },
                  { label: "Favori", value: siteStats.totals.favorites },
                  { label: "Puan", value: siteStats.totals.ratings },
                  { label: "Açık Destek", value: siteStats.totals.openTickets },
                  { label: "Bekleyen Bildirim", value: siteStats.totals.pendingReports },
                ].map((c) => (
                  <div key={c.label} className="glass-panel rounded-2xl p-4 border border-white/10 text-center">
                    <p className="text-2xl font-extrabold text-white">{c.value}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: "users" as const, label: "Son 14 gün: yeni üyeler", color: "from-primary/70 to-primary/30" },
                  { key: "comments" as const, label: "Son 14 gün: yorumlar", color: "from-accent/70 to-accent/30" },
                ].map((g) => {
                  const max = Math.max(1, ...siteStats.days.map((d: any) => d[g.key]));
                  return (
                    <div key={g.key} className="glass-panel rounded-2xl p-5 border border-white/10">
                      <p className="text-xs text-gray-400 mb-3">{g.label}</p>
                      <div className="flex items-end gap-1 h-28">
                        {siteStats.days.map((d: any) => (
                          <div
                            key={d.day}
                            className={`flex-1 rounded-t bg-gradient-to-t ${g.color} min-h-[3px]`}
                            style={{ height: `${Math.max(3, (d[g.key] / max) * 100)}%` }}
                            title={`${d.day}: ${d[g.key]}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                        <span>{siteStats.days[0]?.day.slice(5)}</span>
                        <span>{siteStats.days[13]?.day.slice(5)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm animate-pulse">İstatistikler yükleniyor...</p>
          )}
        </div>
      )}

      {activeTab === "mangas" && (
        <div className="space-y-6">
          {mangaSlugs.map((slug) => {
            const chapters = getChaptersBySlug(slug);
            return (
              <div key={slug} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{slug}</h3>
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

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-4">Kayıtlı Kullanıcılar ({users.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : users.length === 0 ? <p className="text-gray-500 text-sm">Kullanıcı bulunamadı.</p> : (
            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-light/40 border border-white/5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-white text-sm">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.username} <span className="text-xs text-gray-500">{u.email}</span></p>
                      <p className="text-[11px] text-gray-500">{u.role}{u.badge ? ` • ${u.badge}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} className="bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                      <option value="member">member</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                    <button onClick={() => banUser(u.id, u.username)} className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20" title="Uzaklaştır (ban)">
                      <Ban className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20" title="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          <div className="glass-panel rounded-2xl p-6 border border-yellow-500/15">
            <h3 className="font-bold text-white mb-4">Aktif Uzaklaştırmalar ({bans.length})</h3>
            {bans.length === 0 ? (
              <p className="text-gray-500 text-sm">Banlı kullanıcı yok.</p>
            ) : (
              <div className="space-y-2">
                {bans.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-light/40 border border-white/5 flex-wrap">
                    <div>
                      <p className="text-sm text-white font-medium">@{b.username || "?"} <span className="text-xs text-gray-500">— {b.reason}</span></p>
                      <p className="text-[11px] text-gray-500">
                        {b.expiresAt ? `Bitiş: ${new Date(typeof b.expiresAt === "number" ? b.expiresAt * 1000 : b.expiresAt).toLocaleDateString("tr-TR")}` : "Süresiz"}
                      </p>
                    </div>
                    <button onClick={() => unban(b.id)} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/20">
                      Kaldır
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Son Yorumlar ({comments.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : comments.length === 0 ? <p className="text-gray-500 text-sm">Yorum yok — kullanıcılar yazdıkça burada birikir.</p> : (
            <div className="space-y-2">
              {comments.map((c: any) => (
                <div key={c.id} className="p-3 rounded-xl bg-surface-light/40 border border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">@{c.username || "?"} • {c.context}{c.slug ? ` • ${c.slug}` : ""}{c.chapter ? `/${c.chapter}` : ""} • {c.likeCount} beğeni</p>
                    <button onClick={() => deleteComment(c.id)} className="text-gray-600 hover:text-red-400" title="Sil"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-gray-200 mt-1">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Destek Talepleri ({tickets.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : tickets.length === 0 ? <p className="text-gray-500 text-sm">Talep yok.</p> : (
            <div className="space-y-3">
              {tickets.map((t: any) => (
                <div key={t.id} className="p-4 rounded-xl bg-surface-light/40 border border-white/5">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{t.subject} <span className="text-xs text-gray-500">— @{t.username || t.email || "misafir"}</span></p>
                    <select value={t.status} onChange={(e) => updateTicket(t.id, e.target.value)} className="bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-400">{t.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Kullanıcı / Mesaj Bildirimleri ({reports.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : reports.length === 0 ? <p className="text-gray-500 text-sm">Bildirim yok.</p> : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl bg-surface-light/40 border border-white/5">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="text-sm text-white"><span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-300 text-[11px] font-bold mr-2">{r.targetType}</span>{r.reason} <span className="text-xs text-gray-500">— bildiren: @{r.reporterName || "?"}</span></p>
                    <select value={r.status} onChange={(e) => updateReport(r.id, e.target.value)} className="bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="dismissed">dismissed</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Hedef ID: {r.targetId}</p>
                  {r.detail && <p className="text-sm text-gray-400 mt-1">{r.detail}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "polls" && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Anketler ({polls.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : polls.length === 0 ? <p className="text-gray-500 text-sm">Anket yok.</p> : (
            <div className="space-y-2">
              {polls.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-light/40 border border-white/5">
                  <div>
                    <p className="text-sm text-white font-medium">{p.question}</p>
                    <p className="text-xs text-gray-500">@{p.username || "?"} • {p.voteCount} oy</p>
                  </div>
                  <button onClick={() => deletePoll(p.id)} className="text-gray-600 hover:text-red-400" title="Sil"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "announcements" && (
        <div className="space-y-4">
          <form onSubmit={sendNewChapter} className="glass-panel rounded-2xl p-6 border border-accent/20 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2"><BellPlus className="w-5 h-5 text-accent" /> Yeni Bölüm Duyur (seri takipçilerine bildirim gider)</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={ncSlug}
                onChange={(e) => setNcSlug(e.target.value)}
                placeholder="Manga slug — örn: dragon-ball-1984"
                className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
              />
              <input
                value={ncChapter}
                onChange={(e) => setNcChapter(e.target.value)}
                placeholder="Bölüm no — örn: 42"
                className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
              />
            </div>
            {ncResult && <p className="text-xs text-primary">{ncResult}</p>}
            <button type="submit" disabled={ncSending} className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 keep-white">
              {ncSending ? "Gönderiliyor..." : "Duyur + Bildirim Gönder"}
            </button>
          </form>
          <form onSubmit={sendAnnouncement} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <h3 className="font-bold text-white">Duyuru Yayınla (tüm üyelere bildirim gider)</h3>
            <input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              maxLength={200}
              placeholder="Başlık — örn: 5 yeni bölüm eklendi!"
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
            />
            <textarea
              value={annMsg}
              onChange={(e) => setAnnMsg(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Duyuru metni..."
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            <button type="submit" disabled={annSending} className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> {annSending ? "Gönderiliyor..." : "Yayınla"}
            </button>
          </form>
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-4">Geçmiş Duyurular ({announcements.length})</h3>
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz duyuru yok.</p>
            ) : (
              <div className="space-y-2">
                {announcements.map((a: any) => (
                  <div key={a.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-surface-light/40 border border-white/5">
                    <div>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        {a.isPinned && <Pin className="w-3.5 h-3.5 text-yellow-400" />}
                        {a.title}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{a.message}</p>
                    </div>
                    <button onClick={() => togglePin(a.id, !!a.isPinned)} className="p-2 rounded-lg bg-surface border border-white/10 text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0" title={a.isPinned ? "Sabiti kaldır" : "Sabitle"}>
                      {a.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="font-bold text-white mb-4">Seri Talepleri ({requests.length})</h3>
          {tabLoading ? <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p> : requests.length === 0 ? <p className="text-gray-500 text-sm">Talep yok.</p> : (
            <div className="space-y-3">
              {requests.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl bg-surface-light/40 border border-white/5">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{r.title} {r.author && <span className="text-gray-500 font-normal">— {r.author}</span>} <span className="text-xs text-gray-500">(@{r.username || "?"})</span></p>
                    <select value={r.status} onChange={(e) => updateRequest(r.id, e.target.value)} className="bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                  {r.description && <p className="text-sm text-gray-400">{r.description}</p>}
                  {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{r.link}</a>}
                  {r.adminNote && <p className="text-xs text-accent mt-1">Not: {r.adminNote}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
