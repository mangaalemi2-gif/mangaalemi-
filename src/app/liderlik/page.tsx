"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Medal, Crown } from "lucide-react";

interface Entry {
  id: string;
  username: string;
  avatarUrl: string | null;
  badge: string | null;
  role: string | null;
  xp: number;
  level: number;
  title: string;
  progress: number;
}

export default function LiderlikPage() {
  const [board, setBoard] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = (await res.json()) as any;
          setBoard(data.leaderboard || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const medal = ["text-yellow-400", "text-gray-300", "text-amber-600"];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden text-center">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
        <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
        <h1 className="text-3xl font-extrabold text-white">Liderlik Tablosu</h1>
        <p className="text-gray-400 text-sm mt-1">Yorum yaz (+5 XP), beğeni topla (+2 XP), anket aç (+3 XP), oy ver (+1 XP), takipçi kazan (+3 XP).</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse py-10">Yükleniyor...</p>
      ) : board.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Henüz kimse XP kazanmamış. İlk sen ol!</p>
      ) : (
        <div className="space-y-2">
          {board.map((u, i) => (
            <Link
              key={u.id}
              href={`/kullanici/${encodeURIComponent(u.username)}`}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                i === 0 ? "bg-yellow-500/5 border-yellow-500/20" : "bg-surface-light/40 border-white/5 hover:border-primary/30"
              }`}
            >
              <div className="w-8 text-center font-extrabold">
                {i < 3 ? <Medal className={`w-6 h-6 mx-auto ${medal[i]}`} /> : <span className="text-gray-500">{i + 1}</span>}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-white flex-shrink-0">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{u.username}</span>
                  {i === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                  {u.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">ADMIN</span>}
                  {u.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">{u.badge}</span>}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${Math.round(u.progress * 100)}%` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-extrabold text-primary">Sv. {u.level}</p>
                <p className="text-[11px] text-gray-500">{u.title} • {u.xp} XP</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
