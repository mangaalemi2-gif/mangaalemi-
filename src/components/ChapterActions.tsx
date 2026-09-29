"use client";

import { useState, useEffect } from "react";
import { Heart, Eye } from "lucide-react";

export default function ChapterActions({ mangaSlug, chapter }: { mangaSlug: string; chapter: string }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/chapters/stats?slug=${encodeURIComponent(mangaSlug)}&chapter=${encodeURIComponent(chapter)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setLikes(data.likes || 0);
          setViews(data.views || 0);
          setLiked(!!data.liked);
        }
      } catch { /* yoksay */ }
    }
    load();
  }, [mangaSlug, chapter]);

  async function toggleLike() {
    const prev = liked;
    setLiked(!prev);
    setLikes((n) => n + (prev ? -1 : 1));
    try {
      const res = await fetch("/api/chapters/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: mangaSlug, chapter, action: "like" }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await res.json()) as any;
      if (res.ok) setLiked(data.liked);
      else {
        setLiked(prev);
        setLikes((n) => n + (prev ? 1 : -1));
      }
    } catch {
      setLiked(prev);
      setLikes((n) => n + (prev ? 1 : -1));
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleLike}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-bold transition-all hover:scale-105 ${
          liked ? "bg-red-500/15 border-red-500/50 text-red-400" : "bg-surface-light border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/40"
        }`}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {likes}
      </button>
      <span className="flex items-center gap-1.5 text-sm text-gray-500">
        <Eye className="w-4 h-4" /> {views.toLocaleString("tr-TR")}
      </span>
    </div>
  );
}
