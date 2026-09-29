"use client";

import { useEffect } from "react";

// Çift tık / çift dokunuşla yakınlaştır (tıklanan noktayı ortalar)
export default function ZoomableImages() {
  useEffect(() => {
    const root = document.getElementById("reader-images");
    if (!root) return;

    function onDblClick(e: MouseEvent) {
      const img = (e.target as HTMLElement).closest("img");
      if (!img) return;
      const el = img as HTMLImageElement;
      if (el.dataset.zoomed === "1") {
        el.dataset.zoomed = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.cursor = "";
      } else {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.dataset.zoomed = "1";
        el.style.transformOrigin = `${x}% ${y}%`;
        el.style.transform = "scale(1.8)";
        el.style.cursor = "zoom-out";
      }
    }

    // Mobil çift dokunuş
    let lastTap = 0;
    function onTouchEnd(e: TouchEvent) {
      const now = Date.now();
      if (now - lastTap < 350) {
        const t = e.changedTouches[0];
        const fake = new MouseEvent("dblclick", { clientX: t.clientX, clientY: t.clientY, bubbles: true });
        (e.target as HTMLElement).dispatchEvent(fake);
        e.preventDefault();
      }
      lastTap = now;
    }

    root.addEventListener("dblclick", onDblClick);
    root.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      root.removeEventListener("dblclick", onDblClick);
      root.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
