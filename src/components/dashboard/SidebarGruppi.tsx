"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export interface VoceMenu {
  href: string;
  label: string;
  icon: any;
}

export interface GruppoMenu {
  gruppo: string;
  icona: any;
  voci: VoceMenu[];
}

export type ElementoMenu = VoceMenu | GruppoMenu;

interface SidebarGruppiProps {
  elementi: ElementoMenu[];
  isActive: (href: string) => boolean;
  onNavigate: () => void;
  /** stili del tema del modulo */
  attivo: string;
  inattivo: string;
  chevron: string;
  linea: string;
}

function Icona({ icon }: { icon: any }) {
  if (typeof icon === "string") return <span className="text-base shrink-0">{icon}</span>;
  const C = icon;
  return C ? <C className="w-4 h-4 shrink-0" /> : null;
}

// Menu con gruppi apribili: si apre da solo il gruppo della pagina in cui ti trovi
export default function SidebarGruppi({ elementi, isActive, onNavigate, attivo, inattivo, chevron, linea }: SidebarGruppiProps) {
  const [aperti, setAperti] = useState<Record<string, boolean>>({});

  useEffect(() => {
    for (const el of elementi) {
      if ("gruppo" in el && el.voci.some((v) => isActive(v.href))) {
        setAperti((prev) => (prev[el.gruppo] ? prev : { ...prev, [el.gruppo]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementi, isActive]);

  const base = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors";

  return (
    <>
      {elementi.map((el) => {
        if (!("gruppo" in el)) {
          return (
            <Link
              key={el.href}
              href={el.href}
              onClick={onNavigate}
              className={`${base} ${isActive(el.href) ? attivo : inattivo}`}
            >
              <Icona icon={el.icon} />
              <span>{el.label}</span>
            </Link>
          );
        }
        const apertoG = Boolean(aperti[el.gruppo]);
        const haAttiva = el.voci.some((v) => isActive(v.href));
        return (
          <div key={el.gruppo}>
            <button
              type="button"
              onClick={() => setAperti((prev) => ({ ...prev, [el.gruppo]: !apertoG }))}
              aria-expanded={apertoG}
              className={`w-full justify-between cursor-pointer ${base} ${haAttiva && !apertoG ? attivo : inattivo}`}
            >
              <span className="flex items-center gap-3">
                <Icona icon={el.icona} />
                {el.gruppo}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${chevron} ${apertoG ? "rotate-180" : ""}`} />
            </button>
            {apertoG && (
              <div className={`mt-0.5 mb-1 ml-4 pl-3 border-l space-y-0.5 ${linea}`}>
                {el.voci.map((v) => (
                  <Link
                    key={v.href}
                    href={v.href}
                    onClick={onNavigate}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive(v.href) ? attivo : inattivo}`}
                  >
                    {v.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
