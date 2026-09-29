"use client";

import { useState } from "react";
import { MessageSquare, ThumbsUp, Send, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  time: string;
  liked: boolean;
}

interface Props {
  type: "chapter" | "manga" | "feedback";
  slug?: string;
  chapter?: string;
}

const DEMO_COMMENTS: Comment[] = [
  { id: 1, author: "MangaSevdalısı", avatar: "M", text: "Harika bir bölümdü! Karakterlerin gelişimi çok iyi işlenmiş. Devamını sabırsızlıkla bekliyorum 🔥", likes: 24, time: "2 saat önce", liked: false },
  { id: 2, author: "OtakuTürkiye", avatar: "O", text: "Çeviri kalitesi inanılmaz, emeğinize sağlık! Bu sahne orijinalde de bu kadar etkileyici miydi acaba?", likes: 15, time: "5 saat önce", liked: false },
  { id: 3, author: "AnimeFreak34", avatar: "A", text: "Bu sahne manga tarihinin en iyi sahnelerinden biri. Aksiyon sekansları mükemmel çizilmiş 💯", likes: 31, time: "1 gün önce", liked: false },
];

const DEMO_FEEDBACK = [
  { id: 1, author: "KullanıcıA", avatar: "K", text: "Gece modu çok güzel olmuş! Bir de okuma hızı ayarı eklenebilir mi?", likes: 42, time: "3 saat önce", liked: false },
  { id: 2, author: "MangaOkuyucu", avatar: "M", text: "Bölümler arası geçiş butonu çok kullanışlı. Favorilere ekleme özelliği de olursa harika olur!", likes: 38, time: "1 gün önce", liked: false },
  { id: 3, author: "TürkManga", avatar: "T", text: "Siteye çok güzel bir başlangıç! Bildirim sistemi eklenirse daha fazla okuyucu çekersiniz.", likes: 27, time: "2 gün önce", liked: false },
];

export default function CommentSection({ type, slug, chapter }: Props) {
  const initialComments = type === "feedback" ? DEMO_FEEDBACK : DEMO_COMMENTS;
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleLike(id: number) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked } : c
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Date.now(),
      author: name.trim() || "Anonim Okuyucu",
      avatar: (name.trim() || "A")[0].toUpperCase(),
      text: text.trim(),
      likes: 0,
      time: "Az önce",
      liked: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setText("");
    setName("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const titles = {
    chapter: { icon: <MessageSquare className="w-5 h-5 text-primary" />, label: "Bölüm Yorumları" },
    manga: { icon: <MessageSquare className="w-5 h-5 text-accent" />, label: "Manga Hakkında Yorumlar" },
    feedback: { icon: <Lightbulb className="w-5 h-5 text-yellow-400" />, label: "Site Geliştirme Önerileri" },
  };

  const { icon, label } = titles[type];

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden mb-8">
      {/* Başlık */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-white text-lg">{label}</span>
          <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full">{comments.length}</span>
        </div>
        {collapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          {/* Yorum Formu */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="İsmin (opsiyonel)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <div className="flex gap-3">
              <textarea
                placeholder={type === "feedback" ? "Site hakkında önerin nedir?" : "Düşüncelerini paylaş..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
              <button
                type="submit"
                className="self-end px-4 py-3 rounded-xl bg-primary text-black font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {submitted && (
              <p className="text-primary text-xs font-medium animate-in fade-in">✓ Yorumun eklendi!</p>
            )}
          </form>

          {/* Ayırıcı */}
          <div className="border-t border-white/5" />

          {/* Yorumlar Listesi */}
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{c.author}</span>
                    <span className="text-gray-600 text-xs">{c.time}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{c.text}</p>
                  <button
                    onClick={() => handleLike(c.id)}
                    className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${c.liked ? "text-primary" : "text-gray-600 hover:text-gray-400"}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{c.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
