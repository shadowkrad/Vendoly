"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  FormatoBiglietto,
} from "@/lib/carta-grafica-types";
import {
  BigliettoFronte,
  BigliettoRetro,
} from "@/components/carta-grafica/CartaGraficaCanvas";

function StampaBigliettoContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CartaGraficaConfig | null>(null);
  const [attivita, setAttivita] = useState<DatiAttivitaCarta | null>(null);
  const [formatoCarta, setFormatoCarta] = useState<"a4" | "singolo">(
    searchParams.get("formato") === "singolo" ? "singolo" : "a4"
  );
  const [modalitaLati, setModalitaLati] = useState<FormatoBiglietto>("FRONTE_RETRO");

  useEffect(() => {
    fetch("/api/carta-grafica")
      .then((r) => r.json())
      .then((d) => {
        if (d?.config && d?.attivita) {
          setConfig(d.config);
          setAttivita(d.attivita);
          setModalitaLati(d.config.formatoBiglietto);
        }
      })
      .catch(() => {});
  }, []);

  if (!config || !attivita) {
    return (
      <div className="p-10 text-center text-sm text-slate-600 font-sans">
        Preparazione pagina di stampa del Biglietto da Visita…
      </div>
    );
  }

  const configStampa: CartaGraficaConfig = {
    ...config,
    formatoBiglietto: modalitaLati,
  };

  const pageCss =
    formatoCarta === "singolo"
      ? `
        @page { size: 85mm 55mm; margin: 0; }
        body { margin: 0; background: #1e293b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .foglio-singolo { width: 85mm; height: 55mm; margin: 8mm auto; overflow: hidden; page-break-after: always; break-after: page; box-shadow: 0 10px 25px rgba(0,0,0,0.35); }
        @media print {
          body { background: #fff; }
          .no-stampa { display: none !important; }
          .foglio-singolo { margin: 0; box-shadow: none; }
        }
      `
      : `
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; background: #334155; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .foglio-a4 {
          width: 210mm;
          height: 297mm;
          margin: 8mm auto;
          background: #ffffff;
          box-sizing: border-box;
          padding: 11mm 20mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
          break-after: page;
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .griglia-10 {
          display: grid;
          grid-template-columns: repeat(2, 85mm);
          grid-template-rows: repeat(5, 55mm);
          gap: 0;
          justify-content: center;
          border: 0.2mm dashed #cbd5e1;
        }
        .cella-biglietto {
          width: 85mm;
          height: 55mm;
          box-sizing: border-box;
          border: 0.15mm dashed rgba(148, 163, 184, 0.45);
          overflow: hidden;
          position: relative;
        }
        @media print {
          body { background: #fff; }
          .no-stampa { display: none !important; }
          .foglio-a4 { margin: 0; box-shadow: none; }
        }
      `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      {/* BARRA CONTROLLI STAMPA (Nascosta in stampa) */}
      <div className="no-stampa sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3">
          <span className="text-lg">🪪</span>
          <div>
            <div className="text-sm font-bold">{attivita.nome} — Stampa Biglietto da Visita</div>
            <div className="text-[11px] text-slate-400">
              Attiva &ldquo;Grafica di sfondo&rdquo; nelle impostazioni di stampa del browser per stampare i colori pieni.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Switch Formato A4 vs Singolo */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormatoCarta("a4")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                formatoCarta === "a4" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Foglio A4 (10 Biglietti)
            </button>
            <button
              type="button"
              onClick={() => setFormatoCarta("singolo")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                formatoCarta === "singolo" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Singolo 1:1 (85×55 mm)
            </button>
          </div>

          {/* Switch Solo Fronte vs Fronte/Retro */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalitaLati("FRONTE_RETRO")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                modalitaLati === "FRONTE_RETRO" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-300"
              }`}
            >
              Fronte + Retro
            </button>
            <button
              type="button"
              onClick={() => setModalitaLati("SOLO_FRONTE")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                modalitaLati === "SOLO_FRONTE" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-300"
              }`}
            >
              Solo Fronte
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            🖨️ Stampa / Salva PDF
          </button>
        </div>
      </div>

      {/* CONTENUTO DI STAMPA */}
      {formatoCarta === "singolo" ? (
        <div>
          <div className="foglio-singolo">
            <BigliettoFronte config={configStampa} attivita={attivita} className="w-full h-full" />
          </div>
          {modalitaLati === "FRONTE_RETRO" && (
            <div className="foglio-singolo">
              <BigliettoRetro config={configStampa} attivita={attivita} className="w-full h-full" />
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* PAGINA 1: 10 FRONTI */}
          <div className="foglio-a4">
            <div className="griglia-10">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={`fronte-${idx}`} className="cella-biglietto">
                  <BigliettoFronte config={configStampa} attivita={attivita} className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>

          {/* PAGINA 2: 10 RETRI (solo se scelto FRONTE_RETRO) */}
          {modalitaLati === "FRONTE_RETRO" && (
            <div className="foglio-a4">
              <div className="griglia-10">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div key={`retro-${idx}`} className="cella-biglietto">
                    <BigliettoRetro config={configStampa} attivita={attivita} className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function StampaBigliettoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Caricamento stampa…</div>}>
      <StampaBigliettoContent />
    </Suspense>
  );
}
