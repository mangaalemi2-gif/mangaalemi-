"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";

interface Chapter {
  number: number;
  raw: string;
  pageCount: number;
}

export default function MangaChapters({ slug, chapters }: { slug: string; chapters: Chapter[] }) {
  const [readMap, setReadMap] = useState<Record<number, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reading-history");
        if (!res.ok) return;
        const data = (await res.json()) as any;
        const map: Record<number, number> = {};
        for (const h of data.history || []) {
          if (h.mangaSlug === slug) map[h.chapterNumber] = h.pageNumber;
        }
        setReadMap(map);
      } catch { /* yoksay */ }
    }
    load();
  }, [slug]);

  // Kaldığın yer: okunan en yüksek bölüm
  const readChapters = Object.keys(readMap).map(Number);
  const lastRead = readChapters.length > 0 ? Math.max(...readChapters) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      {chapters.map((ch) => {
        const isRead = ch.number in readMap;
        const isLast = ch.number === lastRead;
        return (
          <Link key={ch.raw} href={`/manga/${slug}/${ch.raw}`}>
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
              isLast
                ? "bg-primary/10 border-primary/40"
                : "bg-surface-light/50 hover:bg-surface-light border-white/5 hover:border-primary/30"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                  isRead ? "bg-primary/15 text-primary" : "bg-surface text-gray-400 group-hover:text-primary group-hover:bg-primary/10"
                }`}>
                  {isRead ? <CheckCircle2 className="w-5 h-5" /> : ch.raw}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                    Bölüm {ch.raw}
                    {isLast && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">KALDIĞIN YER</span>}
                  </h3>
                  <p className="text-xs text-gray-500">{ch.pageCount} sayfa{isRead ? " • okundu" : ""}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Yüklendi
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
