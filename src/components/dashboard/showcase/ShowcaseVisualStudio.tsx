"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShowcaseConfig,
  DEFAULT_VENDOLY_SHOWCASE_CONFIG,
  GalleryPhotoItem,
} from "@/lib/showcase-defaults";
import {
  Sparkles,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Type,
  Palette,
  Eye,
  Sliders,
  Plus,
  Trash2,
  Upload,
  Star,
  ShieldCheck,
  Award,
  Clock,
  MapPin,
  MessageCircle,
  ArrowRight,
  Store,
  Truck,
  Quote,
  Lock,
  Globe,
} from "lucide-react";

type ControlTab = "hero" | "media" | "colori" | "chisiamo" | "badges" | "sezioni";

export default function ShowcaseVisualStudio() {
  const [config, setConfig] = useState<ShowcaseConfig>(DEFAULT_VENDOLY_SHOWCASE_CONFIG);
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>("hero");
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageProcessing, setImageProcessing] = useState<string | null>(null);

  // File Inputs Refs
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const aboutImageInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/impostazioni/vetrina")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.config) {
          setConfig(data.config);
        } else if (data && !data.error) {
          setConfig(data);
        }
      })
      .catch((err) => console.error("Errore fetch vetrina Vendoly:", err))
      .finally(() => setLoading(false));
  }, []);

  // Utility di compressione WebP lato client
  const processImageFile = (
    file: File,
    maxSize: number,
    format: "image/webp" | "image/png",
    callback: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", text: "Il file selezionato non è un'immagine valida." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: "error", text: "L'immagine supera i 10MB. Seleziona un file più leggero." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(format, format === "image/webp" ? 0.88 : undefined);
        callback(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/impostazioni/vetrina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setFeedback({ type: "success", text: "Vetrina boutique aggiornata con successo!" });
      } else {
        setFeedback({ type: "error", text: "Errore durante il salvataggio della vetrina." });
      }
    } catch {
      setFeedback({ type: "error", text: "Errore di connessione." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Vuoi ripristinare i testi e la grafica predefinita di Vendoly?")) {
      setConfig({ ...DEFAULT_VENDOLY_SHOWCASE_CONFIG });
      setFeedback({ type: "success", text: "Valori predefiniti ripristinati. Clicca Salva per confermare." });
    }
  };

  const addGalleryImage = (dataUrl: string) => {
    const newImg: GalleryPhotoItem = {
      id: `img_${Date.now()}`,
      url: dataUrl,
      caption: "Nuovo arrivo in boutique",
    };
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: [...(prev.gallery.images || []), newImg],
      },
    }));
  };

  const removeGalleryImage = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: prev.gallery.images.filter((img) => img.id !== id),
      },
    }));
  };

  const updateGalleryCaption = (id: string, caption: string) => {
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: prev.gallery.images.map((img) => (img.id === id ? { ...img, caption } : img)),
      },
    }));
  };

  const addTrustBadge = () => {
    const newBadge = {
      id: `badge_${Date.now()}`,
      icon: "check" as const,
      text: "Nuova Garanzia / Servizio",
    };
    setConfig((prev) => ({
      ...prev,
      trustBadges: [...(prev.trustBadges || []), newBadge],
    }));
  };

  const removeTrustBadge = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      trustBadges: prev.trustBadges.filter((b) => b.id !== id),
    }));
  };

  const updateTrustBadge = (id: string, text: string, icon: any) => {
    setConfig((prev) => ({
      ...prev,
      trustBadges: prev.trustBadges.map((b) => (b.id === id ? { ...b, text, icon } : b)),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Caricamento Visual Studio Vetrina...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Visual Studio */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Live Showcase Visual Studio • Boutique & Retail Store</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Personalizzazione Vetrina Interattiva
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Modifica in tempo reale claim hero, cover panoramica, galleria showroom, garanzie d&apos;acquisto e palette colori con simulatore responsive integrato.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Vedi Sito Live</span>
          </a>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition border border-white/10 cursor-pointer"
            title="Ripristina valori predefiniti"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salva Vetrina</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Layout Split: Controlli a Sinistra (Tabs) / Simulatore a Destra */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLONNA CONTROLLI */}
        <div className="xl:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Menu Tab Orizzontale */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: "hero", label: "Hero & Cover", icon: Type },
              { id: "media", label: "Media & Foto", icon: ImageIcon },
              { id: "colori", label: "Colori & Brand", icon: Palette },
              { id: "chisiamo", label: "Chi Siamo", icon: Store },
              { id: "badges", label: "Garanzie", icon: Award },
              { id: "sezioni", label: "Sezioni", icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeControlTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveControlTab(tab.id as ControlTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* CONTENUTO TAB ATTIVO */}
          <div className="space-y-4">
            {/* TAB 1: HERO & COVER */}
            {activeControlTab === "hero" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-600" />
                    <span>Intestazione &amp; Copertina Hero</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Definisci i titoli di benvenuto, il claim principale e la cover panoramica della boutique.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Badge Promozionale / Pill in Alto
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={config.hero.badgeText}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badgeText: e.target.value },
                      }))
                    }
                    placeholder="Es. ✨ Nuova Collezione Autunno/Inverno • Spedizione Rapida 24/48h"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Titolo Principale (Claim d&apos;impatto)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={config.hero.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, title: e.target.value },
                      }))
                    }
                    placeholder="Es. Capi Selezionati & Oggetti Esclusivi, sempre sincronizzati."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sottotitolo / Descrizione Boutique
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={config.hero.subtitle}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subtitle: e.target.value },
                      }))
                    }
                    placeholder="Descrivi brevemente lo stile della boutique, i brand trattati e i vantaggi per il cliente..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pulsante Primario (CTA Catalogo)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.hero.ctaPrimaryText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, ctaPrimaryText: e.target.value },
                        }))
                      }
                      placeholder="Es. Esplora la Collezione ✨"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pulsante Secondario (WhatsApp / Info)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.hero.ctaSecondaryText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, ctaSecondaryText: e.target.value },
                        }))
                      }
                      placeholder="Es. Chiedi su WhatsApp"
                    />
                  </div>
                </div>

                {/* Cover Immagine & Slider Overlay */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Immagine Copertina Panoramica (Hero Cover)
                    </label>
                    {config.hero.coverImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, coverImageUrl: null },
                          }))
                        }
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Rimuovi Copertina
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageProcessing("cover");
                        processImageFile(file, 1600, "image/webp", (dataUrl) => {
                          setConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, coverImageUrl: dataUrl },
                          }));
                          setImageProcessing(null);
                        });
                      }
                    }}
                  />

                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/20"
                  >
                    {config.hero.coverImageUrl ? (
                      <div className="relative h-28 rounded-xl overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={config.hero.coverImageUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <Upload className="w-4 h-4" />
                          <span>Cambia Immagine Cover</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">
                          Carica foto copertina o trascina qui il file
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Consigliato formato orizzontale (1600x900 WebP)
                        </p>
                      </div>
                    )}
                    {imageProcessing === "cover" && (
                      <p className="text-xs text-emerald-600 font-bold mt-2 animate-pulse">
                        Elaborazione WebP in corso...
                      </p>
                    )}
                  </div>

                  {/* Slider Overlay Scurimento */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scurimento Overlay Testo</span>
                      </span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {config.hero.overlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="95"
                      value={config.hero.overlayOpacity}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, overlayOpacity: parseInt(e.target.value) },
                        }))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Aumenta lo scurimento per rendere i testi bianchi perfettamente leggibili sopra la foto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA & FOTO SHOWROOM */}
            {activeControlTab === "media" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Galleria Fotografica Showroom &amp; Corner</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mostra scatti del negozio, dettagli di capi sartoriali e la cura degli allestimenti.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <span>Attiva Galleria</span>
                    <input
                      type="checkbox"
                      checked={config.gallery.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          gallery: { ...prev.gallery, enabled: e.target.checked },
                        }))
                      }
                      className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Titolo Sezione Galleria
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.gallery.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          gallery: { ...prev.gallery, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sottotitolo Galleria
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.gallery.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          gallery: { ...prev.gallery, subtitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Upload Nuova Foto */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageProcessing("gallery");
                      processImageFile(file, 1000, "image/webp", (dataUrl) => {
                        addGalleryImage(dataUrl);
                        setImageProcessing(null);
                      });
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Aggiungi Foto alla Galleria (Ottimizzata WebP)</span>
                </button>
                {imageProcessing === "gallery" && (
                  <p className="text-center text-xs text-emerald-600 font-bold animate-pulse">
                    Compressione e aggiunta foto in corso...
                  </p>
                )}

                {/* Lista Foto Esistenti */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {config.gallery.images?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 group"
                    >
                      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt="Galleria"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(item.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition cursor-pointer"
                          title="Elimina foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.caption || ""}
                        onChange={(e) => updateGalleryCaption(item.id, e.target.value)}
                        placeholder="Didascalia scatto..."
                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: COLORI & BRAND */}
            {activeControlTab === "colori" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <span>Identità Cromatica &amp; Brand Boutique</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personalizza il nome insegna, i colori primari e accento, il logo e la favicon.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome Insegna Boutique / Brand
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={config.brandName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Es. Vendoly Boutique & Store"
                  />
                </div>

                {/* Preset Cromatici per Settore Retail */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Preset Cromatici Settore Moda &amp; Boutique:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      {
                        name: "Emerald Retail",
                        prim: "#0f172a",
                        acc: "#059669",
                        desc: "Navy & Smeraldo Elegante",
                      },
                      {
                        name: "Luxury Fashion",
                        prim: "#0a0a0a",
                        acc: "#d97706",
                        desc: "Nero & Oro Pregiato",
                      },
                      {
                        name: "Streetwear Urban",
                        prim: "#18181b",
                        acc: "#ef4444",
                        desc: "Grafite & Rosso Fuoco",
                      },
                      {
                        name: "Vintage & Eco",
                        prim: "#14532d",
                        acc: "#b45309",
                        desc: "Bosco & Cuoio Caldo",
                      },
                      {
                        name: "Minimal Chic",
                        prim: "#1e293b",
                        acc: "#6366f1",
                        desc: "Ardesia & Indigo Moderno",
                      },
                      {
                        name: "Pastel Boutique",
                        prim: "#1f2937",
                        acc: "#e11d48",
                        desc: "Antracite & Rose Glam",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            primaryColor: preset.prim,
                            accentColor: preset.acc,
                          }))
                        }
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-left transition shadow-2xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.prim }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.acc }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 block group-hover:text-emerald-700">
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Colore Primario (Navbar &amp; Sfondi Scelti)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="w-9 h-9 rounded-xl border border-slate-200 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="flex-1 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Colore Accento (Pulsanti &amp; Badge)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="w-9 h-9 rounded-xl border border-slate-200 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="flex-1 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo & Favicon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {/* LOGO */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">Logo Vetrina</label>
                      {config.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, logoUrl: null }))}
                          className="text-[10px] text-rose-600 hover:underline"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageProcessing("logo");
                          processImageFile(file, 512, "image/webp", (dataUrl) => {
                            setConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
                            setImageProcessing(null);
                          });
                        }
                      }}
                    />
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50 flex items-center justify-center min-h-[64px]"
                    >
                      {config.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={config.logoUrl}
                          alt="Logo"
                          className="max-h-10 object-contain rounded"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Carica Logo (WebP / PNG)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FAVICON */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">Favicon Scheda Browser</label>
                      {config.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, faviconUrl: null }))}
                          className="text-[10px] text-rose-600 hover:underline"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={faviconInputRef}
                      accept="image/png,image/x-icon,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageProcessing("favicon");
                          processImageFile(file, 128, "image/png", (dataUrl) => {
                            setConfig((prev) => ({ ...prev, faviconUrl: dataUrl }));
                            setImageProcessing(null);
                          });
                        }
                      }}
                    />
                    <div
                      onClick={() => faviconInputRef.current?.click()}
                      className="border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50 flex items-center justify-center min-h-[64px]"
                    >
                      {config.faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={config.faviconUrl}
                          alt="Favicon"
                          className="w-6 h-6 object-contain rounded"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Carica Favicon (128x128 PNG)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CHI SIAMO & FILOSOFIA */}
            {activeControlTab === "chisiamo" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Chi Siamo &amp; Ricerca Stile</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Condividi con i clienti la passione per la selezione capi e la filosofia del negozio.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <span>Attiva Sezione</span>
                    <input
                      type="checkbox"
                      checked={config.about.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, enabled: e.target.checked },
                        }))
                      }
                      className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Titolo Sezione
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.about.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sottotitolo
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={config.about.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, subtitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Storia &amp; Descrizione Boutique
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={config.about.description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        about: { ...prev.about, description: e.target.value },
                      }))
                    }
                  />
                </div>

                {/* Foto Atmosfera / Founder */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Foto Atmosfera / Corner Boutique
                    </label>
                    {config.about.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            about: { ...prev.about, imageUrl: null },
                          }))
                        }
                        className="text-[10px] text-rose-600 hover:underline"
                      >
                        Rimuovi Foto
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={aboutImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageProcessing("about");
                        processImageFile(file, 1000, "image/webp", (dataUrl) => {
                          setConfig((prev) => ({
                            ...prev,
                            about: { ...prev.about, imageUrl: dataUrl },
                          }));
                          setImageProcessing(null);
                        });
                      }
                    }}
                  />

                  <div
                    onClick={() => aboutImageInputRef.current?.click()}
                    className="border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50 flex items-center justify-center min-h-[80px]"
                  >
                    {config.about.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={config.about.imageUrl}
                        alt="Chi Siamo"
                        className="h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Carica Foto Boutique o Staff (WebP)
                      </span>
                    )}
                  </div>
                </div>

                {/* Citazione Buyer / Direzione */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Citazione d&apos;Autore / Motto della Boutique</span>
                  </span>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Testo Citazione</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none italic"
                      value={config.about.quoteText || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, quoteText: e.target.value },
                        }))
                      }
                      placeholder="Es. Vestire bene non significa farsi notare, ma farsi ricordare."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Autore / Ruolo</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      value={config.about.quoteAuthor || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, quoteAuthor: e.target.value },
                        }))
                      }
                      placeholder="Es. Direzione Stile & Buyer — Vendoly Store"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: GARANZIE & TRUST BADGES */}
            {activeControlTab === "badges" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Distintivi di Garanzia (Trust Badges)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mostrati sotto la Hero per rassicurare clienti su spedizione, autenticità e reso.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTrustBadge}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {config.trustBadges?.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <select
                        value={b.icon}
                        onChange={(e) => updateTrustBadge(b.id, b.text, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white font-medium"
                      >
                        <option value="shield">🛡️ Autenticità &amp; Sicurezza</option>
                        <option value="clock">⏱️ Spedizione Rapida 24/48h</option>
                        <option value="award">🏆 Reso Garantito 14gg</option>
                        <option value="star">⭐ Recensioni &amp; Qualità</option>
                        <option value="check">✓ Ritiro al Banco Gratuito</option>
                      </select>

                      <input
                        type="text"
                        value={b.text}
                        onChange={(e) => updateTrustBadge(b.id, e.target.value, b.icon)}
                        placeholder="Testo garanzia..."
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => removeTrustBadge(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Rimuovi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: SEZIONI & TITOLI */}
            {activeControlTab === "sezioni" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Visibilità Sezioni Vetrina</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Attiva o disattiva le singole sezioni del portale pubblico in un click.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "showHero", label: "Sezione Hero (Copertina)" },
                    { id: "showTrustBadges", label: "Distintivi di Garanzia (Badges)" },
                    { id: "showChannels", label: "Fascia Canali Marketplace" },
                    { id: "showCatalog", label: "Catalogo Capi & Articoli" },
                    { id: "showGallery", label: "Galleria Foto Showroom" },
                    { id: "showAbout", label: "Chi Siamo & Ricerca Stile" },
                    { id: "showHours", label: "Orari Negozio & Ritiro" },
                    { id: "showContact", label: "Contatti & Punto Cassa" },
                  ].map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition"
                    >
                      <span className="text-xs font-semibold text-slate-800">{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={(config.sections as any)?.[sec.id] ?? true}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              [sec.id]: e.target.checked,
                            },
                          }))
                        }
                        className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Personalizzazione Titoli Sezioni
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Titolo Sezione Catalogo
                      </label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        value={config.customLabels?.catalogTitle || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            customLabels: {
                              ...prev.customLabels,
                              catalogTitle: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Sottotitolo Sezione Catalogo
                      </label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        value={config.customLabels?.catalogSubtitle || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            customLabels: {
                              ...prev.customLabels,
                              catalogSubtitle: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Titolo Orari &amp; Dove Siamo
                      </label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                        value={config.customLabels?.hoursTitle || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            customLabels: {
                              ...prev.customLabels,
                              hoursTitle: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLONNA ANTEPRIMA RESPONSIVE LIVE */}
        <div className="xl:col-span-6 space-y-3 xl:sticky xl:top-6">
          {/* Selettore Device Desktop / Mobile */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Simulatore Vetrina Live</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {deviceMode === "mobile" ? "iPhone 390px" : "Desktop View"}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  deviceMode === "mobile"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Anteprima Smartphone"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode("desktop")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  deviceMode === "desktop"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Anteprima Schermo Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>
          </div>

          {/* SIMULATORE CONTAINER */}
          <div
            className={`transition-all duration-300 mx-auto ${
              deviceMode === "mobile"
                ? "max-w-[390px] border-[8px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden bg-slate-900"
                : "w-full border border-slate-200/90 rounded-2xl shadow-md overflow-hidden bg-white"
            }`}
          >
            {/* Mockup iPhone Top Bar */}
            {deviceMode === "mobile" && (
              <div className="bg-slate-900 text-white text-[10px] px-6 py-2 flex items-center justify-between font-mono">
                <span>09:41</span>
                <div className="w-16 h-3.5 bg-black rounded-full" />
                <span>5G 100%</span>
              </div>
            )}

            {/* Schermata Vetrina Renderizzata */}
            <div className="bg-white max-h-[640px] overflow-y-auto scrollbar-none text-slate-800 text-xs">
              {/* Header Navbar Vetrina */}
              <div
                style={{ backgroundColor: config.primaryColor }}
                className="px-4 py-3 text-white flex items-center justify-between sticky top-0 z-20 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {config.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="h-6 max-w-[100px] object-contain rounded"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                      <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{config.brandName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    style={{ backgroundColor: config.accentColor }}
                    className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full shadow-2xs"
                  >
                    WhatsApp
                  </span>
                </div>
              </div>

              {/* Sezione Hero */}
              {config.sections?.showHero && (
                <div className="relative text-white overflow-hidden">
                  {/* Foto Copertina & Scurimento Overlay */}
                  {config.hero.coverImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={config.hero.coverImageUrl}
                        alt="Hero Cover"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-black transition-opacity"
                        style={{ opacity: (config.hero.overlayOpacity || 75) / 100 }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${config.primaryColor} 0%, #000 100%)`,
                      }}
                    />
                  )}

                  {/* Testi Hero */}
                  <div className="relative z-10 p-5 sm:p-7 space-y-3.5">
                    {config.hero.badgeText && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{config.hero.badgeText}</span>
                      </div>
                    )}

                    <h1 className="text-lg sm:text-2xl font-black leading-tight tracking-tight text-white">
                      {config.hero.title}
                    </h1>

                    <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed opacity-90 line-clamp-3">
                      {config.hero.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        style={{ backgroundColor: config.accentColor }}
                        className="px-3.5 py-1.5 rounded-full font-bold text-[11px] text-white shadow-md shadow-emerald-900/30 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{config.hero.ctaPrimaryText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {config.hero.ctaSecondaryText && (
                        <button className="px-3 py-1.5 rounded-full font-semibold text-[11px] bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white cursor-pointer">
                          {config.hero.ctaSecondaryText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sezione Trust Badges */}
              {config.sections?.showTrustBadges && config.trustBadges?.length > 0 && (
                <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {config.trustBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                          ✓
                        </span>
                        <span className="font-semibold text-slate-700 truncate">{badge.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fascia Canali Connessi */}
              {config.sections?.showChannels && (
                <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">
                    Sincronizzato:
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Subito
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Vinted
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      eBay
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Negozio
                    </span>
                  </div>
                </div>
              )}

              {/* Demo Catalogo Capi */}
              {config.sections?.showCatalog && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-xs text-slate-900">
                        {config.customLabels?.catalogTitle || "Catalogo Capi & Articoli"}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {config.customLabels?.catalogSubtitle || "Disponibilità aggiornata in tempo reale"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      8 Articoli
                    </span>
                  </div>

                  {/* Mini Cards Articoli Demo */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        title: "Sneakers Retro 90s Leather",
                        price: "€ 89,00",
                        img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80",
                        tag: "Unico pezzo",
                      },
                      {
                        title: "Giacca Sartoriale Lana Cotone",
                        price: "€ 145,00",
                        img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
                        tag: "Nuovo arrivo",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 space-y-1.5"
                      >
                        <div className="relative h-20 rounded-xl overflow-hidden bg-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.img}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            {item.tag}
                          </span>
                        </div>
                        <h4 className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[11px] font-black text-slate-900">{item.price}</span>
                          <span
                            style={{ backgroundColor: config.accentColor }}
                            className="text-[9px] text-white font-bold px-1.5 py-0.5 rounded"
                          >
                            Dettagli
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Galleria Foto Showroom */}
              {config.sections?.showGallery && config.gallery.enabled && (
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2.5">
                  <div>
                    <h3 className="font-black text-xs text-slate-900">{config.gallery.title}</h3>
                    <p className="text-[10px] text-slate-500">{config.gallery.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {config.gallery.images?.slice(0, 4).map((g) => (
                      <div key={g.id} className="space-y-1">
                        <div className="h-16 rounded-xl overflow-hidden bg-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.url} alt="Galleria" className="w-full h-full object-cover" />
                        </div>
                        {g.caption && (
                          <p className="text-[9px] text-slate-500 truncate">{g.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chi Siamo */}
              {config.sections?.showAbout && config.about.enabled && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-2.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    <Store className="w-3 h-3 text-emerald-600" />
                    <span>{config.about.title}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{config.about.subtitle}</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-3">
                    {config.about.description}
                  </p>

                  {config.about.quoteText && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border-l-2 border-emerald-500 italic text-[10px] text-slate-700 space-y-0.5">
                      <p>&ldquo;{config.about.quoteText}&rdquo;</p>
                      {config.about.quoteAuthor && (
                        <p className="text-[9px] font-bold text-slate-500 not-italic">
                          — {config.about.quoteAuthor}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sezione Orari & Negozio */}
              {config.sections?.showHours && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 text-[10px]">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{config.customLabels?.hoursTitle || "Orari Boutique & Ritiro"}</span>
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between py-0.5 border-b border-slate-200">
                      <span>Lunedì – Venerdì</span>
                      <span className="font-semibold text-slate-800">09:30 – 19:30</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Sabato</span>
                      <span className="font-bold text-emerald-700">09:30 – 19:30 (Continuato)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Coordinato */}
              <div
                style={{ backgroundColor: config.primaryColor }}
                className="p-4 text-white text-[10px] space-y-1 text-center"
              >
                <p className="font-bold">{config.brandName}</p>
                <p className="text-slate-300 text-[9px]">
                  © {new Date().getFullYear()} • Powered by Taaaac Suite v1.0.4
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
