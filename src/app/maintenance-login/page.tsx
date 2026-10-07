"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Wrench, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

function MaintenanceLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("Verifica credenziali di manutenzione...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token di manutenzione mancante o non valido. Riprova dalla console SuperAdmin.");
      return;
    }

    let isMounted = true;

    async function authenticateMaintenance() {
      try {
        if (!isMounted) return;
        setStatus("Verifica autorizzazione con Taaaac Cloud...");

        const res = await fetch("/api/auth/maintenance-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus("Accesso autorizzato! Apertura dashboard in modalità manutenzione...");
          router.replace(data.redirectUrl || "/dashboard");
        } else {
          setError(
            data.error ||
              "Accesso di manutenzione non autorizzato. Il token potrebbe essere scaduto o la sessione già terminata."
          );
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Errore durante l'autenticazione della sessione di manutenzione.");
      }
    }

    authenticateMaintenance();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-amber-200 text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600">
        <Wrench className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Taaaac Maintenance Gate</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Accesso Assistenza Tecnica
        </h1>
        <p className="text-xs text-slate-500">
          Connessione sicura in corso con l&apos;infrastruttura di audit GDPR Taaaac Suite.
        </p>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Errore di Accesso</span>
          </div>
          <p className="leading-relaxed">{error}</p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-block px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
            >
              Torna al Negozio
            </a>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-700 text-xs font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>{status}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
          <p className="text-[11px] text-slate-400">
            Stiamo preparando l&apos;ambiente di lavoro protetto...
          </p>
        </div>
      )}

      <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 flex items-center justify-center gap-2">
        <span>Taaaac Cloud Ecosystem</span>
        <span>•</span>
        <span>Conformità GDPR Art. 32</span>
      </div>
    </div>
  );
}

export default function MaintenanceLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-amber-200 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-semibold">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
              <span>Inizializzazione sessione di manutenzione...</span>
            </div>
          </div>
        }
      >
        <MaintenanceLoginContent />
      </Suspense>
    </div>
  );
}
