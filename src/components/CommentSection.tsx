"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Send, ChevronDown, ChevronUp, Lightbulb, MessagesSquare, Trash2, Flag, Reply, CornerDownRight, EyeOff, Eye, Pencil, ImagePlus, X } from "lucide-react";
import ReportModal from "./ReportModal";

const EMOJIS = ["🔥", "😂", "😮", "❤️", "😢", "👏"];

// @kullanıcı ifadelerini profile linkine çevirir
function renderContent(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]{3,30})/g);
  return parts.map((p, i) =>
    /^@[a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]{3,30}$/.test(p) ? (
      <Link key={i} href={`/kullanici/${encodeURIComponent(p.slice(1))}`} className="text-primary font-semibold hover:underline">
        {p}
      </Link>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

interface ReplyItem {
  id: string;
  content: string;
  isSpoiler: boolean | null;
  isEdited: boolean | null;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: any;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  badge: string | null;
  role: string | null;
  likeCount: number;
}

interface CommentItem {
  id: string;
  content: string;
  isSpoiler: boolean | null;
  isEdited: boolean | null;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: any;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  badge: string | null;
  role: string | null;
  likeCount: number;
  replies: ReplyItem[];
}

interface Props {
  type: "chapter" | "manga" | "chat" | "feedback";
  slug?: string;
  chapter?: string;
}

function timeAgo(v: any): string {
  try {
    let d: Date;
    if (!v) return "";
    if (typeof v === "number") {
      // D1 strftime('%s') saniye döndürür, JS ms bekler
      d = new Date(v < 1e12 ? v * 1000 : v);
    } else {
      d = new Date(v);
    }
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (isNaN(diff) || diff < 0) return "Az önce";
    if (diff < 60) return "Az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} gün önce`;
    return d.toLocaleDateString("tr-TR");
  } catch {
    return "";
  }
}

export default function CommentSection({ type, slug, chapter }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("member");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "comment" | "user"; id: string; label?: string } | null>(null);

  const context = type;
  const query = `context=${context}${slug ? `&slug=${encodeURIComponent(slug)}` : ""}${chapter ? `&chapter=${encodeURIComponent(chapter)}` : ""}`;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, likeRes, meRes] = await Promise.all([
        fetch(`/api/comments?${query}`),
        fetch(`/api/comments/like`),
        fetch(`/api/auth/me`),
      ]);
      if (cRes.ok) {
        const data = (await cRes.json()) as any;
        const list = data.comments || [];
        setComments(list);
        // Tepkileri çek
        try {
          const ids: string[] = [];
          list.forEach((c: CommentItem) => {
            ids.push(c.id);
            (c.replies || []).forEach((r: ReplyItem) => ids.push(r.id));
          });
          if (ids.length > 0) {
            const rRes = await fetch(`/api/comments/reactions?ids=${encodeURIComponent(ids.join(","))}`);
            if (rRes.ok) {
              const rData = (await rRes.json()) as any;
              setReactionCounts(rData.counts || {});
              setMyReactions(rData.mine || {});
            }
          }
        } catch { /* yoksay */ }
      }
      if (likeRes.ok) {
        const data = (await likeRes.json()) as any;
        setLiked(data.liked || []);
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as any;
        if (data.user) {
          setLoggedIn(true);
          setMyUserId(data.user.id);
          setMyRole(data.user.role || "member");
        }
      }
    } catch {
      // sessiz geç
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !imageUrl) || sending) return;
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), context, slug: slug || null, chapter: chapter || null, isSpoiler: spoiler, imageUrl }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        alert(data.error || "Gönderilemedi.");
        return;
      }
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setText("");
        setSpoiler(false);
        setImageUrl(null);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "comment");
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as any;
      if (res.ok) setImageUrl(data.url);
      else alert(data.error || "Yüklenemedi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleReply(parentId: string) {
    if (!replyText.trim() || sending) return;
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim(), context, slug: slug || null, chapter: chapter || null, parentId, isSpoiler: replySpoiler }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data.comment) {
        setComments((prev) => prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), data.comment] } : c)));
        setReplyText("");
        setReplySpoiler(false);
        setReplyTo(null);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleLike(commentId: string, isReply?: string) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    const wasLiked = liked.includes(commentId);
    setLiked((prev) => (wasLiked ? prev.filter((id) => id !== commentId) : [...prev, commentId]));
    // Optimistic sayaç
    const delta = wasLiked ? -1 : 1;
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, likeCount: Math.max(0, (c.likeCount || 0) + delta) };
        if (isReply) {
          return { ...c, replies: (c.replies || []).map((r) => (r.id === commentId ? { ...r, likeCount: Math.max(0, (r.likeCount || 0) + delta) } : r)) };
        }
        return c;
      })
    );
    try {
      await fetch("/api/comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
    } catch {
      fetchComments();
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Bu yorum silinsin mi?")) return;
    try {
      const res = await fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) =>
          prev
            .filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }))
        );
      }
    } catch { /* yoksay */ }
  }

  async function handleReact(commentId: string, emoji: string) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    const mine = myReactions[commentId] || [];
    const has = mine.includes(emoji);
    setMyReactions((prev) => ({
      ...prev,
      [commentId]: has ? mine.filter((e) => e !== emoji) : [...mine, emoji],
    }));
    setReactionCounts((prev) => ({
      ...prev,
      [commentId]: {
        ...(prev[commentId] || {}),
        [emoji]: Math.max(0, ((prev[commentId] || {})[emoji] || 0) + (has ? -1 : 1)),
      },
    }));
    try {
      await fetch("/api/comments/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, emoji }),
      });
    } catch { /* yoksay */ }
  }

  async function handleEditSave(commentId: string, isReplyParent?: string) {
    if (!editText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId, content: editText.trim() }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        alert(data.error || "Düzenlenemedi.");
        return;
      }
      const update = (c: CommentItem | ReplyItem) =>
        c.id === commentId ? { ...c, content: editText.trim(), isEdited: true } : c;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return update(c) as CommentItem;
          return { ...c, replies: (c.replies || []).map((r) => update(r) as ReplyItem) };
        })
      );
      setEditingId(null);
      setEditText("");
    } finally {
      setSending(false);
    }
  }

  const titles = {
    chapter: { icon: <MessageSquare className="w-5 h-5 text-primary" />, label: "Bölüm Yorumları" },
    manga: { icon: <MessageSquare className="w-5 h-5 text-accent" />, label: "Manga Hakkında Yorumlar" },
    feedback: { icon: <Lightbulb className="w-5 h-5 text-yellow-400" />, label: "Site Geliştirme Önerileri" },
    chat: { icon: <MessagesSquare className="w-5 h-5 text-primary" />, label: "Genel Sohbet" },
  };

  const { icon, label } = titles[type];
  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);
  const visible = sort === "top" ? [...comments].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)) : comments;

  function renderComment(c: CommentItem | ReplyItem, isReply = false, parentId?: string) {
    const isLiked = liked.includes(c.id);
    const canDelete = myUserId === c.userId || myRole === "admin";
    const hidden = !!c.isSpoiler && !revealed.includes(c.id);
    return (
      <div key={c.id} className={`flex gap-3 ${isReply ? "ml-8 mt-3 border-l-2 border-white/5 pl-3" : ""}`}>
        <Link href={c.username ? `/kullanici/${encodeURIComponent(c.username)}` : "#"} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all">
          {(c.username || "?").charAt(0).toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {c.username ? (
              <Link href={`/kullanici/${encodeURIComponent(c.username)}`} className="text-white text-sm font-semibold hover:text-primary transition-colors">
                {c.username}
              </Link>
            ) : (
              <span className="text-white text-sm font-semibold">Silinmiş Kullanıcı</span>
            )}
            {c.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">ADMIN</span>
            )}
            {c.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 font-bold">{c.badge}</span>
            )}
            {c.isSpoiler && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-bold">SPOILER</span>
            )}
            <span className="text-gray-600 text-xs">{timeAgo(c.createdAt)}</span>
            {c.isEdited ? <span className="text-gray-700 text-[11px] italic">(düzenlendi)</span> : null}
          </div>
          {editingId === c.id ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full bg-surface border border-primary/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSave(c.id)}
                  disabled={!editText.trim() || sending}
                  className="px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditText(""); }}
                  className="px-4 py-1.5 rounded-lg bg-surface-light border border-white/10 text-gray-300 text-xs"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : hidden ? (
            <button
              onClick={() => setRevealed((prev) => [...prev, c.id])}
              className="flex items-center gap-2 text-xs text-yellow-400/80 hover:text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-2 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" /> Spoiler içeriyor — görmek için tıkla
            </button>
          ) : (
            <>
              {c.isSpoiler && (
                <button
                  onClick={() => setRevealed((prev) => prev.filter((id) => id !== c.id))}
                  className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 mb-1"
                >
                  <Eye className="w-3 h-3" /> Gizle
                </button>
              )}
              <p className="text-gray-300 text-sm leading-relaxed break-words">{renderContent(c.content)}</p>
              {c.imageUrl && !hidden && (
                <a href={c.imageUrl} target="_blank" rel="noreferrer" className="block mt-2 max-w-xs">
                  <img src={c.imageUrl} alt="Yorum resmi" className="rounded-xl border border-white/10 max-h-64 object-cover hover:opacity-90 transition-opacity" loading="lazy" />
                </a>
              )}
            </>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => handleLike(c.id, isReply ? parentId : undefined)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? "text-primary" : "text-gray-600 hover:text-gray-400"}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
              <span>{c.likeCount ?? 0}</span>
            </button>
            {!isReply && loggedIn && (
              <button
                onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" /> Yanıtla
              </button>
            )}
            <button
              onClick={() => setReportTarget({ type: "comment", id: c.id, label: `yorum (${(c.content || "").slice(0, 30)}...)` })}
              className="flex items-center gap-1 text-xs text-gray-700 hover:text-red-400 transition-colors"
              title="Yorumu bildir"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
            {myUserId === c.userId && (
              <button
                onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                className="flex items-center gap-1 text-xs text-gray-700 hover:text-primary transition-colors"
                title="Yorumu düzenle"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDelete(c.id)}
                className="flex items-center gap-1 text-xs text-gray-700 hover:text-red-400 transition-colors"
                title="Yorumu sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {(Object.keys(reactionCounts[c.id] || {}).length > 0 || loggedIn) && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {EMOJIS.map((e) => {
                const n = (reactionCounts[c.id] || {})[e] || 0;
                const mine = (myReactions[c.id] || []).includes(e);
                if (n === 0 && !loggedIn) return null;
                return (
                  <button
                    key={e}
                    onClick={() => handleReact(c.id, e)}
                    title="Tepki ver"
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all hover:scale-110 ${
                      mine ? "border-primary/60 bg-primary/15" : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <span>{e}</span>
                    {n > 0 && <span className={mine ? "text-primary font-bold" : "text-gray-400"}>{n}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {!isReply && replyTo === c.id && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex items-center text-gray-600"><CornerDownRight className="w-4 h-4" /></div>
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleReply(c.id); if (e.key === "Escape") setReplyTo(null); }}
                  placeholder="Yanıtını yaz..."
                  maxLength={1000}
                  className="flex-1 bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => setReplySpoiler((v) => !v)}
                  title="Spoiler olarak işaretle"
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${replySpoiler ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" : "bg-surface border-white/10 text-gray-500 hover:text-gray-300"}`}
                >
                  <EyeOff className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReply(c.id)}
                  disabled={!replyText.trim() || sending}
                  className="px-3 py-2 rounded-xl bg-primary text-black font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden mb-8">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-white text-lg">{label}</span>
          <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">{totalCount}</span>
        </div>
        {collapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          {loggedIn ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {imageUrl && (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="Önizleme" className="h-20 rounded-xl border border-white/10" />
                  <button type="button" onClick={() => setImageUrl(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center keep-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  placeholder={type === "feedback" ? "Site hakkında önerin nedir?" : type === "chat" ? "Sohbete katıl... (küfür/spam yasak)" : "Düşüncelerini paylaş..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
                <div className="flex flex-col gap-2">
                  <label
                    title="Resim ekle"
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${uploading ? "opacity-50" : "bg-surface border-white/10 text-gray-500 hover:text-gray-300"}`}
                  >
                    <ImagePlus className="w-4 h-4" />
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImagePick} disabled={uploading} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSpoiler((v) => !v)}
                    title="Spoiler olarak işaretle"
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors ${spoiler ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" : "bg-surface border-white/10 text-gray-500 hover:text-gray-300"}`}
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={(!text.trim() && !imageUrl) || sending || uploading}
                    className="px-4 py-3 rounded-xl bg-primary text-black font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {spoiler && <p className="text-yellow-400/80 text-xs">⚠ Bu yorum spoiler olarak gizlenecek.</p>}
              <p className="text-[11px] text-gray-600">Küfür otomatik sansürlenir, spoiler içeren yorumları işaretlemeyi unutma.</p>
            </form>
          ) : (
            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400 mb-3">Yorum yazmak, beğenmek ve sohbete katılmak için giriş yapmalısın.</p>
              <div className="flex gap-2 justify-center">
                <Link href="/login" className="px-5 py-2 rounded-full bg-primary text-black text-sm font-bold hover:scale-105 transition-transform">Giriş Yap</Link>
                <Link href="/register" className="px-5 py-2 rounded-full bg-surface-light border border-white/10 text-sm text-white hover:border-primary/50 transition-colors">Kayıt Ol</Link>
              </div>
            </div>
          )}

          <div className="border-t border-white/5" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Sırala:</span>
            {(["new", "top"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  sort === s ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {s === "new" ? "En Yeniler" : "En Beğenilenler"}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Henüz yorum yok. İlk yazan sen ol!</p>
              </div>
            ) : (
              visible.map((c) => (
                <div key={c.id}>
                  {renderComment(c)}
                  {(c.replies || []).map((r) => renderComment(r, true, c.id))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
