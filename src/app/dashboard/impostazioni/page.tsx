"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Store,
  Truck,
  Globe,
  Mail,
  Smartphone,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Share2,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Star,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import RegisteredDevicesCard from "@/components/dashboard/RegisteredDevicesCard";
import TelegramSettingsPanel, { TelegramSettingsData } from "@/components/dashboard/TelegramSettingsPanel";
import FidelitySettingsPanel, { FidelitySettingsData } from "@/components/dashboard/FidelitySettingsPanel";
import { Send, Award } from "lucide-react";
import ShowcaseVisualStudio from "@/components/dashboard/showcase/ShowcaseVisualStudio";

type SettingsTab = "negozio" | "vendita" | "dominio" | "email" | "telegram" | "fidelity" | "dispositivi" | "aspetto";

interface TabItem {
  id: SettingsTab;
  label: string;
  shortLabel: string;
  iconComponent: React.ElementType;
  shortDescription: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "negozio",
    label: "Negozio & Vetrina",
    shortLabel: "Negozio",
    iconComponent: Store,
    shortDescription: "Anagrafica, P.IVA e orari",
    description: "Ragione sociale, P.IVA, sede operativa, contatti e dati punto cassa",
  },
  {
    id: "vendita",
    label: "Vendita & Spedizioni",
    shortLabel: "Spedizioni",
    iconComponent: Truck,
    shortDescription: "Soglie, corrieri e scorte",
    description: "Soglie spedizione gratuita, costi corriere e sincronizzazione automatica scorte",
  },
  {
    id: "dominio",
    label: "Dominio & SSL",
    shortLabel: "Dominio",
    iconComponent: Globe,
    shortDescription: "Vetrina online e DNS",
    description: "Indirizzo vetrina pubblica, certificato Let's Encrypt e puntamenti DNS",
  },
  {
    id: "email",
    label: "Email & Notifiche",
    shortLabel: "Email",
    iconComponent: Mail,
    shortDescription: "Gateway email e ricevute",
    description: "Canale email Taaaac Mail Engine e notifiche di conferma ordine al cliente",
  },
  {
    id: "telegram",
    label: "Telegram Hub & Negozio",
    shortLabel: "Telegram",
    iconComponent: Send,
    shortDescription: "Bot ed avvisi ordini",
    description: "Notifiche ordini e scontrini sul gruppo Telegram del personale di cassa e One-Tap Connect",
  },
  {
    id: "fidelity",
    label: "Fidelity & Punti",
    shortLabel: "Fidelity",
    iconComponent: Award,
    shortDescription: "Raccolta punti e sconti",
    description: "Fidelizzazione clienti cassa con numero di telefono, catalogo premi e buoni sconto",
  },
  {
    id: "dispositivi",
    label: "Dispositivi PWA",
    shortLabel: "Dispositivi",
    iconComponent: Smartphone,
    shortDescription: "Biometria e PIN cassa",
    description: "Accesso rapido biometrico (FaceID, TouchID, PIN) e revoca smartphone da remoto",
  },
  {
    id: "aspetto",
    label: "Aspetto & Brand",
    shortLabel: "Brand",
    iconComponent: Palette,
    shortDescription: "Logo, favicon e colori",
    description: "Personalizzazione tema punto cassa POS, colori vetrina, logo e favicon",
  },
];

