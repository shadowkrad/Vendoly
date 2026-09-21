"use client";

import React from "react";
import Link from "next/link";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import { TaaaacAddonId } from "@/lib/taaaac-client";

interface AddonModuleGuardProps {
  addonId: TaaaacAddonId;
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
}

export default function AddonModuleGuard({
  addonId,
  title,
  description = "Questo modulo estende le funzionalità di vendita e fidelizzazione del tuo negozio Vendoly.",
  icon = "⚡",
  children,
}: AddonModuleGuardProps) {
  const { isAddonActive, config } = useTenantConfig();
  const active = isAddonActive(addonId);

  if (active) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-xs">
          {icon}
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <span>⚡ Modulo On-Demand Taaaac</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-left max-w-lg mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Come attivare questa funzione per Vendoly:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li>Accedi al tuo <b>Portale Esercente Taaaac</b></li>
            <li>Vai alla sezione <b>Moduli Aggiuntivi & Espansioni</b></li>
            <li>Attiva il modulo con un solo tocco: sarà immediatamente operativo qui</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://taaaac.eu/portal"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <span>Apri Portale Esercente Taaaac</span>
            <span>↗</span>
          </a>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
          >
            Torna alla Dashboard
          </Link>
        </div>

        {config?.sottodominio && (
          <p className="text-[11px] text-slate-400">
            Tenant attivo: <code className="font-mono text-slate-600">{config.sottodominio}.taaaac.eu</code>
          </p>
        )}
      </div>
    </div>
  );
}
