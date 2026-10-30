"use client";

import type { ReactNode } from "react";
import { trackContact } from "@/lib/tracking";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Tautan WhatsApp yang mengirim event konversi Contact (semua platform iklan) saat diklik. */
export function WhatsAppLink({ href, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={trackContact}
    >
      {children}
    </a>
  );
}
