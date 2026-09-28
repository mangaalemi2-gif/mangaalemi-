import Link from "next/link";
import { Flame, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-surface-light to-surface border border-white/5 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Efsanevi Bir Maceraya <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Hazır Mısın?
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Şu anda platformumuz test aşamasında ve yalnızca tüm zamanların en büyük klasiği olan efsanevi <strong className="text-white">Dragon Ball (1984)</strong> yayında! Son Goku'nun maceralarını reklamsız, süper hızlı ve tamamen ücretsiz oku.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/manga/dragon-ball-1984" className="px-8 py-3 rounded-full bg-primary text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(57,255,20,0.4)]">
              Dragon Ball Oku
            </Link>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 right-24 w-96 h-96 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
      </section>

      {/* Popüler Seriler (Sadece Dragon Ball) */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Yayındaki Seriler</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <Link href="/manga/dragon-ball-1984">
            <div className="group relative rounded-xl overflow-hidden bg-surface-light aspect-[2/3] cursor-pointer hover:shadow-[0_0_20px_rgba(157,0,255,0.3)] transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 p-4 z-20 w-full">
                <span className="inline-block px-2 py-1 bg-accent/80 text-white text-xs font-bold rounded mb-2">Manga</span>
                <h3 className="font-bold text-white line-clamp-2">Dragon Ball</h3>
                <p className="text-xs text-primary mt-1">Yıl: 1984</p>
              </div>
              <div className="w-full h-full bg-orange-900 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center text-4xl shadow-inner">
                🐉
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
