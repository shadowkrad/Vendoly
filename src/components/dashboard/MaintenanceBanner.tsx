"use client";

import { useState } from "react";
import { Wrench, ShieldCheck, LogOut, RefreshCw } from "lucide-react";

interface MaintenanceBannerProps {
  adminNome?: string | null;
  adminEmail?: string | null;
  motivo?: string | null;
  sessionId?: string | null;
  canExit?: boolean;
}

export default function MaintenanceBanner({
  adminNome,
  adminEmail,
  motivo,
  sessionId,
  canExit = true,
}: MaintenanceBannerProps) {
  const [exiting, setExiting] = useState(false);

  async function handleExit() {
    setExiting(true);
    try {
      const res = await fetch("/api/auth/maintenance-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      window.location.href = data.redirectUrl || "https://admin.taaaac.eu";
    } catch (e) {
      console.error("Errore uscita manutenzione:", e);
      window.location.href = "https://admin.taaaac.eu";
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-lg sticky top-0 z-[60] border-b-2 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-black/20 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Wrench className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                  🔧 Modalità Manutenzione & Supporto Attiva
                </span>
                <span className="text-[11px] font-medium text-amber-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Operatore: <b>{adminNome || "SuperAdmin Taaaac"}</b> ({adminEmail || "alessio@taaaac.eu"})
                </span>
                {sessionId && (
                  <span className="text-[10px] font-mono text-amber-200 bg-black/20 px-1.5 py-0.5 rounded">
                    Audit ID: #{sessionId.slice(-6)}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-50 leading-relaxed">
                Intervento tecnico in corso. Motivo: &quot;{motivo || "Verifica e aggiornamento configurazioni richieste dal cliente"}&quot;. Tutte le operazioni sono tracciate per trasparenza e conformità GDPR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {canExit ? (
              <button
                onClick={handleExit}
                disabled={exiting}
                className="text-xs font-black bg-white hover:bg-amber-50 text-amber-900 px-3.5 py-2 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {exiting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Chiusura sessione...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Termina Manutenzione ed Esci</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-[11px] font-bold bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/20">
                Assistenza Taaaac Connessa
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
