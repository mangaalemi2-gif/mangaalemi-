"use client";
import { useEffect } from "react";

interface Props {
  mangaSlug: string;
  chapterNumber: number;
  totalPages: number;
}

export default function ReadingTracker({ mangaSlug, chapterNumber, totalPages }: Props) {
  useEffect(() => {
    // Sayfa yüklendiğinde okuma geçmişini kaydet + görüntülenme say
    async function trackReading() {
      try {
        await fetch("/api/reading-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mangaSlug,
            chapterNumber,
            pageNumber: totalPages, // Bölümü açtığında son sayfa olarak kaydeder
          }),
        });
      } catch {
        // Giriş yapılmamışsa sessizce geç
      }
      try {
        await fetch("/api/chapters/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: mangaSlug, chapter: String(chapterNumber), action: "view" }),
        });
      } catch {
        // Sayaç hatası okumayı engellemesin
      }
    }
    trackReading();
  }, [mangaSlug, chapterNumber, totalPages]);

  return null; // Bu sadece bir takip bileşenidir, UI render etmez
}
