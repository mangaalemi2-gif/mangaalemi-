"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { getManga, mangaCover } from "@/data/mangas";

interface Entry {
  mangaSlug: string;
  chapterNumber: number;
  pageNumber: number;
}

export default function ContinueReading() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reading-history");
        if (res.ok) {
          const data = (await res.json()) as any;
          setEntries((data.history || []).slice(0, 3));
        }
      } finally {
        setDone(true);
      }
    }
    load();
  }, []);

  if (!done || entries.length === 0) return null;

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8 border border-primary/20 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
      <h2 className="text-xl font-bold text-white mb-4 relative z-10">Kaldığın Yerden Devam Et</h2>
      <div className="grid sm:grid-cols-3 gap-3 relative z-10">
        {entries.map((e) => {
          const meta = getManga(e.mangaSlug);
          return (
            <Link
              key={e.mangaSlug}
              href={`/manga/${e.mangaSlug}/${e.chapterNumber}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-surface-light/50 border border-white/5 hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                {meta ? (
                  <img src={mangaCover(meta)} alt={meta.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                    {e.mangaSlug.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                  {meta?.title || e.mangaSlug}
                </p>
                <p className="text-xs text-gray-500">Bölüm {e.chapterNumber}</p>
              </div>
              <span className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-current" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