export default function VendolyImpostazioniPage() {
  const { config } = useTenantConfig();
  const [activeTab, setActiveTab] = useState<SettingsTab>("negozio");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Telegram & Fidelity State
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettingsData>({
    enabled: false,
    botToken: "",
    botUsername: "",
    staffChatId: "",
  });

  const [fidelitySettings, setFidelitySettings] = useState<FidelitySettingsData>({
    enabled: false,
    pointsPerEuro: 1,
    welcomeBonusPoints: 10,
    minPointsToRedeem: 50,
    rewards: [],
  });

  // Form State
  const [form, setForm] = useState({
    nomeAttivita: config?.nomeAttivita || "Vendoly Retail Store",
    ragioneSociale: "",
    partitaIva: "",
    indirizzo: "",
    titolare: "",
    telefono: "",
    emailContatto: "",
    orariFeriali: "09:30 – 13:00 / 15:30 – 19:30",
    orariSabato: "09:30 – 19:30 (Continuato)",
    orariDomenica: "Chiuso",
    sogliaSpedizioneGratis: "50",
    costoSpedizioneStandard: "5.90",
    ritiroInSede: true,
    sincronizzazioneScorte: true,
    notificaScorteBassecritiche: true,
    politicaReso:
      "Reso garantito entro 14 giorni lavorativi dalla data di ricezione dell'ordine per capi integri e con cartellino.",
    colorePrimario: "#059669",
    coloreTema: "emerald",
    logoUrl: "",
    faviconUrl: "",
    messaggioScontrino: "Grazie per il tuo acquisto su Vendoly! Torna a trovarci.",
  });

  // Brand Assets State & Refs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [dragActiveFavicon, setDragActiveFavicon] = useState(false);
  const [imageProcessing, setImageProcessing] = useState<string | null>(null);

  // Omnichannel State
  const [channelStatus, setChannelStatus] = useState<any>(null);
  const [syncingOmnichannel, setSyncingOmnichannel] = useState(false);

  const handleSyncOmnichannel = async () => {
    setSyncingOmnichannel(true);
    setFeedback(null);
    try {
      const parseTimeSlots = (str: string) => {
        if (!str || str.toLowerCase().includes("chiuso")) return [];
        const parts = str.split("/").map((p) => p.trim());
        const slots: { open: string; close: string }[] = [];
        for (const p of parts) {
          const match = p.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);
          if (match) {
            slots.push({
              open: match[1].replace(".", ":").padStart(5, "0"),
              close: match[2].replace(".", ":").padStart(5, "0"),
            });
          }
        }
        if (slots.length === 0) {
          slots.push({ open: "09:30", close: "19:30" });
        }
        return slots;
      };

      const ferialiSlots = parseTimeSlots(form.orariFeriali);
      const sabatoSlots = parseTimeSlots(form.orariSabato);
      const domenicaSlots = parseTimeSlots(form.orariDomenica);

      const weeklyHours = [
        { dayOfWeek: "MONDAY" as const, isOpen: ferialiSlots.length > 0, slots: ferialiSlots },
        { dayOfWeek: "TUESDAY" as const, isOpen: ferialiSlots.length > 0, slots: ferialiSlots },
        { dayOfWeek: "WEDNESDAY" as const, isOpen: ferialiSlots.length > 0, slots: ferialiSlots },
        { dayOfWeek: "THURSDAY" as const, isOpen: ferialiSlots.length > 0, slots: ferialiSlots },
        { dayOfWeek: "FRIDAY" as const, isOpen: ferialiSlots.length > 0, slots: ferialiSlots },
        { dayOfWeek: "SATURDAY" as const, isOpen: sabatoSlots.length > 0, slots: sabatoSlots },
        { dayOfWeek: "SUNDAY" as const, isOpen: domenicaSlots.length > 0, slots: domenicaSlots },
      ];

      const res = await fetch("/api/sync/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyHours }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Errore sincronizzazione canali");
      }

      setFeedback({
        type: "success",
        text: "🚀 Orari negozio sincronizzati all'unisono su Google Maps, Meta e WhatsApp!",
      });
      const st = await fetch("/api/sync/channels").then((r) => r.json()).catch(() => null);
      if (st) setChannelStatus(st);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Errore durante la sincronizzazione" });
    } finally {
      setSyncingOmnichannel(false);
    }
  };

  useEffect(() => {
    fetch("/api/sync/channels")
      .then((r) => r.json())
      .then((st) => setChannelStatus(st))
      .catch(() => {});

    fetch("/api/impostazioni")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm((f) => ({
            ...f,
            nomeAttivita: data.brandName || f.nomeAttivita,
            ragioneSociale: data.ragioneSociale || "",
            partitaIva: data.partitaIva || "",
            indirizzo: data.indirizzo || "",
            titolare: data.titolare || "",
            logoUrl: data.logoUrl || "",
            faviconUrl: data.faviconUrl || "",
            colorePrimario: data.accentColor || f.colorePrimario,
            emailContatto: data.contactEmail || f.emailContatto,
            telefono: data.phone || f.telefono,
            orariFeriali: data.orariFeriali || f.orariFeriali,
            orariSabato: data.orariSabato || f.orariSabato,
            orariDomenica: data.orariDomenica || f.orariDomenica,
            sogliaSpedizioneGratis: String(data.sogliaSpedizioneGratis ?? f.sogliaSpedizioneGratis),
            costoSpedizioneStandard: String(data.costoSpedizioneStandard ?? f.costoSpedizioneStandard),
            ritiroInSede: data.ritiroInSede !== undefined ? data.ritiroInSede : f.ritiroInSede,
            politicaReso: data.politicaReso || f.politicaReso,
            messaggioScontrino: data.messaggioScontrino || f.messaggioScontrino,
          }));
        }
      })
      .catch((err) => console.error("Errore caricamento impostazioni:", err));
  }, []);

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
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: "error", text: "L'immagine supera gli 8MB. Seleziona un file più leggero." });
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
        const dataUrl = canvas.toDataURL(format, format === "image/webp" ? 0.9 : undefined);
        callback(dataUrl);
      };
      img.onerror = () => {
        setFeedback({ type: "error", text: "Impossibile elaborare l'immagine caricata." });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/impostazioni", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: form.nomeAttivita,
          ragioneSociale: form.ragioneSociale,
          partitaIva: form.partitaIva,
          indirizzo: form.indirizzo,
          titolare: form.titolare,
          logoUrl: form.logoUrl || null,
          faviconUrl: form.faviconUrl || null,
          accentColor: form.colorePrimario,
          contactEmail: form.emailContatto,
          phone: form.telefono,
          orariFeriali: form.orariFeriali,
          orariSabato: form.orariSabato,
          orariDomenica: form.orariDomenica,
          sogliaSpedizioneGratis: form.sogliaSpedizioneGratis,
          costoSpedizioneStandard: form.costoSpedizioneStandard,
          ritiroInSede: form.ritiroInSede,
          politicaReso: form.politicaReso,
          messaggioScontrino: form.messaggioScontrino,
          telegramSettings,
          fidelitySettings,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", text: "Impostazioni del negozio salvate con successo!" });
      } else {
        setFeedback({ type: "error", text: "Errore durante il salvataggio." });
      }
    } catch {
      setFeedback({ type: "error", text: "Errore durante il salvataggio." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const displayDomain =
    config?.customDomain ||
    (config?.sottodominio ? `${config.sottodominio}.taaaac.eu` : "littlecreations.family");

  const currentTab = TABS.find((t) => t.id === activeTab);
  const ActiveIcon = currentTab?.iconComponent || Store;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Intestazione Principale */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>🏪 Punto Cassa & E-Commerce</span>
            <span>•</span>
            <span>Configurazione Negozio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            Impostazioni Vendoly
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci dati fiscali, soglie spedizione, sincronizzazione scorte canali e dominio vetrina.
          </p>
        </div>

        {activeTab !== "aspetto" && (
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Feedback Alert */}
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
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* LAYOUT A 2 COLONNE: NAVIGAZIONE VERTICALE A SINISTRA + CONTENUTI A DESTRA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: MENU SEZIONI IMPOSTAZIONI */}
        <aside className="lg:col-span-4 xl:col-span-3 sticky top-14 lg:top-6 z-30 lg:z-auto space-y-3">
          <div className="bg-white/95 backdrop-blur-md lg:bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xs">
            {/* Header Desktop */}
            <div className="px-3 py-2 border-b border-slate-100 hidden lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sezioni Impostazioni
              </span>
            </div>

            {/* Menu a Tendina Compatto per Smartphone e PWA (< lg) */}
            <div className="lg:hidden p-1">
              <label htmlFor="settings-tab-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                Sezione Impostazioni:
              </label>
              <div className="relative">
                <select
                  id="settings-tab-select"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold py-2.5 pl-3.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                >
                  {TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Navigazione Verticale Completa per Desktop (lg:) */}
            <nav
              className="hidden lg:flex flex-col gap-1.5 pt-2"
              aria-label="Sezioni Impostazioni Vendoly"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComp = tab.iconComponent;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center justify-between w-full p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                          <span>{tab.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal truncate">
                          {tab.shortDescription}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? "text-emerald-600 translate-x-0.5"
                          : "text-slate-300 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* COLONNA DESTRA: PANNELLO CONTENUTI */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Header contestuale scheda attiva */}
          {currentTab && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {currentTab.label}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentTab.description}</p>
                </div>
              </div>
            </div>
          )}

      {/* CONTENUTO SCHEDE */}

      {/* TAB 1: NEGOZIO & VETRINA */}
      {activeTab === "negozio" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Negozio / Insegna
              </label>
              <input
                type="text"
                value={form.nomeAttivita}
                onChange={(e) => setForm({ ...form, nomeAttivita: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ragione Sociale
              </label>
              <input
                type="text"
                value={form.ragioneSociale}
                onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Partita IVA / Codice Fiscale
              </label>
              <input
                type="text"
                value={form.partitaIva}
                onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sede del Negozio / Magazzino
              </label>
              <input
                type="text"
                value={form.indirizzo}
                onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titolare / Referente Negozio
              </label>
              <input
                type="text"
                placeholder="Es. Sonia Moscaritolo"
                value={form.titolare}
                onChange={(e) => setForm({ ...form, titolare: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefono Negozio & WhatsApp Assistenza
              </label>
              <input
                type="text"
                placeholder="+39 02 ..."
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Contatto Clienti
              </label>
              <input
                type="email"
                placeholder="ordini@tuosito.it"
                value={form.emailContatto}
                onChange={(e) => setForm({ ...form, emailContatto: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Orari di Apertura Negozio (Issue #11) */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ⏰ Orari di Apertura Negozio Fisico
              </h3>
              <p className="text-[11px] text-slate-500">
                Mostrati nel footer e nella sezione &quot;Negozio &amp; Orari&quot; della vetrina online.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lunedì – Venerdì
                </label>
                <input
                  type="text"
                  placeholder="09:30 – 13:00 / 15:30 – 19:30"
                  value={form.orariFeriali}
                  onChange={(e) => setForm({ ...form, orariFeriali: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sabato
                </label>
                <input
                  type="text"
                  placeholder="09:30 – 19:30 (Continuato)"
                  value={form.orariSabato}
                  onChange={(e) => setForm({ ...form, orariSabato: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domenica / Festivi
                </label>
                <input
                  type="text"
                  placeholder="Chiuso"
                  value={form.orariDomenica}
                  onChange={(e) => setForm({ ...form, orariDomenica: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Opzioni Ricevute & Cortesia Cassa POS */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🧾</span> Opzioni Ricevute & Cortesia Cassa POS
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Messaggio di Cortesia Scontrino / Footer Ordini
                </label>
                <textarea
                  rows={3}
                  value={form.messaggioScontrino}
                  onChange={(e) => setForm({ ...form, messaggioScontrino: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Testo stampato in calce allo scontrino o alle email di conferma ordine..."
                />
              </div>
            </div>

            {/* Hub Sincronizzazione Omnicanale */}
            <div className="pt-4 border-t border-slate-100">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-lg text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Hub Sincronizzazione Omnicanale
                        <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                          v1.1.0 All'Unisono
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Un solo click aggiorna orari negozio fisico su Google Maps, Meta (Facebook & IG) e WhatsApp Business.
                      </p>
                    </div>
                  </div>
                  {channelStatus?.lastOmnichannelSyncAt && (
                    <div className="text-[11px] text-slate-400">
                      Ultima sinc: <span className="text-slate-200 font-mono">{new Date(channelStatus.lastOmnichannelSyncAt).toLocaleString("it-IT")}</span>
                    </div>
                  )}
                </div>

                {/* Canali Connessi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">Google Maps</div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${channelStatus?.channels?.google?.enabled ? "bg-emerald-400" : "bg-emerald-400"}`} />
                        {channelStatus?.channels?.google?.enabled ? "Collegato" : "Pronto (Core)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">Facebook & IG</div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${channelStatus?.channels?.meta?.enabled ? "bg-emerald-400" : "bg-emerald-400"}`} />
                        {channelStatus?.channels?.meta?.enabled ? "Collegato" : "Pronto (Core)"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">WhatsApp</div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Attivo 1-Click
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">Review Booster</div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Email 5 Stelle
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSyncOmnichannel}
                    disabled={syncingOmnichannel}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {syncingOmnichannel ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    🚀 Salva e Sincronizza Orari Negozio su Google & Canali
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDITA & SPEDIZIONI */}
      {activeTab === "vendita" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Soglia Spedizione Gratuita (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.sogliaSpedizioneGratis}
                  onChange={(e) => setForm({ ...form, sogliaSpedizioneGratis: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">€</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ordini e spedizioni superiori a questo importo ottengono spedizione gratuita.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Costo Spedizione Standard (€)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.costoSpedizioneStandard}
                  onChange={(e) => setForm({ ...form, costoSpedizioneStandard: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">€</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tariffa forfettaria applicata per consegne con corriere espresso.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  Ritiro Gratuito in Sede (Click & Collect)
                </p>
                <p className="text-xs text-slate-500">
                  Consenti al cliente di concordare il ritiro direttamente al banco per articoli visti in vetrina o bloccati su WhatsApp/marketplace.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.ritiroInSede}
                onChange={(e) => setForm({ ...form, ritiroInSede: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  Sincronizzazione Automatica Scorte con Canali Esterni
                </p>
                <p className="text-xs text-slate-500">
                  Scala automaticamente le giacenze sui marketplace integrati (Subito, Vinted, eBay) ogni volta che uno scontrino o ordine viene saldato.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.sincronizzazioneScorte}
                onChange={(e) => setForm({ ...form, sincronizzazioneScorte: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  Notifica Automatica Giacenze in Esaurimento
                </p>
                <p className="text-xs text-slate-500">
                  Ricevi un avviso istantaneo quando un articolo scende sotto le 3 unità disponibili.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.notificaScorteBassecritiche}
                onChange={(e) => setForm({ ...form, notificaScorteBassecritiche: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Condizioni di Vendita & Reso (Issue #11) */}
          <div className="pt-2 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Politica di Reso &amp; Diritto di Recesso
            </label>
            <p className="text-[11px] text-slate-500">
              Testo legale e informativo visibile ai clienti sulle schede prodotto della vetrina e nelle conferme d&apos;ordine.
            </p>
            <textarea
              rows={3}
              value={form.politicaReso}
              onChange={(e) => setForm({ ...form, politicaReso: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="Es. Reso garantito entro 14 giorni lavorativi..."
            />
          </div>
        </div>
      )}

      {/* TAB 3: DOMINIO & SSL */}
      {activeTab === "dominio" && (
        <div className="p-6 bg-gradient-to-br from-emerald-50/60 to-slate-50 rounded-2xl border border-emerald-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Vetrina Online & Dominio Personalizzato
                </h3>
                <p className="text-xs text-slate-500">
                  Indirizzo pubblico del negozio con certificato SSL Let's Encrypt automatico.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SSL Attivo & Sicuro
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Indirizzo Vetrina Ufficiale
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 truncate">
                  https://{displayDomain}
                </span>
                <a
                  href={`https://${displayDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                  title="Apri vetrina in una nuova scheda"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Puntamenti DNS Server
              </span>
              <p className="font-mono text-xs text-slate-700">
                IP VPS: <strong className="text-emerald-700">80.211.130.61</strong> (Record A @)
              </p>
              <p className="text-[10px] text-slate-400">
                Gestibile e modificabile dal <strong>Portale Taaaac</strong> (taaaac.eu/portal).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL & NOTIFICHE */}
      {activeTab === "email" && (
        <div className="space-y-4">
          <EmailSettingsCard />
        </div>
      )}

      {/* TAB: DISPOSITIVI PWA & BIOMETRIA */}
      {activeTab === "dispositivi" && (
        <div className="space-y-4">
          <RegisteredDevicesCard />
        </div>
      )}

      {/* TAB 5: ASPETTO & BRAND (LIVE SHOWCASE VISUAL STUDIO) */}
      {activeTab === "aspetto" && (
        <ShowcaseVisualStudio />
      )}
        </main>
      </div>
    </div>
  );
}
