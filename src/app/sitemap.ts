import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { MANGAS } from "@/data/mangas";
import mangaManifest from "@/data/manga-manifest.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = [
    "",
    "/ara",
    "/sohbet",
    "/anketler",
    "/liderlik",
    "/duyurular",
    "/destek",
    "/seri-oner",
    "/login",
    "/register",
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.6,
  }));

  for (const m of MANGAS) {
    entries.push({
      url: `${SITE_URL}/manga/${m.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // Bölüm sayfaları
  const chapters = new Set<string>();
  for (const key of Object.keys(mangaManifest as Record<string, string[]>)) {
    const [slug, ch] = key.split("/");
    if (slug && ch) {
      const num = ch.replace("Chapter", "");
      chapters.add(`${slug}/${num}`);
    }
  }
  for (const c of chapters) {
    entries.push({
      url: `${SITE_URL}/manga/${c}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
