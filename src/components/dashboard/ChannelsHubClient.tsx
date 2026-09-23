"use client";

import React, { useState } from "react";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Package,
  DollarSign,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Rss,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CHANNEL_FEES } from "@/lib/channel-manager";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  markListingAsSold,
  deleteChannelListing,
} from "@/lib/store-actions";

interface ChannelStat {
  channel: "SUBITO" | "VINTED" | "EBAY" | "FACEBOOK";
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalRevenue: number;
  lastActivity: string | null;
}

interface ListingItem {
  id: string;
  productId: string;
  channel: string;
  status: string;
  externalUrl?: string | null;
  externalId?: string | null;
  listedPrice: number;
  notes?: string | null;
  publishedAt?: string | null;
  soldAt?: string | null;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    sku?: string | null;
    price: number;
    images: string;
  } | null;
}

interface ChannelsHubClientProps {
  initialStats: ChannelStat[];
  initialListings: ListingItem[];
}

export default function ChannelsHubClient({
  initialStats,
  initialListings,
}: ChannelsHubClientProps) {
  const [stats, setStats] = useState<ChannelStat[]>(initialStats);
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<string | null>("subito");
  const [selectedFilterChannel, setSelectedFilterChannel] = useState<string>("ALL");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const copyToClipboard = (text: string, feedName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFeed(feedName);
    setTimeout(() => setCopiedFeed(null), 2000);
  };

  const handleMarkSold = async (listingId: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "SOLD", soldAt: new Date().toISOString() } : l))
    );
    showFeedback("Annuncio segnato come venduto: stock scalato su Vendoly!");
    await markListingAsSold(listingId);
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Rimuovere questo annuncio dal tracciamento?")) return;
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    showFeedback("Annuncio rimosso dal tracciamento");
    await deleteChannelListing(listingId);
  };

  const filteredListings = listings.filter(
    (l) => selectedFilterChannel === "ALL" || l.channel === selectedFilterChannel
  );

  // URL dei Feed automatici
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://vendoly.taaaac.eu";
  const facebookFeedUrl = `${baseUrl}/api/feeds/facebook`;
  const subitoFeedUrl = `${baseUrl}/api/feeds/subito`;
  const ebayFeedUrl = `${baseUrl}/api/feeds/ebay`;

  return (
    <div className="space-y-8 font-sans text-slate-800">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-emerald-600" />
            Hub Canali & Marketplace Multi-Listing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci in un unico punto la pubblicazione su Subito.it, Vinted, eBay e Facebook Marketplace con protezione Anti-Doppia Vendita.
          </p>
        </div>
      </div>

      {/* Banner Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 2. Panoramica Canali Collegati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SUBITO */}
        <div className="taaaac-card p-5 border-t-4 border-t-amber-500 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Subito.it</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              TuttoSubito
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Compravendita locale e spedizione protetta in tutta Italia.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Annunci Attivi:</span>
            <span className="font-black text-amber-700 text-sm">
              {stats.find((s) => s.channel === "SUBITO")?.activeListings || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Commissione: <b>~3%</b></span>
            <a
              href="https://www.subito.it/inserisci/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Inserisci</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* VINTED */}
        <div className="taaaac-card p-5 border-t-4 border-t-cyan-500 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Vinted</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              0% Fee
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Marketplace leader per abbigliamento, scarpe e second-hand.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Annunci Attivi:</span>
            <span className="font-black text-cyan-700 text-sm">
              {stats.find((s) => s.channel === "VINTED")?.activeListings || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Commissione: <b className="text-emerald-600">Gratis</b></span>
            <a
              href="https://www.vinted.it/items/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Carica</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* EBAY */}
        <div className="taaaac-card p-5 border-t-4 border-t-blue-600 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">eBay Italia</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              API Ready
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Vendite professionali con corriere e garanzia cliente eBay.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Annunci Attivi:</span>
            <span className="font-black text-blue-700 text-sm">
              {stats.find((s) => s.channel === "EBAY")?.activeListings || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Commissione: <b>~13%</b></span>
            <a
              href="https://www.ebay.it/sl/sell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Vendi</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* FACEBOOK */}
        <div className="taaaac-card p-5 border-t-4 border-t-indigo-600 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Facebook / Meta</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              XML Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Visibilità sui gruppi locali e sincronizzazione automatica catalogo.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Annunci Attivi:</span>
            <span className="font-black text-indigo-700 text-sm">
              {stats.find((s) => s.channel === "FACEBOOK")?.activeListings || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Commissione: <b className="text-emerald-600">Gratis</b></span>
            <a
              href="https://www.facebook.com/marketplace/create/item"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Crea</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Feed Automatici di Sincronizzazione Catalogo */}
      <div className="taaaac-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white space-y-4">
        <div className="flex items-center gap-2">
          <Rss className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            Feed Automatici di Pubblicazione & Sincronizzazione Massiva
          </h2>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Invece di copiare e incollare a mano decine di articoli, usa i feed XML/JSON di Vendoly. Inserisci questi link nel tuo Meta Commerce Manager o nel pannello Subito Impresa+: le piattaforme scaricheranno automaticamente il tuo inventario mantenendolo aggiornato.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Feed Facebook */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">Meta Commerce XML</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Attivo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate" title={facebookFeedUrl}>
              {facebookFeedUrl}
            </p>
            <button
              onClick={() => copyToClipboard(facebookFeedUrl, "fb")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedFeed === "fb" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFeed === "fb" ? "Copiato!" : "Copia Link Feed"}</span>
            </button>
          </div>

          {/* Feed Subito */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Subito Impresa+ XML</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Attivo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate" title={subitoFeedUrl}>
              {subitoFeedUrl}
            </p>
            <button
              onClick={() => copyToClipboard(subitoFeedUrl, "subito")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedFeed === "subito" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFeed === "subito" ? "Copiato!" : "Copia Link Feed"}</span>
            </button>
          </div>

          {/* Feed eBay */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">eBay Inventory JSON</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                REST Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate" title={ebayFeedUrl}>
              {ebayFeedUrl}
            </p>
            <button
              onClick={() => copyToClipboard(ebayFeedUrl, "ebay")}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedFeed === "ebay" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFeed === "ebay" ? "Copiato!" : "Copia Link Feed"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Guide Passo-Passo per Marketplace */}
      <div className="taaaac-card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          Guide Passo-Passo per Pubblicare con Successo
        </h2>

        {/* Selettore Canale Guida */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: "subito", label: "Subito.it", color: "amber" },
            { id: "vinted", label: "Vinted", color: "cyan" },
            { id: "ebay", label: "eBay", color: "blue" },
            { id: "facebook", label: "Facebook Marketplace", color: "indigo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveGuide(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeGuide === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenuto Guida Subito */}
        {activeGuide === "subito" && (
          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h4 className="font-bold text-amber-900 text-sm">Strategia Subito.it (Ideale per vendite locali & TuttoSubito)</h4>
              <p>Subito è il primo portale italiano per annunci: perfetto sia per ritiri al banco in negozio che per spedizioni rapide.</p>
            </div>
            <ol className="space-y-2.5 list-decimal pl-4">
              <li><b>Usa il Quick Lister di Vendoly</b>: genera automaticamente titolo con codice SKU e specifica le condizioni e il prezzo non trattabile.</li>
              <li><b>Spedizione TuttoSubito</b>: offri sempre la spedizione protetta per aumentare i contatti anche da fuori regione.</li>
              <li><b>Ritiro al banco</b>: specifica che il cliente può passare in negozio a visionare il capo senza impegno prima dell&apos;acquisto.</li>
              <li><b>Registra il link</b>: una volta pubblicato l&apos;annuncio, incolla l&apos;URL su Vendoly per tracciarlo e chiuderlo con 1 clic quando venduto.</li>
            </ol>
          </div>
        )}

        {/* Contenuto Guida Vinted */}
        {activeGuide === "vinted" && (
          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-2">
              <h4 className="font-bold text-cyan-900 text-sm">Strategia Vinted (0% Commissioni per il venditore)</h4>
              <p>Vinted è la piattaforma moda per eccellenza: il compratore paga la protezione acquisti e la spedizione, tu ricevi il 100% dell&apos;incasso netto.</p>
            </div>
            <ol className="space-y-2.5 list-decimal pl-4">
              <li><b>Compila Brand e Taglia su Vendoly</b>: Vinted richiede obbligatoriamente marca e taglia per posizionare l&apos;annuncio nei filtri di ricerca.</li>
              <li><b>Foto Reali su Sfondo Pulito</b>: inserisci almeno 3-5 foto dettagliate (dettaglio etichetta interna, fondo suola o finiture).</li>
              <li><b>Sconti sui Set</b>: incoraggia i clienti a scegliere più capi dal tuo catalogo offrendo sconti bundle dal 10% al 20%.</li>
              <li><b>Punti di Ritiro Locker</b>: spedisci entro 48 ore tramite InPost o Fermopoint per mantenere il badge venditore a 5 stelle.</li>
            </ol>
          </div>
        )}

        {/* Contenuto Guida eBay */}
        {activeGuide === "ebay" && (
          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <h4 className="font-bold text-blue-900 text-sm">Strategia eBay (Copertura globale e garanzia professionale)</h4>
              <p>Adatto per pezzi di valore, elettronica e articoli rari. Vendoly aggiunge in automatico un buffer del +5% per compensare le commissioni.</p>
            </div>
            <ol className="space-y-2.5 list-decimal pl-4">
              <li><b>Titolo ottimizzato (max 80 caratteri)</b>: Vendoly crea titoli completi di Brand, Modello, Taglia e SKU per i motori di ricerca eBay.</li>
              <li><b>Politiche Reso Trasparenti</b>: garantisci 14 giorni di reso secondo normativa europea per ottenere maggiore visibilità organica.</li>
              <li><b>Corriere Tracciabile</b>: inserisci il codice di tracking GLS / BRT / DHL su Vendoly non appena spedisci per aggiornare lo status ordine.</li>
            </ol>
          </div>
        )}

        {/* Contenuto Guida Facebook */}
        {activeGuide === "facebook" && (
          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
              <h4 className="font-bold text-indigo-900 text-sm">Strategia Facebook & Instagram (Massimo impatto locale)</h4>
              <p>Facebook Marketplace unisce social commerce e annunci di vicinato per portare clienti direttamente nel tuo punto vendita.</p>
            </div>
            <ol className="space-y-2.5 list-decimal pl-4">
              <li><b>Usa il Data Feed automatico</b>: collega l&apos;URL del catalogo XML di Vendoly a Meta Commerce Manager per sincronizzare tutti i prodotti in blocco.</li>
              <li><b>Hashtag mirati</b>: i template di Vendoly generano hashtag specifici per categoria e quartiere per farti trovare nelle ricerche social.</li>
              <li><b>Conversione rapida su WhatsApp</b>: invia il link del tuo catalogo Vendoly nelle chat di Messenger per far completare l&apos;ordine al cliente.</li>
            </ol>
          </div>
        )}
      </div>

      {/* 5. Registro Annunci Pubblicati & Tracciamento Attivo */}
      <div className="taaaac-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Registro Inserzioni Marketplace Tracciate ({listings.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tutti gli annunci pubblicati e monitorati. Clicca su &quot;Segna Venduto&quot; per scalare la giacenza ed evitare doppie vendite.
            </p>
          </div>

          {/* Filtro per Canale */}
          <select
            value={selectedFilterChannel}
            onChange={(e) => setSelectedFilterChannel(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tutti i canali</option>
            <option value="SUBITO">Solo Subito.it</option>
            <option value="VINTED">Solo Vinted</option>
            <option value="EBAY">Solo eBay</option>
            <option value="FACEBOOK">Solo Facebook</option>
          </select>
        </div>

        {filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Articolo</th>
                  <th className="p-3">Canale</th>
                  <th className="p-3">Prezzo</th>
                  <th className="p-3">Stato</th>
                  <th className="p-3">Link Esterno</th>
                  <th className="p-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                      {item.product?.title || `Prodotto #${item.productId.slice(-6)}`}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.channel}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatCurrency(item.listedPrice)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "SOLD"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status === "ACTIVE" ? "ATTIVO" : item.status === "SOLD" ? "VENDUTO" : item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.externalUrl ? (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Vedi annuncio</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Nessun URL salvato</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "ACTIVE" && (
                          <button
                            onClick={() => handleMarkSold(item.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Segna come venduto e scala giacenza"
                          >
                            Venduto
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Rimuovi tracciamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Nessuna inserzione registrata per questo filtro</p>
            <p className="text-[11px] text-slate-400">
              Quando pubblichi un articolo con il Quick Lister, incolla il link dell&apos;annuncio per vederlo apparire qui in tempo reale.
            </p>
          </div>
        )}
      </div>

      {/* 6. Tabella di Confronto Commissioni & Regole Anti-Doppia Vendita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tabella Commissioni */}
        <div className="taaaac-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Riepilogo Costi & Commissioni per Canale
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span><b>Subito.it (TuttoSubito)</b></span>
              <span className="font-semibold text-amber-700">~3% del valore</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span><b>Vinted</b></span>
              <span className="font-bold text-emerald-600">0% (gratis per te)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span><b>eBay</b></span>
              <span className="font-semibold text-blue-700">~13% + €0,35 fisso</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span><b>Facebook Marketplace</b></span>
              <span className="font-bold text-emerald-600">0% (gratis)</span>
            </div>
          </div>
        </div>

        {/* Anti-Doppia Vendita */}
        <div className="taaaac-card p-5 space-y-3 bg-emerald-50/50 border-emerald-200">
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Come Funziona l&apos;Anti-Doppia Vendita
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se possiedi un <b>pezzo unico (giacenza = 1)</b> e lo vendi al banco cassa o su Vinted, Vendoly:
          </p>
          <ul className="text-xs space-y-1.5 text-slate-700 list-disc pl-4">
            <li>Azzera la giacenza interna del magazzino a 0 pz.</li>
            <li>Disattiva istantaneamente i flag di sincronizzazione Subito, eBay e Facebook.</li>
            <li>Rimuove l&apos;articolo dal feed XML di Meta Catalog.</li>
            <li>Aggiorna lo stato in &quot;Esaurito / Venduto&quot; su tutti i report.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
