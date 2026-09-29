"use client";

import { useState, useEffect } from "react";
import { Award, Check, Sparkles } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  icon: string;
  costXp: number;
}

export default function RozetlerPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/badges");
      if (res.ok) {
        const data = (await res.json()) as any;
        setBadges(data.badges || []);
        setOwned(data.owned || []);
        setXp(data.xp || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function buy(id: string) {
    setBusy(id);
    setMsg("");
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy", badgeId: id }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        if (res.status === 401) window.location.href = "/login";
        else setMsg(data.error || "Alınamadı.");
        return;
      }
      setOwned((prev) => [...prev, id]);
      if (typeof data.xp === "number") setXp(data.xp);
      setMsg("✓ Rozet alındı! Profilinde sergilemek için üzerine tıkla.");
    } finally {
      setBusy(null);
    }
  }

  async function showcase(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "showcase", badgeId: id }),
      });
      if (res.ok) setMsg("✓ Vitrin rozetin güncellendi!");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden text-center">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
        <Award className="w-10 h-10 text-accent mx-auto mb-2" />
        <h1 className="text-3xl font-extrabold text-white">Rozet Mağazası</h1>
        <p className="text-gray-400 text-sm mt-1">XP biriktir, rozet al, profilinde sergile.</p>
        <p className="text-primary font-extrabold mt-2">{xp.toLocaleString("tr-TR")} XP</p>
      </div>

      {msg && <p className="text-center text-sm text-primary font-medium">{msg}</p>}

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse py-10">Yükleniyor...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {badges.map((b) => {
            const has = owned.includes(b.id);
            const afford = xp >= b.costXp;
            return (
              <div key={b.id} className={`glass-panel rounded-2xl p-6 border text-center ${has ? "border-primary/30" : "border-white/10"}`}>
                <div className="text-5xl mb-2">{b.icon}</div>
                <h3 className="font-bold text-white">{b.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{b.costXp.toLocaleString("tr-TR")} XP</p>
                <div className="mt-4">
                  {has ? (
                    <button
                      onClick={() => showcase(b.id)}
                      disabled={busy === b.id}
                      className="px-5 py-2 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Vitrinde Sergile
                    </button>
                  ) : (
                    <button
                      onClick={() => buy(b.id)}
                      disabled={busy === b.id || !afford}
                      className="px-5 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:scale-105 transition-transform disabled:opacity-40 flex items-center gap-1.5 mx-auto keep-white"
                    >
                      {afford ? <Check className="w-3.5 h-3.5" /> : null}
                      {busy === b.id ? "..." : afford ? "Satın Al" : `${(b.costXp - xp).toLocaleString("tr-TR")} XP eksik`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
