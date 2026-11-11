"use client";

import { useEffect, useState } from "react";
import { Wrench, ShieldCheck, LogOut, RefreshCw, X } from "lucide-react";

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
  const [nascosto, setNascosto] = useState(false);

  // Operatore dentro: segnale di presenza ogni minuto. Se smette (scheda chiusa, uscita senza "Termina")
  // il Core dopo pochi minuti non mostra piu' il banner al cliente.
  useEffect(() => {
    if (!canExit || !sessionId) return;
    const ping = () => {
      fetch("/api/auth/maintenance-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        cache: "no-store",
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 60 * 1000);
    return () => clearInterval(t);
  }, [canExit, sessionId]);

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

  // Vista del CLIENTE: una striscia sottile, che non resta fissa sopra i contenuti e si puo' chiudere
  if (!canExit) {
    if (nascosto) return null;
    return (
      <div className="bg-amber-600 text-white text-xs border-b border-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-100" />
          <span className="flex-1 min-w-0 truncate">
            Assistenza Taaaac connessa{adminNome ? ` · ${adminNome}` : ""}
            {motivo ? ` · ${motivo}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setNascosto(true)}
            aria-label="Nascondi avviso"
            className="shrink-0 p-1 rounded hover:bg-black/20 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Vista dell'OPERATORE: compatta, fissa solo su schermi larghi per non coprire i contenuti sul telefono
  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-md md:sticky md:top-0 z-[60] border-b-2 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
              🔧 Manutenzione attiva
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
          <button
            onClick={handleExit}
            disabled={exiting}
            className="self-end md:self-center shrink-0 text-xs font-black bg-white hover:bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}
