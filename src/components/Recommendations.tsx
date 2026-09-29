"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { MangaMeta } from "@/data/mangas";
import { mangaCover } from "@/data/mangas";

export default function Recommendations({ mangaSlug }: { mangaSlug: string }) {
  const [items, setItems] = useState<MangaMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recommendations?slug=${encodeURIComponent(mangaSlug)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setItems(data.recommendations || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mangaSlug]);

  if (loading || items.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/10">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-5 text-white">
        <Sparkles className="w-5 h-5 text-yellow-400" /> Bunu Sevenler Bunları da Sevdi
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((m) => (
          <Link key={m.slug} href={`/manga/${m.slug}`}>
            <div className="group relative rounded-xl overflow-hidden bg-surface-light aspect-[2/3] hover:shadow-[0_0_20px_rgba(57,255,20,0.25)] transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 p-3 z-20 w-full keep-white">
                <h3 className="font-bold text-white text-sm line-clamp-2">{m.title}</h3>
                <p className="text-[11px] text-gray-400">{m.author}</p>
              </div>
              <img src={mangaCover(m)} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
