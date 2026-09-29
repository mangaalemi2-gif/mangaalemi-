"use client";

import { useState, useEffect } from "react";
import { LifeBuoy, Send, Clock, CheckCircle2, Loader } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: any;
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Açık", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: Clock },
  in_progress: { label: "İnceleniyor", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Loader },
  closed: { label: "Kapandı", color: "text-primary border-primary/30 bg-primary/10", icon: CheckCircle2 },
};

export default function DestekPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tRes, meRes] = await Promise.all([fetch("/api/support"), fetch("/api/auth/me")]);
      if (tRes.ok) {
        const data = (await tRes.json()) as any;
        setTickets(data.tickets || []);
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as any;
        setLoggedIn(!!data.user);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!subject.trim() || !message.trim()) {
      setError("Konu ve mesaj gerekli.");
      return;
    }
    if (!loggedIn && !email.trim()) {
      setError("Misafir olarak yazıyorsun — e-posta gerekli.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), email: email.trim() || undefined }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        setError(data.error || "Talep oluşturulamadı.");
        return;
      }
      setSubject("");
      setMessage("");
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
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <LifeBuoy className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-extrabold text-white">Destek Talebi</h1>
          </div>
          <p className="text-gray-400 text-sm">Sorun mu var? Önerin mi var? Bize yaz, admin ekibi incelesin. {loggedIn ? "" : "Giriş yapmadan da e-posta ile yazabilirsin."}</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 mt-6 space-y-3">
          {!loggedIn && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="E-posta adresin"
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
            />
          )}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="Konu — örn: Bölüm 12 açılmıyor"
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Sorunu detaylı anlat..."
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-primary text-xs font-medium">✓ Talebin alındı! En kısa sürede incelenecek.</p>}
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {sending ? "Gönderiliyor..." : "Talebi Gönder"}
          </button>
        </form>
      </div>

      {loggedIn && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <h2 className="font-bold text-white mb-4">Taleplerim ({tickets.length})</h2>
          {loading ? (
            <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz destek talebin yok.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const s = STATUS_LABEL[t.status] || STATUS_LABEL.open;
                const Icon = s.icon;
                return (
                  <div key={t.id} className="bg-surface-light/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{t.subject}</h3>
                      <span className={`text-[11px] px-2 py-1 rounded-full border font-bold flex items-center gap-1 flex-shrink-0 ${s.color}`}>
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{t.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
