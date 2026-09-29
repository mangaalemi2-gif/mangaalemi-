"use client";

import { useState, useEffect } from "react";
import { BookmarkPlus, Check } from "lucide-react";

export const STATUS_LABEL: Record<string, string> = {
  reading: "Okuyorum",
  completed: "Tamamladım",
  on_hold: "Bekletiyorum",
  dropped: "Bıraktım",
  planning: "Planlıyorum",
};

export default function MyListButton({ mangaSlug }: { mangaSlug: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/mylist?slug=${encodeURIComponent(mangaSlug)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setStatus(data.status ?? null);
        }
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [mangaSlug]);

  async function set(s: string | null) {
    const prev = status;
    setStatus(s);
    setOpen(false);
    try {
      const res = await fetch("/api/mylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug, status: s }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await res.json()) as any;
      if (res.ok) setStatus(data.status);
      else setStatus(prev);
    } catch {
      setStatus(prev);
    }
  }

  if (loading) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform border ${
          status ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-light border-white/10 text-gray-200 hover:border-accent/40"
        }`}
      >
        {status ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
        {status ? STATUS_LABEL[status] : "Listeme Ekle"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-48 glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <button
                key={key}
                onClick={() => set(key)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${status === key ? "text-accent font-bold" : "text-gray-200"}`}
              >
                {status === key ? "✓ " : ""}{label}
              </button>
            ))}
            {status && (
              <button
                onClick={() => set(null)}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/5"
              >
                Listeden çıkar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
