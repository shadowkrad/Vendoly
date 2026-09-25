"use client";

import React, { useState } from "react";
import { Settings, Save, Store, Truck, Shield, CheckCircle2, Globe, ExternalLink, ShieldCheck } from "lucide-react";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";

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

  const displayDomain = config?.customDomain || (config?.sottodominio ? `${config.sottodominio}.taaaac.eu` : "littlecreations.family");

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

      {/* Sezione Dominio & Vetrina Online */}
      <div className="p-6 bg-gradient-to-br from-emerald-50/60 to-slate-50 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Vetrina Online & Dominio Personalizzato</h2>
              <p className="text-xs text-slate-500">
                Indirizzo pubblico del negozio con certificato SSL Let's Encrypt automatico.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            SSL Attivo & Sicuro
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Indirizzo Vetrina Ufficiale</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 truncate">
                https://{displayDomain}
              </span>
              <a
                href={`https://${displayDomain}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                title="Apri vetrina in una nuova scheda"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Puntamenti DNS Server</span>
            <p className="font-mono text-xs text-slate-700">
              IP VPS: <strong className="text-emerald-700">80.211.130.61</strong> (Record A @)
            </p>
            <p className="text-[10px] text-slate-400">
              Gestibile e modificabile dal <strong>Portale Taaaac</strong> (taaaac.eu/portal).
            </p>
          </div>
        </div>
      </div>

      {/* Canale Email Notifiche Ordini Taaaac Mail Engine */}
      <EmailSettingsCard />

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
