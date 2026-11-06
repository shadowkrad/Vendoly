"use client";

import { useEffect, useState } from "react";

type Evento = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Invito ad aggiungere la tessera alla schermata Home: bottone diretto su Android, istruzioni su iPhone. */
export default function AggiungiAllaHome({ accento, nome }: { accento: string; nome: string }) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [ios, setIos] = useState(false);
  const [installata, setInstallata] = useState(false);
  const [mostraIstruzioni, setMostraIstruzioni] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/i.test(ua));
    setInstallata(
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true
    );
    const prima = (e: Event) => {
      e.preventDefault();
      setEvento(e as Evento);
    };
    const dopo = () => setInstallata(true);
    window.addEventListener("beforeinstallprompt", prima);
    window.addEventListener("appinstalled", dopo);
    return () => {
      window.removeEventListener("beforeinstallprompt", prima);
      window.removeEventListener("appinstalled", dopo);
    };
  }, []);

  if (installata) return null;

  const aggiungi = async () => {
    if (evento) {
      await evento.prompt();
      await evento.userChoice.catch(() => null);
      setEvento(null);
    } else {
      setMostraIstruzioni((v) => !v);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
      <h2 className="text-sm font-bold text-gray-900">Tienila sempre a portata di mano</h2>
      <p className="text-xs text-gray-500 mt-1">
        Aggiungi la tessera alla schermata Home: avrai l&apos;icona di {nome} e i tuoi punti a un tocco.
      </p>
      <button
        type="button"
        onClick={aggiungi}
        className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: accento }}
      >
        Aggiungi alla schermata Home
      </button>
      {!evento && mostraIstruzioni && (
        <div className="mt-3 text-xs text-gray-600 space-y-1.5 bg-gray-50 rounded-xl p-3">
          {ios ? (
            <>
              <p className="font-semibold text-gray-800">Su iPhone (Safari):</p>
              <p>1. Tocca il pulsante Condividi (il quadrato con la freccia in su).</p>
              <p>2. Scorri e scegli &quot;Aggiungi alla schermata Home&quot;.</p>
              <p>3. Tocca &quot;Aggiungi&quot;.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-800">Dal browser del telefono:</p>
              <p>1. Apri il menu (i tre puntini in alto).</p>
              <p>2. Scegli &quot;Aggiungi a schermata Home&quot; o &quot;Installa app&quot;.</p>
              <p>3. Conferma.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
