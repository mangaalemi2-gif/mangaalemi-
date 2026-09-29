import Link from "next/link";
import { Flame } from "lucide-react";
import FeaturedHero from "@/components/FeaturedHero";
import MonthlyVote from "@/components/MonthlyVote";
import ContinueReading from "@/components/ContinueReading";
import { MANGAS, mangaCover } from "@/data/mangas";
import mangaManifest from "@/data/manga-manifest.json";

function chapterCount(slug: string): number {
  return Object.keys(mangaManifest as Record<string, string[]>).filter((k) => k.startsWith(slug + "/")).length;
}

export default function Home() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <FeaturedHero />
      <ContinueReading />
      <MonthlyVote />

      {/* Popüler Seriler */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Yayındaki Seriler</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {MANGAS.map((manga) => (
            <Link key={manga.slug} href={`/manga/${manga.slug}`}>
              <div className="group relative rounded-xl overflow-hidden bg-surface-light aspect-[2/3] cursor-pointer hover:shadow-[0_0_20px_rgba(157,0,255,0.3)] transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 p-4 z-20 w-full keep-white">
                  <span className="inline-block px-2 py-1 bg-accent/80 text-white text-xs font-bold rounded mb-2">Manga</span>
                  <h3 className="font-bold text-white line-clamp-2">{manga.title}</h3>
                  <p className="text-xs text-primary mt-1">{manga.year} • {chapterCount(manga.slug)} bölüm</p>
                </div>
                <div className="w-full h-full bg-surface group-hover:scale-110 transition-transform duration-500 flex items-center justify-center text-4xl shadow-inner">
                  <img src={mangaCover(manga)} alt={manga.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
