"use client";

import { useEffect } from "react";

/** Apre la finestra di stampa appena la pagina e le immagini sono pronte; il pulsante resta per ristampare. */
export default function StampaAuto() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="no-stampa" style={{ position: "fixed", top: 12, right: 12, zIndex: 10 }}>
      <button
        type="button"
        onClick={() => window.print()}
        style={{ padding: "8px 16px", borderRadius: 10, background: "#111827", color: "#fff", fontWeight: 600, border: 0, cursor: "pointer" }}
      >
        Stampa
      </button>
    </div>
  );
}
