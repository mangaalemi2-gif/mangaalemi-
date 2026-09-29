"use client";

import { useState, useEffect } from "react";
import { BookPlus, Send, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Req {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  status: string;
  adminNote: string | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "İnceleniyor", cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  approved: { label: "Onaylandı", cls: "text-primary border-primary/30 bg-primary/10" },
  rejected: { label: "Reddedildi", cls: "text-red-400 border-red-500/30 bg-red-500/10" },
};

export default function SeriOnerPage() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/series-requests");
      if (res.ok) {
        const data = (await res.json()) as any;
        setItems(data.requests || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!title.trim()) {
      setError("Seri adı gerekli.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/series-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), author: author.trim(), description: description.trim(), link: link.trim() }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        if (res.status === 401) window.location.href = "/login";
        else setError(data.error || "Gönderilemedi.");
        return;
      }
      setTitle("");
      setAuthor("");
      setDescription("");
      setLink("");
      setSuccess(true);
      load();
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <BookPlus className="w-7 h-7 text-accent" />
            <h1 className="text-3xl font-extrabold text-white">Seri Öner</h1>
          </div>
          <p className="text-gray-400 text-sm">Sitede görmek istediğin mangayı öner, admin ekibi incelesin.</p>
        </div>

        <form onSubmit={submit} className="relative z-10 mt-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Seri adı * — örn: One Piece"
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={100}
              placeholder="Yazar (opsiyonel)"
              className="bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={500}
              placeholder="Tanıtım linki (opsiyonel)"
              className="bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Kısaca neden eklenmeli? (opsiyonel)"
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50 resize-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-primary text-xs font-medium">✓ Önerin alındı!</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {sending ? "Gönderiliyor..." : "Öneriyi Gönder"}
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/10">
        <h2 className="font-bold text-white mb-4">Önerilerim ({items.length})</h2>
        {loading ? (
          <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz önerin yok.</p>
        ) : (
          <div className="space-y-3">
            {items.map((r) => {
              const s = STATUS[r.status] || STATUS.pending;
              const Icon = r.status === "approved" ? CheckCircle2 : r.status === "rejected" ? XCircle : Clock;
              return (
                <div key={r.id} className="bg-surface-light/40 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm">{r.title} {r.author && <span className="text-gray-500 font-normal">— {r.author}</span>}</h3>
                    <span className={`text-[11px] px-2 py-1 rounded-full border font-bold flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                      <Icon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                  {r.description && <p className="text-gray-400 text-sm">{r.description}</p>}
                  {r.adminNote && <p className="text-xs text-accent mt-1">Admin: {r.adminNote}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
