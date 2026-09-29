"use client";
import { useEffect } from "react";

interface Props {
  mangaSlug: string;
  chapterNumber: number;
  totalPages: number;
}

export default function ReadingTracker({ mangaSlug, chapterNumber, totalPages }: Props) {
  useEffect(() => {
    // Sayfa yüklendiğinde okuma geçmişini kaydet
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
    }
    trackReading();
  }, [mangaSlug, chapterNumber, totalPages]);

  return null; // Bu sadece bir takip bileşenidir, UI render etmez
}
