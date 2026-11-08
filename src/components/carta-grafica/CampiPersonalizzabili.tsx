"use client";

import React from "react";
import {
  DatiAttivitaCarta,
  DatiPersonalizzati,
  OrarioGiornoCarta,
} from "@/lib/carta-grafica-types";

type CampoTesto = "nome" | "slogan" | "indirizzo" | "citta" | "telefono" | "email";

const CAMPI: Array<{ chiave: CampoTesto; etichetta: string; placeholder: string }> = [
  { chiave: "nome", etichetta: "Nome dell'attività", placeholder: "Come compare sul biglietto e sul buono" },
  { chiave: "slogan", etichetta: "Slogan / sottotitolo", placeholder: "Lascia vuoto per non stamparlo" },
  { chiave: "indirizzo", etichetta: "Indirizzo", placeholder: "Via e numero civico" },
  { chiave: "citta", etichetta: "CAP e città", placeholder: "Es. 52100 Arezzo" },
  { chiave: "telefono", etichetta: "Telefono", placeholder: "Numero stampato sul biglietto" },
  { chiave: "email", etichetta: "Email", placeholder: "Indirizzo email stampato" },
];

const GIORNI = ["LUNEDÌ", "MARTEDÌ", "MERCOLEDÌ", "GIOVEDÌ", "VENERDÌ", "SABATO", "DOMENICA"];

interface Props {
  /** Dati presi da Impostazioni (non modificati). */
  ereditata: DatiAttivitaCarta;
  personalizzati: DatiPersonalizzati;
  onChange: (next: DatiPersonalizzati) => void;
}

/**
 * Di norma nome, recapiti e orari di biglietti e buoni sono quelli di Impostazioni.
 * Il titolare può, SOLO su sua scelta esplicita, usarne di diversi su biglietti e buoni
 * (senza cambiare nulla nel resto del gestionale) e tornare in ogni momento ai dati di Impostazioni.
 */
export default function CampiPersonalizzabili({ ereditata, personalizzati, onChange }: Props) {
  const imposta = (chiave: CampoTesto, valore: string | undefined) => {
    const next: DatiPersonalizzati = { ...personalizzati };
    if (valore === undefined) delete next[chiave];
    else next[chiave] = valore;
    onChange(next);
  };

  const orariEreditati = (): Array<{ giorno: string; orario: string }> =>
    GIORNI.map((g) => {
      const r: OrarioGiornoCarta | undefined = ereditata.orariGiornalieri.find((x) => x.giorno === g);
      return { giorno: g, orario: r ? r.orario : "CHIUSO" };
    });

  const orariPers = personalizzati.orari && personalizzati.orari.length === 7 ? personalizzati.orari : null;

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
        Questi dati vengono presi da <strong>Impostazioni</strong> e restano sempre aggiornati. Se vuoi un testo diverso
        solo su biglietti e buoni, premi <strong>&quot;Modifica solo qui&quot;</strong>: potrai tornare ai dati di Impostazioni quando vuoi.
      </div>

      {CAMPI.map(({ chiave, etichetta, placeholder }) => {
        const modificato = typeof personalizzati[chiave] === "string";
        return (
          <div key={chiave} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-700">{etichetta}</label>
              {modificato ? (
                <button
                  type="button"
                  onClick={() => imposta(chiave, undefined)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Ripristina da Impostazioni
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => imposta(chiave, String(ereditata[chiave] || ""))}
                  className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer"
                >
                  Modifica solo qui
                </button>
              )}
            </div>
            {modificato ? (
              <input
                type="text"
                value={personalizzati[chiave] ?? ""}
                onChange={(e) => imposta(chiave, e.target.value)}
                placeholder={placeholder}
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-300 bg-white"
              />
            ) : (
              <div className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 min-h-[34px]">
                {String(ereditata[chiave] || "") || <span className="italic text-slate-400">non impostato</span>}
                <span className="ml-2 text-[10px] text-slate-400">(da Impostazioni)</span>
              </div>
            )}
          </div>
        );
      })}

      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 pt-2">
          <label className="text-[11px] font-bold text-slate-700">Orari</label>
          {orariPers ? (
            <button
              type="button"
              onClick={() => {
                const next = { ...personalizzati };
                delete next.orari;
                onChange(next);
              }}
              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Ripristina da Impostazioni
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange({ ...personalizzati, orari: orariEreditati() })}
              className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer"
            >
              Modifica solo qui
            </button>
          )}
        </div>
        <div className="space-y-1">
          {(orariPers || orariEreditati()).map((r, i) => (
            <div key={r.giorno} className="grid grid-cols-[96px_1fr] items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">{r.giorno}</span>
              {orariPers ? (
                <input
                  type="text"
                  value={r.orario}
                  onChange={(e) => {
                    const righe = orariPers.map((x, j) => (j === i ? { ...x, orario: e.target.value } : x));
                    onChange({ ...personalizzati, orari: righe });
                  }}
                  placeholder="Es. 09:00 - 13:00 / 15:00 - 19:00 oppure CHIUSO"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white"
                />
              ) : (
                <span className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                  {r.orario}
                </span>
              )}
            </div>
          ))}
        </div>
        {!orariPers && <p className="text-[10px] text-slate-400">Orari ufficiali presi da Impostazioni.</p>}
      </div>
    </div>
  );
}
