import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Tautan WhatsApp di section kontak — klik di-track lewat <ClickTracker> (`whatsapp_contact`). */
export function WhatsAppLink({ href, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-track="whatsapp_contact"
    >
      {children}
    </a>
  );
}
