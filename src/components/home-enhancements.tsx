"use client";

import { useEffect, useState } from "react";

export function HomeEnhancements() {
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={[
        "home-back-top retro-focus",
        showBackTop ? "home-back-top--visible" : "",
      ].join(" ")}
      aria-label="Kembali ke atas halaman"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden>↑</span>
    </button>
  );
}
