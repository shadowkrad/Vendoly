"use client";

import React, { useState } from "react";
import { Settings, Save, Store, Truck, Shield, CheckCircle2 } from "lucide-react";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";

export default function ImpostazioniPage() {
  const { config } = useTenantConfig();
  const [saved, setSaved] = useState(false);
  const [storeName, setStoreName] = useState(config?.nomeAttivita || "Vendoly Store");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("50");
  const [autoSync, setAutoSync] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600" />
          Impostazioni Negozio & Vendita
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configura soglie spedizione, dati fiscali e sincronizzazione automatica scorte.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Configurazioni salvate con successo per il tenant corrente!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            Dati Brand & Vetrina
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Negozio / Insegna
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            Spedizioni & Logistica
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Soglia Spedizione Gratuita (€)
            </label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="w-36 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Sincronizzazione Automatica Scorte</p>
              <p className="text-xs text-slate-500">
                Scala automaticamente la giacenza su Subito e Vinted appena un ordine viene saldato.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salva Configurazioni
          </button>
        </div>
      </form>
    </div>
  );
}
