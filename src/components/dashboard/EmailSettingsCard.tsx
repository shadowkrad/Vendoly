"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from "lucide-react";

export default function EmailSettingsCard() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleTest() {
    if (!testEmail) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/impostazioni/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ ok: true, message: data.message });
      } else {
        setResult({ ok: false, message: data.error || "Errore durante l'invio del test" });
      }
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Errore di connessione" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Canale Notifiche Email Ordini</h2>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Taaaac Engine
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Le ricevute degli ordini, le conferme di acquisto ai clienti e gli avvisi di nuove vendite vengono inviati tramite i server certificati Taaaac con conformità SPF e DMARC garantita.
      </p>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-500">
          <span>Mittente Notifiche:</span>
          <span className="font-mono text-slate-800 font-semibold">notifiche@taaaac.eu</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>Stato Consegna:</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Attivo & Certificato
          </span>
        </div>
      </div>

      {/* Test invio rapido */}
      <div className="pt-1 space-y-2">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
          Invia email di prova ordini
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="negozio@esempio.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={loading || !testEmail}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            {loading ? "Invio..." : <><Send className="w-3 h-3" /> Test</>}
          </button>
        </div>

        {result && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
              result.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {result.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />}
            <span>{result.message}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Vuoi personalizzare dominio mittente o ricezione?</span>
        <a
          href="https://taaaac.eu/portal#domain"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-700 hover:text-emerald-900 underline font-bold inline-flex items-center gap-1"
        >
          Portale Taaaac <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
