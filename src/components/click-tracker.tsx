"use client";

import { useEffect } from "react";
import { trackButtonClick } from "@/lib/tracking";

/**
 * Satu listener untuk semua tombol bertanda `data-track="<key>"` (label opsional
 * lewat `data-track-label`, default teks tombol). Tombol di server component cukup
 * diberi atribut — tidak perlu jadi client component.
 */
export function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      if (!(el instanceof HTMLElement)) return;
      const key = el.dataset.track;
      if (!key) return;
      const label = el.dataset.trackLabel || el.textContent?.replace(/\s+/g, " ").trim() || undefined;
      trackButtonClick(key, label?.slice(0, 100));
    }
    // Capture: tetap tercatat walau handler lain memanggil stopPropagation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
