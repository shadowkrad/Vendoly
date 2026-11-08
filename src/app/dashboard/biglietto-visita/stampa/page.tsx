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
  BuonoRegaloCard,
} from "@/components/carta-grafica/CartaGraficaCanvas";

type TipoDocumentoStampa = "biglietto" | "buono_cartaceo" | "buono_precompilato";

function StampaBigliettoContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CartaGraficaConfig | null>(null);
  const [attivita, setAttivita] = useState<DatiAttivitaCarta | null>(null);

  const tipoIniziale: TipoDocumentoStampa =
    searchParams.get("tipo") === "buono_cartaceo"
      ? "buono_cartaceo"
      : searchParams.get("tipo") === "buono_precompilato"
      ? "buono_precompilato"
      : "biglietto";

  const [tipoStampa, setTipoStampa] = useState<TipoDocumentoStampa>(tipoIniziale);
  const [formatoCarta, setFormatoCarta] = useState<"a4" | "singolo">(
    searchParams.get("formato") === "singolo" ? "singolo" : "a4"
  );
  const [modalitaLati, setModalitaLati] = useState<FormatoBiglietto>("FRONTE_RETRO");

  // Campi personalizzabili al volo per la stampa dei Buoni Cartacei / Precompilati
  const [codiceBuono1, setCodiceBuono1] = useState("");
  const [codiceBuono2, setCodiceBuono2] = useState("");
  const [valoreBuono, setValoreBuono] = useState("75,00 €");
  const [destinatarioBuono, setDestinatarioBuono] = useState("");
  const [acquirenteBuono, setAcquirenteBuono] = useState("");
  const [messaggioBuono, setMessaggioBuono] = useState("");
  const [scadenzaBuono, setScadenzaBuono] = useState("");

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
        Preparazione pagina di stampa Buoni & Biglietti da Visita…
      </div>
    );
  }

  const configStampa: CartaGraficaConfig = {
    ...config,
    formatoBiglietto: modalitaLati,
  };

  const pageCss =
    tipoStampa === "biglietto" && formatoCarta === "singolo"
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
          padding: 11mm 12mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
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
        .griglia-buoni-a4 {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-around;
          gap: 14mm;
        }
        .cella-buono-a4 {
          width: 186mm;
          height: 88mm;
          box-sizing: border-box;
          border: 0.25mm dashed #94a3b8;
          padding: 1.5mm;
          position: relative;
        }
        .linea-taglio-buoni {
          width: 186mm;
          border-top: 0.35mm dashed #94a3b8;
          text-align: center;
          font-size: 9px;
          color: #64748b;
          font-family: sans-serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding-top: 2mm;
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
      <div className="no-stampa sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-700 px-4 py-3 space-y-3 font-sans">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">🖨️</span>
            <div>
              <div className="text-sm font-bold">
                {attivita.nome} — Centro Stampa Biglietti & Buoni Cartacei
              </div>
              <div className="text-[11px] text-slate-400">
                Attiva &ldquo;Grafica di sfondo&rdquo; nelle impostazioni di stampa del browser per stampare i colori pieni.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scelta Cosa Stampare: Biglietti vs Buoni Cartacei vs Buoni Precompilati */}
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTipoStampa("biglietto")}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  tipoStampa === "biglietto" ? "bg-white text-slate-900 font-bold" : "text-slate-300"
                }`}
              >
                🪪 Biglietti da Visita
              </button>
              <button
                type="button"
                onClick={() => setTipoStampa("buono_cartaceo")}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  tipoStampa === "buono_cartaceo"
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-slate-300"
                }`}
              >
                ✍️ Buoni Cartacei (da compilare)
              </button>
              <button
                type="button"
                onClick={() => setTipoStampa("buono_precompilato")}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  tipoStampa === "buono_precompilato"
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "text-slate-300"
                }`}
              >
                🎁 Buoni Precompilati
              </button>
            </div>

            {tipoStampa === "biglietto" && (
              <>
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
                      modalitaLati === "FRONTE_RETRO"
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    Fronte + Retro
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalitaLati("SOLO_FRONTE")}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                      modalitaLati === "SOLO_FRONTE"
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    Solo Fronte
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              🖨️ Stampa / Salva PDF
            </button>
          </div>
        </div>

        {/* Barra opzionale per inserire codici o dati al volo quando si stampano Buoni */}
        {tipoStampa !== "biglietto" && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                Codice Identificativo #1 (opz.)
              </label>
              <input
                type="text"
                value={codiceBuono1}
                onChange={(e) => setCodiceBuono1(e.target.value)}
                placeholder={
                  tipoStampa === "buono_cartaceo"
                    ? "Lascia vuoto per scrivere a mano"
                    : "Es. REG-BF001"
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                Codice Identificativo #2 (opz.)
              </label>
              <input
                type="text"
                value={codiceBuono2}
                onChange={(e) => setCodiceBuono2(e.target.value)}
                placeholder={
                  tipoStampa === "buono_cartaceo"
                    ? "Lascia vuoto per scrivere a mano"
                    : "Es. REG-BF002"
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
              />
            </div>

            {tipoStampa === "buono_precompilato" && (
              <>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Valore o Trattamento
                  </label>
                  <input
                    type="text"
                    value={valoreBuono}
                    onChange={(e) => setValoreBuono(e.target.value)}
                    placeholder="Es. 75,00 € o Massaggio"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Per (Destinatario)
                  </label>
                  <input
                    type="text"
                    value={destinatarioBuono}
                    onChange={(e) => setDestinatarioBuono(e.target.value)}
                    placeholder="Es. Giulia Rossi"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Da parte di
                  </label>
                  <input
                    type="text"
                    value={acquirenteBuono}
                    onChange={(e) => setAcquirenteBuono(e.target.value)}
                    placeholder="Es. Marco"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                    Dedica / Scadenza
                  </label>
                  <input
                    type="text"
                    value={messaggioBuono}
                    onChange={(e) => setMessaggioBuono(e.target.value)}
                    placeholder="Dedica breve..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTENUTO DI STAMPA */}
      {tipoStampa !== "biglietto" ? (
        <div className="foglio-a4">
          <div className="griglia-buoni-a4">
            {/* BUONO #1 */}
            <div className="cella-buono-a4">
              <BuonoRegaloCard
                config={configStampa}
                attivita={attivita}
                buono={{
                  codice:
                    codiceBuono1.trim() ||
                    (tipoStampa === "buono_precompilato" ? "REG-001" : ""),
                  motivoEtichetta: "Buono Regalo",
                  valore: valoreBuono || "75,00 €",
                  destinatario: destinatarioBuono || null,
                  acquirente: acquirenteBuono || null,
                  messaggio: messaggioBuono || null,
                  scadenzaTesto: scadenzaBuono || null,
                  qrDataUrl: attivita.qrVetrinaDataUrl,
                }}
                layout={tipoStampa === "buono_cartaceo" ? "cartaceo" : "cartoncino"}
                className="w-full h-full shadow-none rounded-none"
              />
            </div>

            <div className="linea-taglio-buoni">
              ✂ — — — Linea di taglio tra i due Buoni Regalo Cartacei (Formato Busta 186 × 88 mm) — — — ✂
            </div>

            {/* BUONO #2 */}
            <div className="cella-buono-a4">
              <BuonoRegaloCard
                config={configStampa}
                attivita={attivita}
                buono={{
                  codice:
                    codiceBuono2.trim() ||
                    (tipoStampa === "buono_precompilato" ? "REG-002" : ""),
                  motivoEtichetta: "Buono Regalo",
                  valore: valoreBuono || "75,00 €",
                  destinatario: destinatarioBuono || null,
                  acquirente: acquirenteBuono || null,
                  messaggio: messaggioBuono || null,
                  scadenzaTesto: scadenzaBuono || null,
                  qrDataUrl: attivita.qrVetrinaDataUrl,
                }}
                layout={tipoStampa === "buono_cartaceo" ? "cartaceo" : "cartoncino"}
                className="w-full h-full shadow-none rounded-none"
              />
            </div>
          </div>
        </div>
      ) : formatoCarta === "singolo" ? (
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
