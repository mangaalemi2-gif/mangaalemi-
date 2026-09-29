import CommentSection from "@/components/CommentSection";
import { MessagesSquare, ShieldCheck, Ban, Heart } from "lucide-react";

export const metadata = {
  title: "Genel Sohbet - MangaAlemi",
  description: "Toplulukla sohbet et, manga konuş, arkadaş edin.",
};

export default function SohbetPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <MessagesSquare className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-extrabold text-white">Genel Sohbet</h1>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Tüm topluluğun buluşma noktası. Manga, anime, bölüm teorileri — aklında ne varsa yaz. Yazdıkça birikir, beğenilerle öne çıkar.
          </p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-surface-light/50 border border-white/5 rounded-xl px-3 py-2 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-primary" /> Küfür / hakaret yasak
            </div>
            <div className="flex items-center gap-2 bg-surface-light/50 border border-white/5 rounded-xl px-3 py-2 text-gray-300">
              <Ban className="w-4 h-4 text-red-400" /> Spam / reklam yasak
            </div>
            <div className="flex items-center gap-2 bg-surface-light/50 border border-white/5 rounded-xl px-3 py-2 text-gray-300">
              <Heart className="w-4 h-4 text-accent" /> Saygılı ol, beğeniyi esirgeme
            </div>
          </div>
        </div>
      </div>

      <CommentSection type="chat" />
    </div>
  );
}
