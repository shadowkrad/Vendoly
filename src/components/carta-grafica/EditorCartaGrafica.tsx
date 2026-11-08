"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  PRESET_CARTA_LABELS,
  PresetCartaGrafica,
  CombinazioneColori,
  ContenutoRetro,
} from "@/lib/carta-grafica-types";
import {
  BigliettoFronte,
  BigliettoRetro,
  BuonoRegaloCard,
} from "@/components/carta-grafica/CartaGraficaCanvas";

export default function EditorCartaGrafica() {
  const [config, setConfig] = useState<CartaGraficaConfig | null>(null);
  const [attivita, setAttivita] = useState<DatiAttivitaCarta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Controlli dell'Editor Visivo
  const [sezioneAttiva, setSezioneAttiva] = useState<"stile" | "sfondi" | "biglietto" | "buono">("stile");
  const [vistaAnteprima, setVistaAnteprima] = useState<
    "biglietto" | "buono_cartoncino" | "buono_cartaceo" | "buono_web"
  >("biglietto");
  const [mostraGuideTaglio, setMostraGuideTaglio] = useState(false);
  const [zoomAnteprima, setZoomAnteprima] = useState<"normale" | "grande">("normale");

  const inputSfondoFronteRef = useRef<HTMLInputElement | null>(null);
  const inputSfondoRetroRef = useRef<HTMLInputElement | null>(null);
  const inputSfondoBuonoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/carta-grafica")
      .then((r) => r.json())
      .then((d) => {
        if (d?.config && d?.attivita) {
          setConfig(d.config);
          setAttivita(d.attivita);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const aggiorna = <K extends keyof CartaGraficaConfig>(chiave: K, valore: CartaGraficaConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [chiave]: valore } : prev));
  };

  const comprimiImmagineSfondo = (file: File, onDone: (dataUrl: string) => void) => {
    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", text: "Seleziona un file immagine valido (JPG, PNG o WebP)." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1400; // Risoluzione ottimale per stampa 85x55mm a 300 DPI
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h >= w && h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        onDone(dataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const salva = async (
    apriStampaDopo?: "a4" | "singolo" | "buono_cartaceo" | "buono_precompilato"
  ) => {
    if (!config) return;
    setSaving(true);
    setFeedback(null);
    let finestraStampa: Window | null = null;
    if (apriStampaDopo) {
      finestraStampa = window.open("", "_blank");
    }
    try {
      const res = await fetch("/api/carta-grafica", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (!res.ok) {
        finestraStampa?.close();
        setFeedback({ type: "error", text: d.error || "Errore durante il salvataggio della grafica." });
      } else {
        setConfig(d.config);
        setFeedback({ type: "success", text: "Grafica di Buoni e Biglietto da Visita salvata con successo!" });
        if (apriStampaDopo && finestraStampa) {
          if (apriStampaDopo === "buono_cartaceo") {
            finestraStampa.location.href = `/dashboard/biglietto-visita/stampa?tipo=buono_cartaceo`;
          } else if (apriStampaDopo === "buono_precompilato") {
            finestraStampa.location.href = `/dashboard/biglietto-visita/stampa?tipo=buono_precompilato`;
          } else {
            finestraStampa.location.href = `/dashboard/biglietto-visita/stampa?formato=${apriStampaDopo}`;
          }
        }
      }
    } catch {
      finestraStampa?.close();
      setFeedback({ type: "error", text: "Errore di connessione durante il salvataggio." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config || !attivita) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Caricamento Editor Visivo Buoni & Biglietti da Visita…
      </div>
    );
  }

  const buonoEsempio = {
    codice: "REG-BF2026",
    motivoEtichetta: "Buono Regalo",
    valore: "75,00 €",
    destinatario: "Giulia Rossi",
    acquirente: "Marco",
    messaggio: "Un momento speciale di relax e bellezza tutto per te!",
    scadenzaTesto: "31/12/2027",
    qrDataUrl: attivita.qrVetrinaDataUrl,
    condizioni: [
      "Valido per 12 mesi dalla data di emissione.",
      "Presenta il codice identificativo o il QR Code in cassa per scaricare il buono.",
    ],
    stato: "ATTIVA",
  };

  return (
    <div className="space-y-6">
      {/* INTESTAZIONE CON PULSANTI AZIONE RAPIDA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h2 className="text-lg font-bold text-slate-900">
              Studio Grafico Buoni Regalo & Biglietti da Visita
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalizza lo stile, carica uno sfondo personalizzato e stampa biglietti da visita (solo fronte o fronte/retro) e buoni regalo cartacei o digitali con codice identificativo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => salva("a4")}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            🖨️ Stampa Biglietti A4 ({config.formatoBiglietto === "SOLO_FRONTE" ? "10 Fronti" : "10 Fronte/Retro"})
          </button>
          <button
            type="button"
            onClick={() => salva("buono_cartaceo")}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold transition cursor-pointer"
          >
            ✍️ Stampa Buoni Cartacei A4 (2 per foglio)
          </button>
          <button
            type="button"
            onClick={() => salva("singolo")}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            🖼️ PDF 1:1 Tipografia
          </button>
          <button
            type="button"
            onClick={() => salva()}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {saving ? "Salvataggio…" : "💾 Salva Grafica"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-4 font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* GRIGLIA A 2 COLONNE: CONTROLLI A SINISTRA + EDITOR VISIVO LIVE A DESTRA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: PANNELLO CONTROLLI (5/12) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Tab di navigazione controlli */}
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-bold">
            {(
              [
                ["stile", "1. Stile & Colori"],
                ["sfondi", "2. Sfondo"],
                ["biglietto", "3. Biglietto"],
                ["buono", "4. Buoni"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSezioneAttiva(id)}
                className={`py-3 px-2 text-center border-b-2 transition cursor-pointer ${
                  sezioneAttiva === id
                    ? "border-slate-900 text-slate-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {/* TAB 1: STILE & COLORI DEL TEMA */}
            {sezioneAttiva === "stile" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Preset Grafico del Tema
                  </label>
                  <div className="space-y-2">
                    {PRESET_CARTA_LABELS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aggiorna("preset", p.id as PresetCartaGrafica)}
                        className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                          config.preset === p.id
                            ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{p.nome}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.descrizione}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Combinazione Fondo Fronte / Retro
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["SCURO_CHIARO", "Fronte Scuro / Retro Chiaro"],
                        ["CHIARO_SCURO", "Fronte Chiaro / Retro Scuro"],
                        ["TUTTO_SCURO", "Tutto Fondo Scuro"],
                        ["TUTTO_CHIARO", "Tutto Fondo Chiaro (Eco Stampa)"],
                      ] as Array<[CombinazioneColori, string]>
                    ).map(([id, testo]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => aggiorna("combinazioneColori", id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                          config.combinazioneColori === id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {testo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tavolozza Colori
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        aggiorna("coloreScuro", attivita.colorePrimario || "#3F4B2A");
                        aggiorna("coloreChiaro", "#EAE0D0");
                        aggiorna("coloreDettaglio", "#C9A86A");
                      }}
                      className="text-[11px] font-semibold text-slate-600 underline hover:text-slate-900 cursor-pointer"
                    >
                      Ripristina da tema attività
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Fondo Intenso
                      </label>
                      <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.coloreScuro}
                          onChange={(e) => aggiorna("coloreScuro", e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={config.coloreScuro}
                          onChange={(e) => aggiorna("coloreScuro", e.target.value)}
                          className="w-full text-[11px] font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Fondo Crema/Chiaro
                      </label>
                      <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.coloreChiaro}
                          onChange={(e) => aggiorna("coloreChiaro", e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={config.coloreChiaro}
                          onChange={(e) => aggiorna("coloreChiaro", e.target.value)}
                          className="w-full text-[11px] font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Dettagli / Oro ✦
                      </label>
                      <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1.5">
                        <input
                          type="color"
                          value={config.coloreDettaglio}
                          onChange={(e) => aggiorna("coloreDettaglio", e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={config.coloreDettaglio}
                          onChange={(e) => aggiorna("coloreDettaglio", e.target.value)}
                          className="w-full text-[11px] font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CARICAMENTO SFONDO PERSONALIZZATO */}
            {sezioneAttiva === "sfondi" && (
              <div className="space-y-5">
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                  Puoi caricare una tua texture (es. carta lino, marmo, illustrazione botanica) oppure un biglietto già disegnato. Usa il cursore <strong>Velo di contrasto</strong> per rendere le scritte sempre leggibili.
                </div>

                {/* Upload Sfondo Fronte */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Sfondo Personalizzato — FRONTE
                    </span>
                    {config.sfondoFronteUrl && (
                      <button
                        type="button"
                        onClick={() => aggiorna("sfondoFronteUrl", null)}
                        className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                      >
                        Rimuovi sfondo
                      </button>
                    )}
                  </div>

                  <input
                    ref={inputSfondoFronteRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) comprimiImmagineSfondo(f, (url) => aggiorna("sfondoFronteUrl", url));
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => inputSfondoFronteRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 text-xs font-semibold text-slate-700 bg-slate-50/60 transition cursor-pointer"
                  >
                    {config.sfondoFronteUrl
                      ? "🔄 Cambia immagine di sfondo Fronte"
                      : "📤 Carica immagine di sfondo Fronte (JPG, PNG, WebP)"}
                  </button>

                  {config.sfondoFronteUrl && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Velo di contrasto sul Fronte</span>
                        <span className="font-mono font-bold">{config.veloOpacitaFronte}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={85}
                        value={config.veloOpacitaFronte}
                        onChange={(e) => aggiorna("veloOpacitaFronte", Number(e.target.value))}
                        className="w-full"
                      />
                      <label className="flex items-center gap-2 text-xs text-slate-700 pt-1">
                        <input
                          type="checkbox"
                          checked={config.nascondiTestiFronte}
                          onChange={(e) => aggiorna("nascondiTestiFronte", e.target.checked)}
                        />
                        L&apos;immagine caricata contiene già logo e testi (nascondi scritte automatiche)
                      </label>
                    </div>
                  )}
                </div>

                {/* Upload Sfondo Retro */}
                {config.formatoBiglietto === "FRONTE_RETRO" && (
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Sfondo Personalizzato — RETRO
                      </span>
                      {config.sfondoRetroUrl && (
                        <button
                          type="button"
                          onClick={() => aggiorna("sfondoRetroUrl", null)}
                          className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                        >
                          Rimuovi sfondo
                        </button>
                      )}
                    </div>

                    <input
                      ref={inputSfondoRetroRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) comprimiImmagineSfondo(f, (url) => aggiorna("sfondoRetroUrl", url));
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => inputSfondoRetroRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 text-xs font-semibold text-slate-700 bg-slate-50/60 transition cursor-pointer"
                    >
                      {config.sfondoRetroUrl
                        ? "🔄 Cambia immagine di sfondo Retro"
                        : "📤 Carica immagine di sfondo Retro"}
                    </button>

                    {config.sfondoRetroUrl && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>Velo di contrasto sul Retro</span>
                          <span className="font-mono font-bold">{config.veloOpacitaRetro}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={85}
                          value={config.veloOpacitaRetro}
                          onChange={(e) => aggiorna("veloOpacitaRetro", Number(e.target.value))}
                          className="w-full"
                        />
                        <label className="flex items-center gap-2 text-xs text-slate-700 pt-1">
                          <input
                            type="checkbox"
                            checked={config.nascondiTestiRetro}
                            onChange={(e) => aggiorna("nascondiTestiRetro", e.target.checked)}
                          />
                          L&apos;immagine caricata contiene già gli orari (nascondi tabella orari)
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Modalità di adattamento immagine */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Adattamento Immagine di Sfondo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => aggiorna("sfondoFit", "cover")}
                      className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        config.sfondoFit === "cover"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Riempi tutto il biglietto (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => aggiorna("sfondoFit", "contain")}
                      className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        config.sfondoFit === "contain"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Adatta intero (Contain)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BIGLIETTO DA VISITA (SOLO FRONTE O FRONTE + RETRO) */}
            {sezioneAttiva === "biglietto" && (
              <div className="space-y-4">
                {/* Scelta formato Solo Fronte vs Fronte + Retro */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Formato Biglietto da Visita
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => aggiorna("formatoBiglietto", "FRONTE_RETRO")}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        config.formatoBiglietto === "FRONTE_RETRO"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-bold">Fronte + Retro</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Fronte con logo/recapiti + Retro con tabella Orari e/o QR
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => aggiorna("formatoBiglietto", "SOLO_FRONTE")}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        config.formatoBiglietto === "SOLO_FRONTE"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-bold">Solo Fronte</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Stampa su un solo lato (con opzione orari/QR sul fronte)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Campi personalizzabili del Fronte */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Testi sul Fronte
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Categoria sotto al logo
                      </label>
                      <input
                        type="text"
                        value={config.sottotitoloBrand}
                        onChange={(e) => aggiorna("sottotitoloBrand", e.target.value)}
                        placeholder="Es. ESTETICA"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Firma / Titolare
                      </label>
                      <input
                        type="text"
                        value={config.firmaBrand}
                        onChange={(e) => aggiorna("firmaBrand", e.target.value)}
                        placeholder="Es. di Falomi Beatrice"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Sovratitolo sede (corsivo)
                      </label>
                      <input
                        type="text"
                        value={config.sovratitoloSede}
                        onChange={(e) => aggiorna("sovratitoloSede", e.target.value)}
                        placeholder="Es. Presso (o lascia vuoto)"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Titolo sede destra
                      </label>
                      <input
                        type="text"
                        value={config.nomeSedeOspite}
                        onChange={(e) => aggiorna("nomeSedeOspite", e.target.value)}
                        placeholder={attivita.nome || "Es. NUCCIO NEXT"}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.mostraOrariCompattiFronte}
                        onChange={(e) => aggiorna("mostraOrariCompattiFronte", e.target.checked)}
                      />
                      Mostra riga orari compatta direttamente sul Fronte
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.mostraQrFronte}
                        onChange={(e) => aggiorna("mostraQrFronte", e.target.checked)}
                      />
                      Mostra QR Code di prenotazione sul Fronte
                    </label>
                  </div>
                </div>

                {/* Opzioni del Retro (visibili se Fronte + Retro) */}
                {config.formatoBiglietto === "FRONTE_RETRO" && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contenuto del Retro
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(
                        [
                          ["ORARI", "Tabella Orari Ufficiali (Stile BF Estetica)"],
                          ["ORARI_QR", "Orari Ufficiali + QR Code Prenota Online"],
                          ["APPUNTAMENTI_QR", "Righe Promemoria Appuntamenti + QR Code"],
                        ] as Array<[ContenutoRetro, string]>
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => aggiorna("contenutoRetro", id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                            config.contenutoRetro === id
                              ? "border-slate-900 bg-slate-900/5 text-slate-900 ring-1 ring-slate-900"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {config.contenutoRetro !== "APPUNTAMENTI_QR" && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => aggiorna("modalitaOrariRetro", "GIORNALIERO")}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              config.modalitaOrariRetro === "GIORNALIERO"
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            Giornaliero (Lun..Sab)
                          </button>
                          <button
                            type="button"
                            onClick={() => aggiorna("modalitaOrariRetro", "RAGGRUPPATO")}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              config.modalitaOrariRetro === "RAGGRUPPATO"
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            Giorni Raggruppati
                          </button>
                        </div>

                        {config.modalitaOrariRetro === "GIORNALIERO" && (
                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.includiDomenica}
                              onChange={(e) => aggiorna("includiDomenica", e.target.checked)}
                            />
                            Includi anche la riga Domenica
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Box informativo sincronizzazione automatica */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">
                    🔗 Dati sincronizzati automaticamente dall&apos;attività:
                  </div>
                  <div>
                    • <strong>Indirizzo:</strong> {attivita.indirizzo || "Non impostato"}{" "}
                    {attivita.citta}
                  </div>
                  <div>
                    • <strong>Telefono:</strong> {attivita.telefono || "Non impostato"}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    Gli orari e i recapiti vengono letti in automatico dalle impostazioni ufficiali della tua attività senza doverli riscrivere.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: OPZIONI BUONI REGALO (CARTACEO E DIGITALE) */}
            {sezioneAttiva === "buono" && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <div>
                    I <strong>Buoni Regalo</strong> (sia <strong>Cartacei da stampare al cliente</strong> che <strong>Digitali</strong>) ereditano automaticamente il <strong>Preset</strong>, i <strong>Colori</strong> e il <strong>Medaglione/Logo</strong> dell&apos;attività.
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Ogni buono include sempre il riquadro <strong>CODICE IDENTIFICATIVO PER SCARICARE IL BUONO</strong> per scalare il credito in cassa.
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.usaSfondoFronteSuBuono}
                    onChange={(e) => aggiorna("usaSfondoFronteSuBuono", e.target.checked)}
                  />
                  Usa lo sfondo personalizzato del Fronte anche sui Buoni Regalo
                </label>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Sfondo Dedicato solo per i Buoni (opzionale)
                    </span>
                    {config.sfondoBuonoUrl && (
                      <button
                        type="button"
                        onClick={() => aggiorna("sfondoBuonoUrl", null)}
                        className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>

                  <input
                    ref={inputSfondoBuonoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) comprimiImmagineSfondo(f, (url) => aggiorna("sfondoBuonoUrl", url));
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => inputSfondoBuonoRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 text-xs font-semibold text-slate-700 bg-slate-50/60 transition cursor-pointer"
                  >
                    {config.sfondoBuonoUrl
                      ? "🔄 Cambia sfondo dedicato dei Buoni"
                      : "📤 Carica uno sfondo specifico per i Buoni Regalo"}
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Anteprima & Stampa Rapida Buoni
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVistaAnteprima("buono_cartaceo")}
                      className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold transition cursor-pointer"
                    >
                      ✍️ Vedi Buono Cartaceo (da compilare)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaAnteprima("buono_cartoncino")}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      🎁 Vedi Buono Precompilato
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => salva("buono_cartaceo")}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                    >
                      🖨️ Stampa Foglio A4 con 2 Buoni Cartacei da compilare in negozio →
                    </button>
                    <button
                      type="button"
                      onClick={() => salva("buono_precompilato")}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      🖨️ Compila al volo e Stampa Buono Regalo con Codice & QR →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: EDITOR VISIVO & ANTEPRIMA LIVE 1:1 (7/12) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5 lg:sticky lg:top-6">
          {/* Barra strumenti superiore dell'anteprima */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVistaAnteprima("biglietto")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  vistaAnteprima === "biglietto"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🪪 Biglietto da Visita
              </button>
              <button
                type="button"
                onClick={() => setVistaAnteprima("buono_cartoncino")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  vistaAnteprima === "buono_cartoncino"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🎁 Cartoncino Buono Regalo
              </button>
              <button
                type="button"
                onClick={() => setVistaAnteprima("buono_cartaceo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  vistaAnteprima === "buono_cartaceo"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                ✍️ Buono Cartaceo (da compilare)
              </button>
              <button
                type="button"
                onClick={() => setVistaAnteprima("buono_web")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  vistaAnteprima === "buono_web"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                📱 Buono su Smartphone
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {vistaAnteprima === "biglietto" && (
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mostraGuideTaglio}
                    onChange={(e) => setMostraGuideTaglio(e.target.checked)}
                  />
                  <span>Guide di taglio (85×55 mm)</span>
                </label>
              )}
              <button
                type="button"
                onClick={() =>
                  setZoomAnteprima((z) => (z === "normale" ? "grande" : "normale"))
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
              >
                {zoomAnteprima === "normale" ? "🔍 Ingrandisci" : "🔍 Riduci"}
              </button>
            </div>
          </div>

          {/* TAVOLO DI LAVORO (effetto carta/lino caldo come nella foto del biglietto BF Estetica) */}
          <div
            className="rounded-2xl p-5 sm:p-8 transition-all flex flex-col items-center justify-center gap-6"
            style={{
              background: "linear-gradient(145deg, #E3DACB 0%, #D6CBB9 100%)",
            }}
          >
            {vistaAnteprima === "biglietto" && (
              <div
                className={`w-full flex flex-col items-center gap-6 ${
                  zoomAnteprima === "grande" ? "max-w-[560px]" : "max-w-[460px]"
                }`}
              >
                {/* FRONTE */}
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                    <span>Fronte Biglietto (85 × 55 mm)</span>
                    <span>
                      {config.formatoBiglietto === "SOLO_FRONTE"
                        ? "Modalità: Solo Fronte"
                        : "Lato 1 di 2"}
                    </span>
                  </div>
                  <div className="rounded-md overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
                    <BigliettoFronte
                      config={config}
                      attivita={attivita}
                      mostraGuideTaglio={mostraGuideTaglio}
                    />
                  </div>
                </div>

                {/* RETRO (mostrato solo se scelto FRONTE_RETRO) */}
                {config.formatoBiglietto === "FRONTE_RETRO" ? (
                  <div className="w-full space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                      <span>Retro Biglietto — Orari Ufficiali (85 × 55 mm)</span>
                      <span>Lato 2 di 2</span>
                    </div>
                    <div className="rounded-md overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
                      <BigliettoRetro
                        config={config}
                        attivita={attivita}
                        mostraGuideTaglio={mostraGuideTaglio}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-xl bg-white/60 border border-slate-400/40 px-4 py-3 text-center text-xs text-slate-700">
                    Hai selezionato il formato <strong>Solo Fronte</strong>: in stampa verrà generata una sola pagina A4 con 10 fronti (senza retro).
                  </div>
                )}
              </div>
            )}

            {vistaAnteprima === "buono_cartoncino" && (
              <div className="w-full max-w-[640px] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                  <span>Cartoncino Buono Regalo con Codice Identificativo & QR (210 × 99 mm)</span>
                  <span>Anteprima Live</span>
                </div>
                <BuonoRegaloCard
                  config={config}
                  attivita={attivita}
                  buono={buonoEsempio}
                  layout="cartoncino"
                />
              </div>
            )}

            {vistaAnteprima === "buono_cartaceo" && (
              <div className="w-full max-w-[640px] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                  <span>Buono Regalo Cartaceo da compilare a mano (con Codice Identificativo)</span>
                  <span>Stampa A4</span>
                </div>
                <BuonoRegaloCard
                  config={config}
                  attivita={attivita}
                  buono={{
                    ...buonoEsempio,
                    codice: "",
                  }}
                  layout="cartaceo"
                />
              </div>
            )}

            {vistaAnteprima === "buono_web" && (
              <div className="w-full max-w-[440px] space-y-2">
                <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Pagina Pubblica /buono/[token] su Smartphone (con Codice Identificativo)
                </div>
                <BuonoRegaloCard
                  config={config}
                  attivita={attivita}
                  buono={buonoEsempio}
                  layout="web"
                />
              </div>
            )}
          </div>

          {/* Barra inferiore consigli di stampa */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              💡 Puoi stampare su foglio A4 sia i <strong>10 Biglietti da Visita (85×55 mm)</strong> sia i <strong>2 Buoni Regalo Cartacei</strong> con guida di ritaglio.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => salva("buono_cartaceo")}
                className="text-emerald-300 hover:text-emerald-200 font-bold underline cursor-pointer"
              >
                Stampa Buoni Cartacei A4 →
              </button>
              <button
                type="button"
                onClick={() => salva("a4")}
                className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
              >
                Stampa Biglietti A4 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
