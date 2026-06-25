"use client";

import type { ReactNode } from "react";
import { trackPixel } from "@/lib/meta-pixel";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Tautan WhatsApp yang mengirim event Meta Pixel `Contact` saat diklik. */
export function WhatsAppLink({ href, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackPixel("Contact")}
    >
      {children}
    </a>
  );
}
