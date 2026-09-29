"use client";

import { useState, useEffect } from "react";
import { BellPlus, BellRing } from "lucide-react";

export default function SeriesFollowButton({ mangaSlug, title }: { mangaSlug: string; title?: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/series-follow?slug=${encodeURIComponent(mangaSlug)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setIsFollowing(data.isFollowing);
        }
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [mangaSlug]);

  async function toggle() {
    if (loading) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = await fetch("/api/series-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await res.json()) as any;
      if (res.ok) setIsFollowing(data.isFollowing);
      else setIsFollowing(prev);
    } catch {
      setIsFollowing(prev);
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFollowing ? "Yeni bölüm bildirimlerini kapat" : "Yeni bölümde haber ver"}
      className={`px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform ${
        isFollowing
          ? "bg-primary/15 border border-primary/40 text-primary"
          : "bg-surface-light border border-white/10 text-gray-200 hover:border-primary/40"
      }`}
    >
      {isFollowing ? <BellRing className="w-4 h-4" /> : <BellPlus className="w-4 h-4" />}
      {isFollowing ? "Takipte" : "Seriyi Takip Et"}
    </button>
  );
}
