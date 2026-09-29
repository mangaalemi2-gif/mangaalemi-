"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Shuffle, Star } from "lucide-react";
import { MANGAS, ALL_GENRES, mangaCover } from "@/data/mangas";

type Sort = "az" | "year-desc" | "year-asc";

export default function AraPage() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("az");
  const router = useRouter();

  const results = useMemo(() => {
    let list = [...MANGAS];
    if (q.trim()) {
      const needle = q.trim().toLocaleLowerCase("tr");
      list = list.filter(
        (m) =>
          m.title.toLocaleLowerCase("tr").includes(needle) ||
          m.author.toLocaleLowerCase("tr").includes(needle)
      );
    }
    if (genre !== "all") list = list.filter((m) => m.genres.includes(genre));
    if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    if (sort === "year-desc") list.sort((a, b) => b.year - a.year);
    if (sort === "year-asc") list.sort((a, b) => a.year - b.year);
    return list;
  }, [q, genre, sort]);

  function random() {
    const pick = MANGAS[Math.floor(Math.random() * MANGAS.length)];
    router.push(`/manga/${pick.slug}`);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-4">Keşfet</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Manga veya yazar ara..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="px-4 py-3 rounded-xl bg-surface border border-white/10 text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value="all">Tüm Türler</option>
              {ALL_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="px-4 py-3 rounded-xl bg-surface border border-white/10 text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value="az">A-Z</option>
              <option value="year-desc">Yeniden eskiye</option>
              <option value="year-asc">Eskiden yeniye</option>
            </select>
            <button
              onClick={random}
              className="px-5 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:scale-105 transition-transform flex items-center gap-2 justify-center"
            >
              <Shuffle className="w-4 h-4" /> Rastgele
            </button>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p>Sonuç bulunamadı. Farklı bir arama dene.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {results.map((m) => (
            <Link key={m.slug} href={`/manga/${m.slug}`}>
              <div className="group relative rounded-xl overflow-hidden bg-surface-light aspect-[2/3] cursor-pointer hover:shadow-[0_0_20px_rgba(157,0,255,0.3)] transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 p-4 z-20 w-full">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.genres.slice(0, 2).map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-accent/80 text-white text-[10px] font-bold rounded">{g}</span>
                    ))}
                  </div>
                  <h3 className="font-bold text-white line-clamp-2">{m.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{m.author} • {m.year}</p>
                </div>
                <div className="w-full h-full bg-surface group-hover:scale-110 transition-transform duration-500">
                  <img src={mangaCover(m)} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-600 flex items-center justify-center gap-1">
        <Star className="w-3 h-3" /> Puanlar üye oylarıyla oluşur — detay sayfasından 1-10 arası puan verebilirsin.
      </p>
    </div>
  );
}
