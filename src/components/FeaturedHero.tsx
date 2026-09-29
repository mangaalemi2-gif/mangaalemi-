"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MANGAS, type MangaMeta } from "@/data/mangas";

export default function FeaturedHero() {
  const [manga, setManga] = useState<MangaMeta>(MANGAS[0]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/featured");
        if (res.ok) {
          const data = (await res.json()) as any;
          const found = MANGAS.find((m) => m.slug === data.slug);
          if (found) setManga(found);
        }
      } catch { /* yoksay */ }
    }
    load();
  }, []);

  return (
    <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-surface-light to-surface border border-white/5 p-8 sm:p-12 shadow-2xl">
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Efsanevi Bir Maceraya <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Hazır Mısın?
          </span>
        </h1>
        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
          Öne çıkan seri: <strong className="text-white">{manga.title} ({manga.year})</strong> — {manga.author}. {manga.description.slice(0, 120)}...
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={`/manga/${manga.slug}`} className="px-8 py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(57,255,20,0.4)]">
            {manga.title} Oku
          </Link>
          <Link href="/sohbet" className="px-8 py-3 rounded-full bg-surface-light border border-white/10 text-white font-bold hover:border-primary/50 hover:scale-105 transition-all">
            💬 Sohbete Katıl
          </Link>
          <Link href="/anketler" className="px-8 py-3 rounded-full bg-surface-light border border-white/10 text-white font-bold hover:border-accent/50 hover:scale-105 transition-all">
            📊 Anketler
          </Link>
          <Link href="/ara" className="px-8 py-3 rounded-full bg-surface-light border border-white/10 text-white font-bold hover:border-primary/50 hover:scale-105 transition-all">
            🔍 Keşfet
          </Link>
        </div>
      </div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 right-24 w-96 h-96 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
}
