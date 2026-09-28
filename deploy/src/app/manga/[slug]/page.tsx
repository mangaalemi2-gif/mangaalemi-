import Link from "next/link";
import { BookOpen, Star, Clock, Info, Heart } from "lucide-react";

export default async function MangaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  // Gerçek uygulamada slug parametresi ile D1'den manga detayları ve bölüm listesi çekilecek
  // Şimdilik Dragon Ball mock verisini kullanıyoruz
  const isDragonBall = slug === "dragon-ball-1984";
  
  const manga = {
    title: isDragonBall ? "Dragon Ball" : "Bilinmeyen Manga",
    author: "Akira Toriyama",
    status: "Tamamlandı",
    rating: "9.8/10",
    description: "Son Goku, derin dağlarda tek başına yaşayan saf ve güçlü bir çocuktur. Bir gün Bulma adında bir kızla tanışır ve yedi efsanevi Ejder Topu'nu bulmak için inanılmaz bir maceraya atılırlar. Topları toplayan kişinin herhangi bir dileği gerçekleşecektir!",
    cover: "/mangas/dragon-ball-1984/Chapter1/1.jpg", // İlk bölümün kapağı
    genres: ["Aksiyon", "Macera", "Komedi", "Fantastik", "Shounen"],
    chapters: [
      { number: 1, title: "Bulma ve Son Goku", views: "1.2M", date: "20 Nisa 1984" },
      { number: 2, title: "Toplar Yok!", views: "850B", date: "27 Nisa 1984" },
      { number: 3, title: "Goku'nun Deniz'e Doğru Koşusu", views: "720B", date: "4 May 1984" },
      { number: 4, title: "Kamesennin'in Uçan Bulutu", views: "650B", date: "11 May 1984" },
    ]
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Manga Üst Bilgi (Hero) */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border-white/10 p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        
        {/* Kapak */}
        <div className="w-full md:w-72 flex-shrink-0 relative group">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/5 relative z-10">
            {/* Kapak resmi (next/image veya img kullanabiliriz, şimdilik img kullanıyoruz) */}
            <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        {/* Detaylar */}
        <div className="flex-1 z-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
              {manga.status}
            </span>
            <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
              <Star className="w-4 h-4 fill-current" /> {manga.rating}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{manga.title}</h1>
          <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
            <span className="font-medium text-white">{manga.author}</span> • Yıl: 1984
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {manga.genres.map(g => (
              <span key={g} className="px-3 py-1 bg-surface-light text-gray-300 text-xs font-medium rounded border border-white/5 hover:border-accent transition-colors cursor-pointer">
                {g}
              </span>
            ))}
          </div>

          <p className="text-gray-300 leading-relaxed mb-8 text-sm md:text-base">
            {manga.description}
          </p>

          <div className="flex items-center gap-4 mt-auto">
            <Link href={`/manga/${slug}/1`} className="px-8 py-3 rounded-full bg-primary text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(57,255,20,0.3)]">
              <BookOpen className="w-5 h-5" /> İlk Bölümü Oku
            </Link>
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-light border border-white/10 text-white hover:text-red-500 hover:border-red-500/50 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bölüm Listesi */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" /> Bölümler
          </h2>
          <span className="text-gray-400 text-sm font-medium">{manga.chapters.length} Bölüm Yüklü</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {manga.chapters.map((ch) => (
            <Link key={ch.number} href={`/manga/${slug}/${ch.number}`}>
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 hover:bg-surface-light border border-white/5 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    {ch.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors">Bölüm {ch.number}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{ch.title}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {ch.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
