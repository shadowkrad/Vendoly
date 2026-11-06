"use client";

import React from "react";
import { Cake } from "lucide-react";

export interface CompleannoSettings {
  enabled: boolean;
  tipoValore: "IMPORTO" | "PERCENTUALE" | "SERVIZIO";
  importo: number;
  percentuale: number;
  servizio: string;
  giorniAnticipo: number;
  validitaGiorni: number;
  spesaMinima: number;
  inviaEmail: boolean;
}

export const COMPLEANNO_DEFAULT: CompleannoSettings = {
  enabled: false,
  tipoValore: "PERCENTUALE",
  importo: 10,
  percentuale: 20,
  servizio: "",
  giorniAnticipo: 7,
  validitaGiorni: 30,
  spesaMinima: 0,
  inviaEmail: true,
};

const campo = "w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white";
const etichetta = "block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1";

/** Impostazioni del buono compleanno automatico (si salvano dentro le regole fedeltà). */
export default function BuonoCompleannoSettings({
  value,
  onChange,
  rewardVoucherMonths,
  onChangeRewardMonths,
}: {
  value?: Partial<CompleannoSettings>;
  onChange: (c: CompleannoSettings) => void;
  rewardVoucherMonths: number;
  onChangeRewardMonths: (m: number) => void;
}) {
  const c: CompleannoSettings = { ...COMPLEANNO_DEFAULT, ...(value || {}) };
  const set = (patch: Partial<CompleannoSettings>) => onChange({ ...c, ...patch });

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Buono compleanno automatico</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Ai clienti con la data di nascita registrata, qualche giorno prima del compleanno si crea un buono intestato a loro. Viene
              inviato per email solo a chi ha dato il consenso marketing; gli altri lo trovi nella pagina Buoni, pronto da stampare o inviare su WhatsApp.
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" className="sr-only peer" checked={c.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <div className="w-14 h-7 bg-neutral-200 rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {c.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label className={etichetta}>Regalo</label>
            <select value={c.tipoValore} onChange={(e) => set({ tipoValore: e.target.value as CompleannoSettings["tipoValore"] })} className={campo}>
              <option value="PERCENTUALE">Sconto in percentuale</option>
              <option value="IMPORTO">Sconto in euro</option>
              <option value="SERVIZIO">Servizio in omaggio</option>
            </select>
          </div>
          <div>
            {c.tipoValore === "PERCENTUALE" && (
              <>
                <label className={etichetta}>Sconto (%)</label>
                <input type="number" min={1} max={100} value={c.percentuale} onChange={(e) => set({ percentuale: parseFloat(e.target.value) || 0 })} className={campo} />
              </>
            )}
            {c.tipoValore === "IMPORTO" && (
              <>
                <label className={etichetta}>Sconto (€)</label>
                <input type="number" min={1} step="0.5" value={c.importo} onChange={(e) => set({ importo: parseFloat(e.target.value) || 0 })} className={campo} />
              </>
            )}
            {c.tipoValore === "SERVIZIO" && (
              <>
                <label className={etichetta}>Servizio in omaggio</label>
                <input value={c.servizio} onChange={(e) => set({ servizio: e.target.value })} className={campo} placeholder="Es. Maschera viso" />
              </>
            )}
          </div>
          <div>
            <label className={etichetta}>Si crea quanti giorni prima</label>
            <input type="number" min={0} max={60} value={c.giorniAnticipo} onChange={(e) => set({ giorniAnticipo: parseInt(e.target.value, 10) || 0 })} className={campo} />
          </div>
          <div>
            <label className={etichetta}>Valido per quanti giorni dal compleanno (0 = senza scadenza)</label>
            <input type="number" min={0} value={c.validitaGiorni} onChange={(e) => set({ validitaGiorni: parseInt(e.target.value, 10) || 0 })} className={campo} />
          </div>
          <div>
            <label className={etichetta}>Spesa minima (€, 0 = nessuna)</label>
            <input type="number" min={0} step="0.5" value={c.spesaMinima} onChange={(e) => set({ spesaMinima: parseFloat(e.target.value) || 0 })} className={campo} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 sm:mt-6">
            <input type="checkbox" checked={c.inviaEmail} onChange={(e) => set({ inviaEmail: e.target.checked })} />
            Invia per email (a chi ha il consenso marketing)
          </label>
        </div>
      )}

      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <label className={etichetta}>Premi punti: validità del buono che si crea al riscatto (mesi, 0 = senza scadenza)</label>
        <input
          type="number"
          min={0}
          max={120}
          value={rewardVoucherMonths}
          onChange={(e) => onChangeRewardMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className={`${campo} sm:w-40`}
        />
        <p className="text-[11px] text-neutral-500 mt-1">Quando un cliente riscatta un premio, i punti si scalano e si crea un buono (sconto o servizio) pronto da usare in cassa.</p>
      </div>
    </div>
  );
}
