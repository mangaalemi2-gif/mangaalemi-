import Link from "next/link";
import { BookOpen, Star, Clock } from "lucide-react";
import mangaManifest from "@/data/manga-manifest.json";
import { getManga, mangaCover } from "@/data/mangas";
import CommentSection from "@/components/CommentSection";
import FavoriteButton from "@/components/FavoriteButton";
import RatingWidget from "@/components/RatingWidget";
import SeriesFollowButton from "@/components/SeriesFollowButton";
import Recommendations from "@/components/Recommendations";
import MyListButton from "@/components/MyListButton";

// Manifest'ten bölüm listesi çıkar
function getChapters(slug: string) {
  const manifest = mangaManifest as Record<string, string[]>;
  const chapters: { number: number; pageCount: number }[] = [];

  for (const key of Object.keys(manifest)) {
    if (key.startsWith(slug + "/")) {
      const chapterName = key.split("/")[1]; // "Chapter1" gibi
      const num = parseInt(chapterName.replace("Chapter", ""));
      if (!isNaN(num)) {
        chapters.push({ number: num, pageCount: manifest[key].length });
      }
    }
  }

  return chapters.sort((a, b) => a.number - b.number);
}

export default async function MangaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const chapters = getChapters(slug);
  const meta = getManga(slug) || {
    title: "Bilinmeyen Manga",
    author: "Bilinmiyor",
    description: "Bu manga hakkında henüz bir açıklama girilmemiş.",
    genres: ["Manga"],
    year: "-" as any,
    coverExt: "png",
    slug,
  };

  const manga = {
    ...meta,
    status: chapters.length > 0 ? "Devam Ediyor" : "Bilinmiyor",
    cover: mangaCover(meta as any),
  };
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Manga Üst Bilgi (Hero) */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border-white/10 p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

        {/* Kapak */}
        <div className="w-full md:w-72 flex-shrink-0 relative group">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/5 relative z-10">
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Detaylar */}
        <div className="flex-1 z-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
              {manga.status}
            </span>
            <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
              <Star className="w-4 h-4 fill-current" /> Üye Puanı
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{manga.title}</h1>
          <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
            <span className="font-medium text-white">{manga.author}</span> • Yıl: {manga.year}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {manga.genres.map((g: string) => (
              <span
                key={g}
                className="px-3 py-1 bg-surface-light text-gray-300 text-xs font-medium rounded border border-white/5 hover:border-accent transition-colors cursor-pointer"
              >
                {g}
              </span>
            ))}
          </div>

          <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base">{manga.description}</p>

          <div className="mb-6">
            <RatingWidget mangaSlug={slug} />
          </div>

          <div className="flex items-center gap-4 mt-auto flex-wrap">
            <Link
              href={`/manga/${slug}/1`}
              className="px-8 py-3 rounded-full bg-primary text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(57,255,20,0.3)]"
            >
              <BookOpen className="w-5 h-5" /> İlk Bölümü Oku
            </Link>
            <FavoriteButton mangaSlug={slug} />
            <SeriesFollowButton mangaSlug={slug} />
            <MyListButton mangaSlug={slug} />
          </div>
        </div>
      </div>

      {/* Bölüm Listesi */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" /> Bölümler
          </h2>
          <span className="text-gray-400 text-sm font-medium">{chapters.length} Bölüm Yüklü</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {chapters.map((ch) => (
            <Link key={ch.number} href={`/manga/${slug}/${ch.number}`}>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 hover:bg-surface-light border border-white/5 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    {ch.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                      Bölüm {ch.number}
                    </h3>
                    <p className="text-xs text-gray-500">{ch.pageCount} sayfa</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Yüklendi
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Manga Yorumları */}
      <CommentSection type="manga" slug={slug} />

      {/* Öneriler */}
      <Recommendations mangaSlug={slug} />
    </div>
  );
}
