"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function FavoriteButton({ mangaSlug }: { mangaSlug: string }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/favorites?slug=${encodeURIComponent(mangaSlug)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setIsFav(data.isFavorite);
        }
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [mangaSlug]);

  async function toggle() {
    if (loading) return;
    const prev = isFav;
    setIsFav(!prev);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await res.json()) as any;
      if (res.ok) setIsFav(data.isFavorite);
      else setIsFav(prev);
    } catch {
      setIsFav(prev);
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`w-12 h-12 flex items-center justify-center rounded-full bg-surface-light border transition-all hover:scale-105 ${
        isFav ? "border-red-500/60 text-red-500" : "border-white/10 text-white hover:text-red-500 hover:border-red-500/50"
      }`}
    >
      <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
    </button>
  );
}
