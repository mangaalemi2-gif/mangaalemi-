"use client";

import { useState, useEffect } from "react";
import { Wrench } from "lucide-react";

export default function BakimPage() {
  const [message, setMessage] = useState("Site şu an bakımda. Kısa süre sonra dönüyoruz.");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/site-status");
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.message) setMessage(data.message);
        }
      } catch { /* yoksay */ }
    }
    load();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="glass-panel rounded-3xl p-10 border border-white/10 text-center max-w-md">
        <Wrench className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-white mb-2">Bakımdayız</h1>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
