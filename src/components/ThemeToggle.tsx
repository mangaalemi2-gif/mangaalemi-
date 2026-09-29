"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function getInitialTheme(): "dark" | "light" {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* yoksay */ }
  return "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch { /* yoksay */ }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-surface-light transition-all"
      title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
