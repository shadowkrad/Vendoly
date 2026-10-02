"use client";

import { useState } from "react";
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
    ragioneSociale: "Vendoly Store S.r.l.",
    partitaIva: "IT09876543210",
    indirizzo: "Via del Commercio, 45 - 20121 Milano (MI)",
    telefono: "+39 02 8976543",
    emailContatto: "ordini@vendolystore.it",
    sogliaSpedizioneGratis: "50",
    costoSpedizioneStandard: "5.90",
    ritiroInSede: true,
    sincronizzazioneScorte: true,
    notificaScorteBassecritiche: true,
    colorePrimario: "#059669",
    coloreTema: "emerald",
    messaggioScontrino: "Grazie per il tuo acquisto su Vendoly! Torna a trovarci.",
  });

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setFeedback({ type: "success", text: "Impostazioni del negozio salvate con successo!" });
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
                Telefono Negozio / Supporto Ordini
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Contatto Clienti
              </label>
              <input
                type="email"
                value={form.emailContatto}
                onChange={(e) => setForm({ ...form, emailContatto: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Colore Tema Principale
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
                Icona & Logo Punto Cassa
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  🏪
                </div>
                <div className="text-xs text-slate-500">
                  Logo gestito da <span className="font-mono text-slate-700 font-bold">public/icons</span> e sincronizzato su vetrina e app PWA installata.
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
      )}
    </div>
  );
}
