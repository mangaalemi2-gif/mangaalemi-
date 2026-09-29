"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { User, Flag, MessageSquare, ThumbsUp, Calendar, Mail } from "lucide-react";
import ReportModal from "@/components/ReportModal";
import WallSection from "@/components/WallSection";

interface ProfileData {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    bio: string | null;
    badge: string | null;
    role: string | null;
    createdAt: any;
  };
  stats: { commentCount: number; likesReceived: number };
  follow: { followerCount: number; followingCount: number; isFollowing: boolean };
  xp: number;
  level: { level: number; title: string; progress: number };
  isSelf: boolean;
  recent: { id: string; content: string; context: string; slug: string | null; chapter: string | null; createdAt: any; likeCount: number }[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = decodeURIComponent((params?.username as string) || "");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = (await res.json()) as ProfileData;
        setData(json);
        setFollowing(json.follow?.isFollowing ?? false);
        try {
          const [bRes, badgeRes, achRes, listRes] = await Promise.all([
            fetch("/api/blocks"),
            fetch(`/api/badges?user=${encodeURIComponent(username)}`),
            fetch(`/api/achievements?user=${encodeURIComponent(username)}`),
            fetch(`/api/mylist?user=${encodeURIComponent(username)}`),
          ]);
          if (bRes.ok) {
            const b = (await bRes.json()) as any;
            setIsBlocked((b.blocked || []).includes(json.user.id));
          }
          if (badgeRes.ok) {
            const b = (await badgeRes.json()) as any;
            setBadges(b.badges || []);
          }
          if (achRes.ok) {
            const a = (await achRes.json()) as any;
            setAchievements((a.achievements || []).filter((x: any) => x.earnedAt));
          }
          if (listRes.ok) {
            const l = (await listRes.json()) as any;
            setMyList(l.list || []);
          }
        } catch { /* yoksay */ }
      } finally {
        setLoading(false);
      }
    }
    if (username) load();
  }, [username]);

  const LIST_LABEL: Record<string, string> = {
    reading: "Okuyorum",
    completed: "Tamamladım",
    on_hold: "Bekletiyorum",
    dropped: "Bıraktım",
    planning: "Planlıyorum",
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">Yükleniyor...</div>;
  }
  if (notFound || !data) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <User className="w-14 h-14 text-gray-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Kullanıcı bulunamadı</h1>
        <Link href="/sohbet" className="text-primary hover:underline text-sm">Sohbete dön</Link>
      </div>
    );
  }

  const { user, stats, recent } = data;

  async function toggleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const d = (await res.json()) as any;
      if (res.ok) {
        setFollowing(d.following);
        setData((p) => (p ? { ...p, follow: { ...p.follow, followerCount: p.follow.followerCount + (d.following ? 1 : -1) } } : p));
      } else setFollowing(prev);
    } catch {
      setFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  }

  async function toggleBlock() {
    if (!confirm(isBlocked ? "Engeli kaldırmak istiyor musun?" : "Bu kullanıcıyı engellemek istiyor musun? Yorumlarını görmezsin.")) return;
    const prev = isBlocked;
    setIsBlocked(!prev);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const d = (await res.json()) as any;
      if (res.ok) setIsBlocked(d.blocked);
      else setIsBlocked(prev);
    } catch {
      setIsBlocked(prev);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl border border-white/10 relative overflow-hidden">
        {user.coverUrl && (
          <div className="h-32 sm:h-40 w-full overflow-hidden">
            <img src={user.coverUrl} alt="Kapak" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-extrabold text-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white">{user.username}</h1>
              {user.role === "admin" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">ADMIN</span>}
              {user.badge && <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold">{user.badge}</span>}
            </div>
            {user.bio ? <p className="text-gray-300 text-sm mt-2 leading-relaxed">{user.bio}</p> : <p className="text-gray-600 text-sm mt-2 italic">Henüz biyografi yazmamış.</p>}
            {badges.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {badges.map((b: any) => (
                  <span key={b.id} title={b.name} className="text-xl leading-none">{b.icon}</span>
                ))}
              </div>
            )}
            {achievements.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {achievements.map((a: any) => (
                  <span key={a.id} title={`${a.name} — ${a.description}`} className="text-xl leading-none">{a.icon}</span>
                ))}
                <span className="text-[11px] text-gray-500 ml-1">{achievements.length} başarım</span>
              </div>
            )}
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25">
              <span className="text-xs font-extrabold text-primary">Sv. {data.level.level} • {data.level.title}</span>
              <span className="text-[11px] text-gray-400">{data.xp} XP</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {stats.commentCount} yorum</span>
              <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {stats.likesReceived} beğeni</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {data.follow.followerCount} takipçi • {data.follow.followingCount} takip</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {user.createdAt ? new Date(typeof user.createdAt === "number" ? user.createdAt * 1000 : user.createdAt).toLocaleDateString("tr-TR") : ""} üye</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!data.isSelf && (
              <>
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 ${
                    following ? "bg-surface-light border border-white/10 text-gray-300" : "bg-primary text-black"
                  }`}
                >
                  {following ? "Takipten Çık" : "Takip Et"}
                </button>
                <Link
                  href={`/mesajlar?to=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.username)}`}
                  className="px-4 py-2 rounded-xl bg-surface-light border border-white/10 text-gray-200 text-xs font-bold hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Mesaj Gönder
                </Link>
              </>
            )}
            <button
              onClick={() => setShowReport(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" /> Kullanıcıyı Bildir
            </button>
            {!data.isSelf && (
              <button
                onClick={toggleBlock}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  isBlocked ? "bg-surface-light border-white/10 text-gray-300" : "bg-surface-light border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30"
                }`}
              >
                {isBlocked ? "Engeli Kaldır" : "Engelle"}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      <WallSection username={user.username} profileUserId={user.id} />

      <div className="glass-panel rounded-3xl p-6 border border-white/10">
        <h2 className="font-bold text-white mb-4">Son Yorumları</h2>
        {recent.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz yorum yazmamış.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((c) => (
              <div key={c.id} className="bg-surface-light/40 border border-white/5 rounded-xl p-4">
                <p className="text-gray-200 text-sm">{c.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {c.context === "chat" ? "Genel Sohbet" : c.context === "feedback" ? "Öneri" : c.context === "manga" ? `Manga: ${c.slug}` : `Bölüm: ${c.slug}/${c.chapter}`} • {c.likeCount} beğeni
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {myList.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <h2 className="font-bold text-white mb-4">Listesi</h2>
          <div className="space-y-4">
            {Object.keys(LIST_LABEL).map((st) => {
              const items = myList.filter((x: any) => x.status === st);
              if (items.length === 0) return null;
              return (
                <div key={st}>
                  <p className="text-xs font-bold text-accent mb-2">{LIST_LABEL[st]} ({items.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((x: any) => (
                      <Link key={x.id} href={`/manga/${x.mangaSlug}`} className="px-3 py-1.5 rounded-xl bg-surface-light/50 border border-white/5 hover:border-accent/40 text-xs text-gray-200 transition-all">
                        {x.mangaSlug}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showReport && (
        <ReportModal targetType="user" targetId={user.id} targetLabel={`@${user.username}`} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
