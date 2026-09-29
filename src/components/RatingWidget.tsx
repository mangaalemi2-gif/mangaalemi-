"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

export default function RatingWidget({ mangaSlug }: { mangaSlug: string }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ratings?slug=${encodeURIComponent(mangaSlug)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setAverage(data.average || 0);
          setCount(data.count || 0);
          setMyScore(data.myScore ?? null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mangaSlug]);

  async function rate(score: number) {
    const prev = myScore;
    setMyScore(score);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug, score }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await res.json()) as any;
      if (res.ok) {
        setAverage(data.average);
        setCount(data.count);
      } else {
        setMyScore(prev);
      }
    } catch {
      setMyScore(prev);
    }
  }

  if (loading) return <div className="text-xs text-gray-600 animate-pulse">Puanlar yükleniyor...</div>;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            onClick={() => rate(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            title={`${s}/10 ver`}
            className="p-0.5 hover:scale-125 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${(hover || myScore || 0) >= s ? "text-yellow-400 fill-current" : "text-gray-600"}`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-300 font-bold">
        {count > 0 ? `${average}/10` : "Henüz puan yok"} <span className="text-xs text-gray-500 font-normal">({count} oy{myScore ? ` • senin puanın: ${myScore}` : ""})</span>
      </span>
    </div>
  );
}
