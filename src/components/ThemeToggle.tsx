"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Palette, Check } from "lucide-react";

export const ACCENTS: { name: string; hex: string; rgb: string }[] = [
  { name: "Mor", hex: "#9D00FF", rgb: "157 0 255" },
  { name: "Yeşil", hex: "#22c55e", rgb: "34 197 94" },
  { name: "Mavi", hex: "#3b82f6", rgb: "59 130 246" },
  { name: "Turuncu", hex: "#f97316", rgb: "249 115 22" },
  { name: "Pembe", hex: "#ec4899", rgb: "236 72 153" },
  { name: "Kırmızı", hex: "#ef4444", rgb: "239 68 68" },
];

export function applyAccent(rgb: string) {
  document.documentElement.style.setProperty("--c-accent", rgb);
  try {
    localStorage.setItem("accent", rgb);
  } catch { /* yoksay */ }
}

export function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch { /* yoksay */ }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState(ACCENTS[0].rgb);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    try {
      const saved = localStorage.getItem("accent");
      if (saved) setAccent(saved);
      // Üye rengi varsa onu uygula
      fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: any) => {
          const preset = ACCENTS.find((a) => a.hex.toLowerCase() === String(d?.user?.accent || "").toLowerCase());
          if (preset) {
            setAccent(preset.rgb);
            applyAccent(preset.rgb);
          }
        })
        .catch(() => {});
    } catch { /* yoksay */ }
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  function pick(rgb: string) {
    setAccent(rgb);
    applyAccent(rgb);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-surface-light transition-all"
        title="Tema ayarları"
      >
        <Palette className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 glass-panel rounded-2xl border border-white/10 p-4 shadow-2xl z-50 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">Görünüm</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={toggleTheme}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                    theme === t ? "bg-primary/20 border-primary/50 text-primary" : "bg-surface border-white/10 text-gray-400"
                  }`}
                >
                  {t === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {t === "dark" ? "Koyu" : "Açık"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Vurgu rengi</p>
            <div className="flex gap-2 flex-wrap">
              {ACCENTS.map((a) => (
                <button
                  key={a.hex}
                  onClick={() => pick(a.rgb)}
                  title={a.name}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ backgroundColor: a.hex }}
                >
                  {accent === a.rgb && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
