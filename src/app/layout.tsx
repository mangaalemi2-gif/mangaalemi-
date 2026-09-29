import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MangaAlemi - Ücretsiz Manga ve Webtoon Oku",
  description: "Modern, hızlı ve kesintisiz manga okuma platformu. Favori serilerini takip et!",
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){document.documentElement.classList.add("dark")}}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="w-full glass-panel py-6 text-center text-sm text-gray-400 mt-auto">
          <p>© 2026 MangaAlemi. Tüm hakları saklıdır.</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <a href="/ara" className="hover:text-white transition-colors">Keşfet</a>
            <span className="text-gray-700">•</span>
            <a href="/sohbet" className="hover:text-white transition-colors">Sohbet</a>
            <span className="text-gray-700">•</span>
            <a href="/anketler" className="hover:text-white transition-colors">Anketler</a>
            <span className="text-gray-700">•</span>
            <a href="/liderlik" className="hover:text-white transition-colors">Liderlik</a>
            <span className="text-gray-700">•</span>
            <a href="/duyurular" className="hover:text-white transition-colors">Duyurular</a>
            <span className="text-gray-700">•</span>
            <a href="/destek" className="hover:text-white transition-colors">Destek</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
