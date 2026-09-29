"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, CheckCircle2, Play } from "lucide-react";

interface Poll {
  id: string;
  question: string;
  options: string[];
  voteCounts: number[];
  voteCount: number;
  userVote: number | null;
}

export default function MonthlyVote() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [pRes, meRes] = await Promise.all([fetch("/api/monthly"), fetch("/api/auth/me")]);
      if (pRes.ok) {
        const data = (await pRes.json()) as any;
        setPoll(data.poll || null);
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

  async function start() {
    setVoting(true);
    try {
      const res = await fetch("/api/monthly", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as any;
        setPoll(data.poll);
      }
    } finally {
      setVoting(false);
    }
  }

  async function vote(idx: number) {
    if (!poll) return;
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    setVoting(true);
    setPoll((p) => {
      if (!p) return p;
      const voteCounts = [...p.voteCounts];
      if (p.userVote !== null) voteCounts[p.userVote] = Math.max(0, voteCounts[p.userVote] - 1);
      voteCounts[idx] = (voteCounts[idx] || 0) + 1;
      return { ...p, voteCounts, userVote: idx, voteCount: voteCounts.reduce((a, b) => a + b, 0) };
    });
    try {
      await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, optionIndex: idx }),
      });
    } finally {
      setVoting(false);
    }
  }

  if (loading) return null;

  const total = poll ? poll.voteCounts.reduce((a, b) => a + b, 0) : 0;

  return (
    <section className="glass-panel rounded-3xl p-8 border border-yellow-500/20 relative overflow-hidden">
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">{poll ? poll.question : "Ayın Serisi"}</h2>
        </div>
        {!poll ? (
          <div className="mt-4">
            <p className="text-gray-400 text-sm mb-4">Bu ayın oylaması henüz başlamadı. İlk oyu sen ver, oylamayı başlat!</p>
            <button
              onClick={start}
              disabled={voting}
              className="px-6 py-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {voting ? "..." : "Oylamayı Başlat"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-2 max-w-xl">
            {poll.options.map((opt, i) => {
              const count = poll.voteCounts[i] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const selected = poll.userVote === i;
              return (
                <button
                  key={i}
                  disabled={voting}
                  onClick={() => vote(i)}
                  className={`w-full text-left relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm transition-all ${
                    selected ? "border-yellow-500/60 bg-yellow-500/10 text-white" : "border-white/10 bg-surface-light/40 text-gray-200 hover:border-yellow-500/40"
                  }`}
                >
                  <div className="absolute inset-y-0 left-0 bg-yellow-500/15 transition-all" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {selected && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                      {opt}
                    </span>
                    <span className="text-xs text-gray-400 font-bold">%{pct} • {count}</span>
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-gray-500 pt-1">
              {total} oy • <Link href="/anketler" className="text-primary hover:underline">Tüm anketler</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
