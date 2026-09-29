"use client";

import { useState, useEffect } from "react";
import { Circle } from "lucide-react";

export default function OnlineNow() {
  const [count, setCount] = useState(0);
  const [sample, setSample] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/online");
        if (res.ok && alive) {
          const data = (await res.json()) as any;
          setCount(data.count || 0);
          setSample(data.sample || []);
        }
      } catch { /* yoksay */ }
    }
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs text-primary font-bold"
      title={sample.length > 0 ? `Çevrimiçi: ${sample.join(", ")}${count > sample.length ? ` +${count - sample.length}` : ""}` : "Çevrimiçi üyeler"}
    >
      <Circle className="w-2 h-2 fill-current animate-pulse" />
      {count} çevrimiçi
    </div>
  );
}
