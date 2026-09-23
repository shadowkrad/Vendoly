"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import { TaaaacAddonId } from "@/lib/taaaac-client";

interface AddonModuleGuardProps {
  addonId: TaaaacAddonId;
  title: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
}

export default function AddonModuleGuard({
  addonId,
  title,
  description = "Questo modulo estende le funzionalità del gestionale.",
  icon = "✨",
}: AddonModuleGuardProps) {
  const { config } = useTenantConfig();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-xs">
          {icon}
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Prossimamente • Studio di Fattibilità</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Stato: In fase di analisi e progettazione tecnica</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stiamo conducendo uno studio di fattibilità tecnica per integrare questo modulo in modo fluido, veloce e senza complicazioni operative. Verrà reso disponibile nei prossimi aggiornamenti dell'ecosistema Taaaac.
          </p>
          <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Vuoi richiedere la priorità per il tuo settore? Segnalalo nel Portale Clienti Taaaac.</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://taaaac.eu/portal"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span>Esprimi Interesse su Taaaac</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Torna alla Dashboard
          </Link>
        </div>

        {config?.sottodominio && (
          <p className="text-[10px] text-slate-400 font-mono">
            Licenza: {config.sottodominio}.taaaac.eu
          </p>
        )}
      </div>
    </div>
  );
}
