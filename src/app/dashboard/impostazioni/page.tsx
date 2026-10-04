"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Store,
  Truck,
  Globe,
  Mail,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Share2,
} from "lucide-react";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import RegisteredDevicesCard from "@/components/dashboard/RegisteredDevicesCard";

type SettingsTab = "negozio" | "vendita" | "dominio" | "email" | "dispositivi" | "aspetto";

interface TabItem {
  id: SettingsTab;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "negozio",
    label: "Negozio & Vetrina",
    shortLabel: "Negozio",
    icon: "🏪",
    description: "Ragione sociale, P.IVA, sede operativa, contatti e dati punto cassa",
  },
  {
    id: "vendita",
    label: "Vendita & Spedizioni",
    shortLabel: "Vendita",
    icon: "📦",
    description: "Soglie spedizione gratuita, costi corriere e sincronizzazione automatica scorte",
  },
  {
    id: "dominio",
    label: "Dominio & SSL",
    shortLabel: "Dominio",
    icon: "🌐",
    description: "Indirizzo vetrina pubblica, certificato Let's Encrypt e puntamenti DNS",
  },
  {
    id: "email",
    label: "Email & Notifiche",
    shortLabel: "Email",
    icon: "📧",
    description: "Canale email Taaaac Mail Engine e notifiche di conferma ordine al cliente",
  },
  {
    id: "dispositivi",
    label: "Dispositivi PWA",
    shortLabel: "Dispositivi",
    icon: "📱",
    description: "Accesso rapido biometrico (FaceID, TouchID, PIN) e revoca smartphone da remoto",
  },
  {
    id: "aspetto",
    label: "Aspetto & Brand",
    shortLabel: "Aspetto",
    icon: "🎨",
    description: "Personalizzazione tema punto cassa POS, colori vetrina e logo del brand",
  },
];

export default function VendolyImpostazioniPage() {
  const { config } = useTenantConfig();
  const [activeTab, setActiveTab] = useState<SettingsTab>("negozio");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  useEffect(() => {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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

      {/* SOTTOMENU / TABS BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 shadow-xs">
        <nav
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
          aria-label="Impostazioni Vendoly"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Intestazione Sottomenu Corrente */}
      {currentTab && (
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{currentTab.icon}</span>
              <span>{currentTab.label}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentTab.description}</p>
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
                Ordini con carrello superiore a questa cifra ottengono spedizione a costo zero.
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
                  Consenti al cliente di completare l'ordine online e ritirare direttamente in negozio.
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

      {/* TAB 5: ASPETTO & BRAND */}
      {activeTab === "aspetto" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span>🎨</span> Colori Negozio & Cassa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Colore Accento / Brand Primario
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.colorePrimario}
                    onChange={(e) => setForm({ ...form, colorePrimario: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-600 font-bold uppercase">
                    {form.colorePrimario}
                  </span>
                  <span className="text-[11px] text-slate-400">(Emerald Retail Vendoly)</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Icona Default Punto Cassa
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    🏪
                  </div>
                  <div className="text-xs text-slate-500">
                    Icona di sistema usata come fallback in assenza di logo caricato.
                  </div>
                </div>
              </div>
            </div>

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

          {/* Brand & Identità Visiva (Logo & Favicon) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>✨</span> Brand & Identità Visiva (Logo & Favicon)
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Novità v1.0.2
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LOGO */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🖼️</span> Logo Negozio / Boutique
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visibile nella barra di navigazione del catalogo pubblico e comunicazioni.
                    </p>
                  </div>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: "" })}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition border border-rose-200 cursor-pointer"
                    >
                      Rimuovi Logo
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageProcessing("logo");
                      processImageFile(file, 512, "image/webp", (dataUrl) => {
                        setForm((f) => ({ ...f, logoUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActiveLogo(true);
                  }}
                  onDragLeave={() => setDragActiveLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveLogo(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImageProcessing("logo");
                      processImageFile(file, 512, "image/webp", (dataUrl) => {
                        setForm((f) => ({ ...f, logoUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragActiveLogo
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📁</span>
                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-emerald-600 font-bold underline">Clicca per caricare</span> o trascina qui il file
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PNG, SVG, JPG o WebP (ottimizzato automaticamente a max 512px WebP)
                    </p>
                    {imageProcessing === "logo" && (
                      <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                        Elaborazione immagine in corso...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Oppure inserisci URL Logo
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="https://tuosito.it/logo.png"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  />
                </div>

                {/* Anteprima Live Header */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Anteprima Navbar Vetrina</span>
                    <span className="text-[10px] text-slate-400 font-normal">Live Preview</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {form.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={form.logoUrl}
                            alt="Logo"
                            className="h-8 max-w-[140px] object-contain rounded"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-[10px] text-white">🏪</span>
                            <span className="truncate">{form.nomeAttivita}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 hidden sm:inline">Catalogo</span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">Canali</span>
                        <span
                          style={{ backgroundColor: form.colorePrimario }}
                          className="text-[10px] text-white font-bold px-2.5 py-1 rounded-full shadow-xs"
                        >
                          WhatsApp
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAVICON */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🌐</span> Favicon & Icona Browser
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Icona visibile nella scheda del browser, nei preferiti e nella barra indirizzi.
                    </p>
                  </div>
                  {form.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, faviconUrl: "" })}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition border border-rose-200 cursor-pointer"
                    >
                      Rimuovi Favicon
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={faviconInputRef}
                  accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageProcessing("favicon");
                      processImageFile(file, 128, "image/png", (dataUrl) => {
                        setForm((f) => ({ ...f, faviconUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActiveFavicon(true);
                  }}
                  onDragLeave={() => setDragActiveFavicon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveFavicon(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImageProcessing("favicon");
                      processImageFile(file, 128, "image/png", (dataUrl) => {
                        setForm((f) => ({ ...f, faviconUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                  onClick={() => faviconInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragActiveFavicon
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30"
                      : "border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔖</span>
                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-emerald-600 font-bold underline">Carica icona</span> o trascina qui
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PNG, ICO o SVG quadrata (ottimizzata automaticamente a 128x128 PNG)
                    </p>
                    {imageProcessing === "favicon" && (
                      <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                        Elaborazione icona in corso...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Oppure inserisci URL Favicon
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="https://tuosito.it/favicon.png"
                    value={form.faviconUrl}
                    onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                  />
                </div>

                {/* Anteprima Live Browser Tab */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Anteprima Scheda Browser</span>
                    <span className="text-[10px] text-slate-400 font-normal">Live Preview</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5">
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-t-lg border border-slate-200 shadow-2xs max-w-full">
                      {form.faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.faviconUrl}
                          alt="Favicon"
                          className="w-4 h-4 object-contain rounded-xs"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                      ) : (
                        <span className="text-xs">🏪</span>
                      )}
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                        {form.nomeAttivita} - Cassa POS
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">✕</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
