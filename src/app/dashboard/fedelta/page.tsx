import React from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Award, Gift, Plus } from "lucide-react";

export default function FedeltaAddonPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.LOYALTY_CARD}
      title="Programma Fedeltà & Punti Spesa"
      description="Premia i tuoi acquirenti con punti spesa convertibili in buoni sconto sul carrello."
      icon="🎖️"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Award className="w-6 h-6 text-emerald-600" />
              Programma Fedeltà & Punti Spesa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fidelizza gli acquirenti con sconti a scaglioni e cashback sul carrello.
            </p>
          </div>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nuovo Premio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Tessere Attive</p>
            <p className="text-2xl font-black text-slate-900">238</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Punti Erogati Questo Mese</p>
            <p className="text-2xl font-black text-emerald-600">4.920</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500">Buoni Sconto Riscattati</p>
            <p className="text-2xl font-black text-teal-600">46</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            Premi & Coupon Riscatto
          </h2>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Coupon € 10,00 su spesa minima € 50</p>
                <p className="text-xs text-slate-500">Al raggiungimento di 150 punti</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                150 pt
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Spedizione Gratuita Senza Minimo</p>
                <p className="text-xs text-slate-500">Valida su tutto il catalogo nazionale</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                80 pt
              </span>
            </div>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
