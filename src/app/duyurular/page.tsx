"use client";

import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";

interface Ann {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  username: string | null;
}

export default function DuyurularPage() {
  const [items, setItems] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/announcements");
        if (res.ok) {
          const data = (await res.json()) as any;
          setItems(data.announcements || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-extrabold text-white">Duyurular</h1>
        </div>
        <p className="text-gray-400 text-sm mt-1">Yeni bölümler, etkinlikler ve site haberleri.</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse py-10">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-white/10">
          <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Henüz duyuru yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="glass-panel rounded-2xl p-5 border border-white/10">
              <h3 className="font-bold text-white">{a.title}</h3>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">{a.message}</p>
              <p className="text-[11px] text-gray-600 mt-2">
                {a.username ? `@${a.username}` : ""} • {a.createdAt ? new Date(typeof a.createdAt === "number" ? a.createdAt * 1000 : a.createdAt).toLocaleDateString("tr-TR") : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
