"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Poll {
  id: string;
  question: string;
  options: string[];
  voteCounts: number[];
  voteCount: number;
  userVote: number | null;
  username: string | null;
  endsAt: any;
  createdAt: any;
}

export default function AnketlerPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("0");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pRes, meRes] = await Promise.all([fetch("/api/polls"), fetch("/api/auth/me")]);
      if (pRes.ok) {
        const data = (await pRes.json()) as any;
        setPolls(data.polls || []);
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

  async function handleVote(pollId: string, idx: number) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    setVotingId(pollId);
    // Optimistic
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const voteCounts = [...p.voteCounts];
        if (p.userVote !== null && p.userVote !== undefined) voteCounts[p.userVote] = Math.max(0, voteCounts[p.userVote] - 1);
        voteCounts[idx] = (voteCounts[idx] || 0) + 1;
        return { ...p, voteCounts, userVote: idx, voteCount: voteCounts.reduce((a, b) => a + b, 0) };
      })
    );
    try {
      await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionIndex: idx }),
      });
    } finally {
      setVotingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError("Soru yazmalısın.");
      return;
    }
    if (clean.length < 2) {
      setError("En az 2 seçenek gerekli.");
      return;
    }
    setCreating(true);
    try {
      const endsAt = duration !== "0" ? new Date(Date.now() + parseInt(duration) * 86400000).toISOString() : null;
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), options: clean, endsAt }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        setError(data.error || "Anket oluşturulamadı.");
        setCreating(false);
        return;
      }
      setQuestion("");
      setOptions(["", ""]);
      setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Anket silinsin mi?")) return;
    await fetch(`/api/polls?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setPolls((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 className="w-7 h-7 text-accent" />
              <h1 className="text-3xl font-extrabold text-white">Anketler</h1>
            </div>
            <p className="text-gray-400 text-sm">Topluluğun nabzını tut. Oy ver, kendi anketini oluştur.</p>
          </div>
          {loggedIn ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Anket Oluştur
            </button>
          ) : (
            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:scale-105 transition-transform">
              Giriş Yap
            </Link>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="relative z-10 mt-6 bg-surface/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              placeholder="Anket sorun nedir? Örn: Sıradaki favori serin hangisi?"
              className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                    maxLength={100}
                    placeholder={`Seçenek ${i + 1}`}
                    className="flex-1 bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} className="px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {options.length < 6 && (
                <button type="button" onClick={() => setOptions((prev) => [...prev, ""])} className="text-xs text-accent hover:underline">+ Seçenek ekle</button>
              )}
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-surface-light border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                title="Anket süresi"
              >
                <option value="0">Süresiz</option>
                <option value="1">1 gün</option>
                <option value="3">3 gün</option>
                <option value="7">7 gün</option>
                <option value="30">30 gün</option>
              </select>
              <div className="flex-1" />
              <button type="submit" disabled={creating} className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 keep-white">
                {creating ? "Oluşturuluyor..." : "Yayınla"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse">Anketler yükleniyor...</div>
      ) : polls.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-white/10">
          <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Henüz anket yok. İlk anketi sen oluştur!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((p) => {
            const total = p.voteCounts.reduce((a, b) => a + b, 0);
            const endsMs = p.endsAt ? (typeof p.endsAt === "number" ? p.endsAt * 1000 : new Date(p.endsAt).getTime()) : null;
            const ended = endsMs !== null && endsMs < Date.now();
            const remaining = endsMs && !ended ? Math.max(1, Math.ceil((endsMs - Date.now()) / 86400000)) : null;
            return (
              <div key={p.id} className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-white">{p.question}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.username ? `@${p.username}` : "Anonim"} • {total} oy
                      {ended ? <span className="text-red-400 font-bold"> • Sona erdi</span> : remaining ? <span> • {remaining} gün kaldı</span> : null}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-700 hover:text-red-400 transition-colors" title="Sil (sahibi/admin)">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {p.options.map((opt, i) => {
                    const count = p.voteCounts[i] || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const selected = p.userVote === i;
                    return (
                      <button
                        key={i}
                        disabled={votingId === p.id || ended}
                        onClick={() => handleVote(p.id, i)}
                        className={`w-full text-left relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm transition-all ${
                          selected ? "border-primary/60 bg-primary/10 text-white" : "border-white/10 bg-surface-light/40 text-gray-200 hover:border-primary/40"
                        }`}
                      >
                        <div className="absolute inset-y-0 left-0 bg-primary/15 transition-all" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            {selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            {opt}
                          </span>
                          <span className="text-xs text-gray-400 font-bold">%{pct} • {count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
