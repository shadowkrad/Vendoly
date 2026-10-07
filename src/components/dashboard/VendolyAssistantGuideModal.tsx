"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Puzzle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  Sliders,
  Check,
} from "lucide-react";

interface VendolyAssistantGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendolyAssistantGuideModal({
  isOpen,
  onClose,
}: VendolyAssistantGuideModalProps) {
  const [activeBrowser, setActiveBrowser] = useState<"chrome" | "edge" | "brave">("chrome");
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = () => {
    setIsChecking(true);
    if (typeof window !== "undefined") {
      const hasExt = document.documentElement.getAttribute("data-vendoly-assistant") === "installed";
      setIsInstalled(hasExt);
      window.postMessage({ type: "PING_VENDOLY_ASSISTANT", source: "vendoly-web" }, "*");
      setTimeout(() => {
        const recheck = document.documentElement.getAttribute("data-vendoly-assistant") === "installed";
        setIsInstalled(recheck);
        setIsChecking(false);
      }, 600);
    } else {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "VENDOLY_ASSISTANT_AVAILABLE") {
        setIsInstalled(true);
        setIsChecking(false);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [isOpen]);

  if (!isOpen) return null;

  const browserUrls = {
    chrome: "chrome://extensions",
    edge: "edge://extensions",
    brave: "brave://extensions",
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Vendoly Assistant</h3>
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold">
                  v1.0.3
                </span>
              </div>
              <p className="text-xs text-cyan-200">
                Guida rapida installazione per Chrome, Edge e Brave
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-cyan-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo Modal */}
        <div className="p-6 space-y-5 text-xs text-slate-600">
          {/* Banner Stato Connessione */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              isInstalled
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block text-xs">
                  {isInstalled
                    ? "Vendoly Assistant è ATTIVO nel tuo browser!"
                    : "Estensione non ancora rilevata"}
                </span>
                <span className="text-[11px] opacity-80">
                  {isInstalled
                    ? "Tutte le funzioni di autocompilazione Vinted 1-click sono pronte all'uso."
                    : "Segui i 3 passaggi sottostanti per attivarla in meno di 1 minuto."}
                </span>
              </div>
            </div>

            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200 font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin text-cyan-600" : ""}`} />
              <span>{isChecking ? "Verifica..." : "Rileva"}</span>
            </button>
          </div>

          {/* Download Primario ZIP */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider block">
                Passo 1 • Pacchetto Estensione
              </span>
              <h4 className="font-bold text-sm text-white">Scarica Vendoly Assistant v1.0.3</h4>
              <p className="text-[11px] text-cyan-100/80 mt-0.5">
                Archivio compresso (.ZIP) pronto per essere caricato nel browser
              </p>
            </div>
            <a
              href="/downloads/vendoly-assistant.zip"
              download="vendoly-assistant.zip"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Scarica .ZIP (15 KB)</span>
            </a>
          </div>

          {/* Selettore Browser */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700">Seleziona il tuo browser:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "chrome", label: "Google Chrome" },
                { id: "edge", label: "Microsoft Edge" },
                { id: "brave", label: "Brave / Opera" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBrowser(b.id as any)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                    activeBrowser === b.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* I 3 Passaggi Guidati */}
          <div className="space-y-3 pt-1">
            <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <FolderArchive className="w-3.5 h-3.5 text-cyan-700" />
                  Estrai la cartella scaricata
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fai clic con il tasto destro sul file <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">vendoly-assistant.zip</code> e seleziona <b>&quot;Estrai tutto...&quot;</b> sul desktop o nei tuoi documenti.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-cyan-700" />
                  Apri la gestione estensioni & attiva la Modalità sviluppatore
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Apri una nuova scheda e digita nella barra degli indirizzi:{" "}
                  <code className="bg-cyan-50 text-cyan-900 px-1.5 py-0.5 rounded border border-cyan-200 font-mono font-bold text-[10px]">
                    {browserUrls[activeBrowser]}
                  </code>
                  . In alto a destra attiva la levetta <b>&quot;Modalità sviluppatore&quot;</b>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Puzzle className="w-3.5 h-3.5 text-cyan-700" />
                  Carica l&apos;estensione non pacchettizzata
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  In alto a sinistra clicca su <b>&quot;Carica estensione non pacchettizzata&quot;</b> e seleziona la cartella estratta al Passo 1. L&apos;icona di Vendoly Assistant comparirà immediatamente tra le tue estensioni!
                </p>
              </div>
            </div>
          </div>

          {/* Consiglio Fissaggio */}
          <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-cyan-950 flex items-start gap-2.5 text-[11px]">
            <Sparkles className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <p>
              <b>Consiglio:</b> Clicca sull&apos;icona del tassello puzzle in alto a destra nel browser e premi la <b>puntina 📌</b> accanto a <b>Vendoly Assistant</b> per tenerla sempre a portata di mano.
            </p>
          </div>

          {/* Sicurezza & Privacy */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Locale e Sicura • Nessun dato inviato a server terzi
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors"
            >
              Ho capito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
