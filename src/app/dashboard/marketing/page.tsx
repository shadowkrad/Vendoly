import React from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Megaphone, Send } from "lucide-react";

export default function MarketingAddonPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.MARKETING_1CLICK}
      title="Marketing 1-Click & Offerte Flash"
      description="Invia broadcast promozionali e sconti flash a tutti i tuoi clienti con un solo clic."
      icon="📣"
    >
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            Marketing 1-Click & Promozioni Flash
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Invia notifiche via WhatsApp, SMS ed Email ai clienti registrati per lanciare saldi e novità.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Lancia Nuova Campagna Promozionale</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Segmento Destinatari
              </label>
              <select className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden">
                <option>Tutti i clienti registrati (412)</option>
                <option>Acquirenti degli ultimi 30 giorni (68)</option>
                <option>Carrelli abbandonati (19)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Testo Messaggio
              </label>
              <textarea
                rows={3}
                defaultValue="Weekend Flash Sale su Vendoly! Sconto del 15% su tutti gli articoli usando il coupon FLASH15. Scopri il catalogo completo su vendoly.taaaac.eu!"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2">
              <Send className="w-4 h-4" />
              Invia Broadcast
            </button>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
