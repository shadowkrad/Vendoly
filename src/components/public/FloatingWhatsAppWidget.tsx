"use client";

import React, { useState } from "react";
import { formattaNumeroWhatsApp, generaLinkWhatsApp } from "@/lib/whatsapp-client";

interface FloatingWhatsAppWidgetProps {
  phone?: string | null;
  brandName?: string;
  defaultMessage?: string;
  className?: string;
}

export default function FloatingWhatsAppWidget({
  phone,
  brandName = "Vendoly Store",
  defaultMessage,
  className = "",
}: FloatingWhatsAppWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!phone || phone.trim() === "") {
    return null;
  }

  const cleanPhone = formattaNumeroWhatsApp(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return null;
  }

  const message =
    defaultMessage ||
    `Ciao! Vorrei maggiori informazioni sui prodotti e sulle spedizioni di ${brandName}. 🛍️📦`;

  const waUrl = generaLinkWhatsApp(cleanPhone, message);

  return (
    <aside
      aria-label="Contatto rapido WhatsApp"
      className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3 pointer-events-auto ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`hidden sm:flex items-center bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl border border-slate-700 transition-all duration-300 transform origin-right ${
          isHovered
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 translate-x-2 scale-95 pointer-events-none"
        }`}
      >
        <span>Scrivici su WhatsApp 🛍️</span>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chatta su WhatsApp con ${brandName}`}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none duration-1000" />
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="currentColor"
          className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.35C9.34 7.35 9.04 7.42 8.78 7.7C8.52 7.98 7.78 8.67 7.78 10.07C7.78 11.47 8.8 12.82 8.94 13.01C9.08 13.2 10.92 16.03 13.73 17.24C14.4 17.53 14.92 17.7 15.33 17.83C16 18.05 16.62 18.02 17.09 17.95C17.62 17.87 18.72 17.28 18.95 16.63C19.18 15.98 19.18 15.42 19.11 15.3C19.04 15.18 18.86 15.11 18.59 14.97C18.32 14.83 17.01 14.18 16.76 14.09C16.51 14 16.33 13.95 16.15 14.23C15.97 14.51 15.44 15.18 15.28 15.37C15.12 15.56 14.97 15.58 14.7 15.44C14.43 15.3 13.56 15.01 12.53 14.09C11.72 13.37 11.18 12.48 11.02 12.21C10.86 11.94 11 11.79 11.14 11.66C11.26 11.54 11.41 11.34 11.55 11.18C11.69 11.02 11.73 10.9 11.82 10.72C11.91 10.54 11.87 10.38 11.8 10.24C11.73 10.1 11.18 8.75 10.95 8.2C10.73 7.66 10.51 7.74 10.34 7.73C10.18 7.72 10 7.72 9.82 7.72C9.64 7.72 9.53 7.35 9.53 7.35Z" />
        </svg>
      </a>
    </aside>
  );
}
