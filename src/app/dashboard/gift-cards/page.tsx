import React from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Gift, Plus, CreditCard } from "lucide-react";

export default function GiftCardsAddonPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.GIFT_CARDS}
      title="Buoni Regalo & Gift Cards"
      description="Emetti carte regalo digitali spendibili sia online che alla cassa del negozio fisico."
      icon="🎁"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Gift className="w-6 h-6 text-emerald-600" />
              Buoni Regalo & Gift Cards
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Emetti voucher regalo con codice univoco utilizzabili sullo store e in cassa.
            </p>
          </div>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Emetti Buono
          </button>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Gift Card Attive
          </h2>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Codice: GIFT-VENDOLY-50</p>
                <p className="text-xs text-slate-500">Credito residuo € 50,00 - Scadenza 31/12/2026</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                Attiva
              </span>
            </div>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
