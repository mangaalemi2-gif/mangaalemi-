"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ReaderMode = "scroll" | "page";

export function getReaderMode(): ReaderMode {
  try {
    return localStorage.getItem("reader-mode") === "page" ? "page" : "scroll";
  } catch {
    return "scroll";
  }
}

export function setReaderMode(mode: ReaderMode) {
  try {
    localStorage.setItem("reader-mode", mode);
  } catch { /* yoksay */ }
  window.dispatchEvent(new CustomEvent("reader-mode-change", { detail: mode }));
}

// Sayfa sayfa okuma: #reader-images içinden tek resmi gösterir
export default function PageNavigator({ total }: { total: number }) {
  const [mode, setMode] = useState<ReaderMode>("scroll");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMode(getReaderMode());
    function onChange(e: Event) {
      setMode((e as CustomEvent<ReaderMode>).detail);
    }
    window.addEventListener("reader-mode-change", onChange);
    return () => window.removeEventListener("reader-mode-change", onChange);
  }, []);

  // Görünürlüğü uygula
  useEffect(() => {
    const root = document.getElementById("reader-images");
    if (!root) return;
    const imgs = root.querySelectorAll("img");
    imgs.forEach((img, i) => {
      (img as HTMLElement).style.display = mode === "page" && i !== page ? "none" : "";
    });
    if (mode === "page") {
      root.scrollIntoView({ block: "start" });
    }
  }, [mode, page, total]);

  // Klavye: sayfa modunda yukarı/aşağı = sayfa
  useEffect(() => {
    if (mode !== "page") return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") setPage((p) => Math.min(total - 1, p + 1));
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, total]);

  if (mode !== "page") return null;

  return (
    <div className="sticky bottom-4 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 glass-panel px-3 py-2 rounded-full shadow-2xl">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="p-2 rounded-full bg-surface-light text-white hover:text-primary transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-white min-w-[64px] text-center">
          {page + 1} / {total}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="p-2 rounded-full bg-surface-light text-white hover:text-primary transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
