"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SidebarPwaInstall({ onAction }: { onAction?: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Verifica modalità standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // 2. Rilevamento iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Evento prima dell'installazione per browser Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (onAction) onAction();

    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    setShowDesktopHelp(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 transition cursor-pointer group"
        title="Installa l'app sul tuo PC cassa, tablet POS o smartphone per gestire le vendite a tutto schermo"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">📲</span>
          <div className="text-left min-w-0">
            <span className="block font-bold text-white leading-tight">Installa App</span>
            <span className="block text-[10px] text-slate-400 font-normal leading-tight truncate">
              Aggiungi a Home / Cassa POS
            </span>
          </div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
          PWA
        </span>
      </button>

      {/* Modal iOS / Safari */}
      {mounted && showIosModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-800 text-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h3 className="font-bold text-white text-base">Installa Vendoly su iPhone/iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg text-lg cursor-pointer"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Puoi aggiungere Vendoly sullo schermo del tuo dispositivo per operare a tutto schermo senza barre del browser:
            </p>

            <div className="space-y-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tocca l'icona <strong>Condividi</strong> nella barra di Safari (il quadratino con la freccia in alto <span className="inline-block px-1 bg-slate-700 rounded border border-slate-600">⎋</span> o <span className="inline-block px-1 bg-slate-700 rounded border border-slate-600">⬆</span>).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scorri l'elenco e tocca <strong>"Aggiungi alla schermata Home"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Premi <strong>Aggiungi</strong> in alto a destra: troverai l'icona sul display pronta per essere aperta istantaneamente!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer"
            >
              Ho capito!
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Desktop */}
      {mounted && showDesktopHelp && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDesktopHelp(false)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-800 text-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💻</span>
                <h3 className="font-bold text-white text-base">Installa Vendoly su PC Cassa</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopHelp(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg text-lg cursor-pointer"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Per avere Vendoly sul tuo monitor cassa POS come applicazione autonoma (senza barre del browser):
            </p>

            <div className="space-y-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Guarda nella <strong>barra degli indirizzi</strong> in alto a destra del browser (Chrome o Edge).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Clicca sull'icona <strong>"Installa app"</strong> (un monitor con freccia verso il basso) oppure apri il menu dei 3 puntini ➔ <strong>"Installa Vendoly"</strong>.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopHelp(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
