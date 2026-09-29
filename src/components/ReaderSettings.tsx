"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Sun, UnfoldVertical, Keyboard } from "lucide-react";

type Width = "narrow" | "wide" | "full";

export default function ReaderSettings({
  prevHref,
  nextHref,
}: {
  prevHref: string | null;
  nextHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [width, setWidth] = useState<Width>("narrow");
  const router = useRouter();

  // Kayıtlı ayarları yükle + uygula
  useEffect(() => {
    try {
      const b = parseInt(localStorage.getItem("reader-brightness") || "100");
      const w = (localStorage.getItem("reader-width") || "narrow") as Width;
      if (!isNaN(b)) setBrightness(Math.min(130, Math.max(40, b)));
      if (["narrow", "wide", "full"].includes(w)) setWidth(w);
    } catch { /* yoksay */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("reader-brightness", String(brightness));
      localStorage.setItem("reader-width", width);
    } catch { /* yoksay */ }
    const root = document.getElementById("reader-images");
    if (root) {
      root.style.filter = `brightness(${brightness}%)`;
      root.classList.remove("max-w-3xl", "max-w-5xl", "max-w-full");
      root.classList.add(width === "narrow" ? "max-w-3xl" : width === "wide" ? "max-w-5xl" : "max-w-full");
    }
  }, [brightness, width]);

  // Klavye: sağ/sol ok = sonraki/önceki bölüm
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-light border border-white/10 text-sm text-gray-300 hover:text-white hover:border-primary/40 transition-all"
        title="Okuma ayarları"
      >
        <Settings2 className="w-4 h-4" /> Okuma Modu
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl border border-white/10 p-4 shadow-2xl z-50 space-y-4">
          <div>
            <label className="text-xs text-gray-400 flex items-center gap-1.5 mb-2">
              <Sun className="w-3.5 h-3.5" /> Parlaklık %{brightness}
            </label>
            <input
              type="range"
              min={40}
              max={130}
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 flex items-center gap-1.5 mb-2">
              <UnfoldVertical className="w-3.5 h-3.5" /> Sayfa genişliği
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["narrow", "wide", "full"] as Width[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWidth(w)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    width === w ? "bg-primary/20 border-primary/50 text-primary" : "bg-surface border-white/10 text-gray-400"
                  }`}
                >
                  {w === "narrow" ? "Dar" : w === "wide" ? "Geniş" : "Tam"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" /> ← → tuşlarıyla bölüm değiştir
          </p>
        </div>
      )}
    </div>
  );
}
