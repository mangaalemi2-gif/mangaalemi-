import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import mangaManifest from "@/data/manga-manifest.json";
import ReadingTracker from "./ReadingTracker";
import ReaderSettings from "@/components/ReaderSettings";
import ReadingProgress from "@/components/ReadingProgress";
import PageNavigator from "@/components/PageNavigator";
import ChapterActions from "@/components/ChapterActions";
import CommentSection from "@/components/CommentSection";

// Manifest'ten bölüm görselleri al
function getChapterImages(slug: string, chapter: string): string[] {
  try {
    const chapterDirName = `Chapter${chapter}`;
    const key = `${slug}/${chapterDirName}`;
    return (mangaManifest as Record<string, string[]>)[key] || [];
  } catch (error) {
    console.error("Görsel okunurken hata:", error);
    return [];
  }
}

// Manifest'ten toplam bölüm sayısını bul
function getTotalChapters(slug: string): number {
  const manifest = mangaManifest as Record<string, string[]>;
  let max = 0;
  for (const key of Object.keys(manifest)) {
    if (key.startsWith(slug + "/")) {
      const num = parseInt(key.split("/")[1].replace("Chapter", ""));
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; chapter: string }> }): Promise<Metadata> {
  const { slug, chapter } = await params;
  const { getManga } = await import("@/data/mangas");
  const meta = getManga(slug);
  return {
    title: meta ? `${meta.title} Bölüm ${chapter} Oku - MangaAlemi` : `Bölüm ${chapter} - MangaAlemi`,
    description: meta ? `${meta.title} ${chapter}. bölümü Türkçe oku.` : undefined,
  };
}

export default async function ReaderPage({ params }: { params: Promise<{ slug: string; chapter: string }> }) {
  const resolvedParams = await params;
  const { slug, chapter } = resolvedParams;
  const images: string[] = getChapterImages(slug, chapter);
  const totalChapters = getTotalChapters(slug);

  const currentChapter = parseInt(chapter);
  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const nextChapter = currentChapter < totalChapters ? currentChapter + 1 : null;

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-500">Bölüm Bulunamadı</h1>
        <p className="text-gray-400">
          Aranan dosya yolu: public/mangas/{slug}/Chapter{chapter}
        </p>
        <Link href={`/manga/${slug}`} className="text-primary hover:underline">
          Manga sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full -mt-8">
      {/* Okuma geçmişi takip (client component) */}
      <ReadingTracker mangaSlug={slug} chapterNumber={currentChapter} totalPages={images.length} />
      <ReadingProgress />

      {/* Üst Kontrol Barı */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-white/10 py-3 px-4 flex items-center justify-between gap-2 mb-8 rounded-b-2xl shadow-lg">
        <Link
          href={`/manga/${slug}`}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" /> Detaylar
        </Link>
        <span className="font-bold text-white text-center flex-1">Bölüm {chapter}</span>
        <ReaderSettings
          prevHref={prevChapter ? `/manga/${slug}/${prevChapter}` : null}
          nextHref={nextChapter ? `/manga/${slug}/${nextChapter}` : null}
        />
      </div>

      <div className="flex justify-center mb-6">
        <ChapterActions mangaSlug={slug} chapter={chapter} />
      </div>

      {/* Okuyucu Alanı (Webtoon stili - Dikey Kaydırma) */}
      <div id="reader-images" className="flex flex-col items-center w-full shadow-2xl bg-black rounded-lg overflow-hidden mx-auto max-w-3xl">
        {images.map((src: string, index: number) => (
          <img
            key={index}
            src={src}
            alt={`Sayfa ${index + 1}`}
            className="w-full max-w-full h-auto block m-0 select-none"
            loading="lazy"
          />
        ))}
      </div>
      <PageNavigator total={images.length} />

      {/* Alt Navigasyon Barı */}
      <div className="flex items-center justify-between mt-12 mb-8 glass-panel p-4 rounded-full">
        {prevChapter ? (
          <Link
            href={`/manga/${slug}/${prevChapter}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-surface-light text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Önceki
          </Link>
        ) : (
          <div className="px-6 py-3 text-gray-600 flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" /> Önceki
          </div>
        )}

        <Link
          href={`/manga/${slug}`}
          className="p-3 bg-surface-light rounded-full text-white hover:text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </Link>

        {nextChapter ? (
          <Link
            href={`/manga/${slug}/${nextChapter}`}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          >
            Sonraki <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <div className="px-6 py-3 text-gray-600 flex items-center gap-2">
            Sonraki <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Bağış / Destek Kutusu */}
      <div className="glass-panel p-6 rounded-3xl text-center max-w-xl mx-auto border-accent/20 mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Çevirmeni Destekle ☕</h3>
        <p className="text-gray-400 text-sm mb-4">
          Bu bölümü okuduğunuz için teşekkürler! Çevirmene destek olmak isterseniz aşağıdaki butona tıklayabilirsiniz.
        </p>
        <button className="px-6 py-2 rounded-full bg-gradient-to-r from-accent to-purple-500 text-white font-bold hover:shadow-[0_0_20px_rgba(157,0,255,0.4)] transition-all">
          Bağış Yap
        </button>
      </div>

      {/* Bölüm Yorumları */}
      <CommentSection type="chapter" slug={slug} chapter={chapter} />

      {/* Site Geliştirme Önerileri */}
      <CommentSection type="feedback" />
    </div>
  );
}
