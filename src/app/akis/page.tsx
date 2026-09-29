"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, Star, Heart, UserPlus } from "lucide-react";

interface Item {
  kind: "comment" | "rating" | "favorite";
  username: string | null;
  userId: string;
  content?: string;
  context?: string;
  slug?: string | null;
  chapter?: string | null;
  mangaSlug?: string;
  score?: number;
  ts: number;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function AkisPage() {
  const [feed, setFeed] = useState<Item[]>([]);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/feed");
        if (res.status === 401) {
          setLoggedIn(false);
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as any;
          setFeed(data.feed || []);
          setFollowing(data.following || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">Yükleniyor...</div>;

  if (!loggedIn) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Users className="w-14 h-14 text-gray-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Akışı görmek için giriş yap</h1>
        <Link href="/login" className="text-primary hover:underline text-sm">Giriş Yap</Link>
      </div>
    );
  }

  function describe(item: Item) {
    const name = item.username || "?";
    if (item.kind === "comment") {
      const where =
        item.context === "chat" ? "Genel Sohbet'e" : item.context === "feedback" ? "Önerilere" : item.context === "manga" ? `${item.slug} serisine` : `${item.slug} / Bölüm ${item.chapter}'e`;
      const link =
        item.context === "chat" ? "/sohbet" : item.context === "feedback" ? "/" : item.context === "manga" ? `/manga/${item.slug}` : `/manga/${item.slug}/${item.chapter}`;
      return { icon: MessageSquare, text: `${where} yorum yazdı`, body: item.content, link };
    }
    if (item.kind === "rating") {
      return { icon: Star, text: `${item.mangaSlug} serisine ${item.score}/10 puan verdi`, body: null as string | null, link: `/manga/${item.mangaSlug}` };
    }
    return { icon: Heart, text: `${item.mangaSlug} serisini favorilere ekledi`, body: null as string | null, link: `/manga/${item.mangaSlug}` };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-3xl font-extrabold text-white">Arkadaş Akışı</h1>
            <p className="text-gray-400 text-sm mt-1">{following} kişi takip ediyorsun</p>
          </div>
        </div>
      </div>

      {following === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-white/10">
          <UserPlus className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz kimseyi takip etmiyorsun. Profillerden kullanıcıları takip et, aktiviteleri burada gör.</p>
          <Link href="/sohbet" className="inline-block mt-4 px-6 py-2 rounded-full bg-primary text-black text-sm font-bold hover:scale-105 transition-transform">
            Sohbete Git
          </Link>
        </div>
      ) : feed.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-sm">Takip ettiklerinden henüz aktivite yok.</p>
      ) : (
        <div className="space-y-3">
          {feed.map((item, i) => {
            const d = describe(item);
            const Icon = d.icon;
            return (
              <Link key={`${item.kind}-${i}`} href={d.link} className="block glass-panel rounded-2xl p-4 border border-white/10 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-bold text-white">{item.username || "?"}</span>{" "}
                    <span className="text-gray-400">{d.text}</span>
                  </span>
                  <span className="ml-auto text-[11px] text-gray-600 flex-shrink-0">{timeAgo(item.ts)}</span>
                </div>
                {d.body && <p className="text-sm text-gray-300 ml-6 line-clamp-2">{d.body}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
