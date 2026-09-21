"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Store,
  Truck,
  MapPin,
  MessageCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Tag,
  ArrowRight,
  Package,
  Sparkles,
  Info,
  Lock,
  Globe,
  Layers,
  ArrowUpRight,
  Phone,
  Clock,
  Check,
} from "lucide-react";
import { MockProduct } from "@/lib/mock-store";
import { TenantConfigResponse } from "@/types/taaaac";
import { formatCurrency } from "@/lib/utils";

interface StorefrontProps {
  initialProducts: MockProduct[];
  tenantConfig: TenantConfigResponse;
}

type ChannelFilter = "ALL" | "SUBITO" | "VINTED" | "EBAY" | "FACEBOOK" | "NEGOZIO";

export default function Storefront({ initialProducts, tenantConfig }: StorefrontProps) {
  const [products] = useState<MockProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilter>("ALL");

  // Scheda Dettaglio Prodotto (Modal)
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Estrazione categorie uniche
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Conteggio presenze sui canali marketplace
  const channelStats = useMemo(() => {
    let subito = 0;
    let vinted = 0;
    let ebay = 0;
    let facebook = 0;
    let negozio = 0;

    products.forEach((p) => {
      if (p.syncSubito) subito++;
      if (p.syncVinted) vinted++;
      if (p.syncEbay) ebay++;
      if (p.syncFacebook) facebook++;
      if (p.stock > 0) negozio++;
    });

    return { subito, vinted, ebay, facebook, negozio, total: products.length };
  }, [products]);

  // Filtraggio catalogo per ricerca, categoria e canale marketplace
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filtro categoria
      const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;

      // Filtro ricerca testuale
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        query === "" ||
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      // Filtro canale marketplace
      let matchChannel = true;
      if (selectedChannel === "SUBITO") matchChannel = p.syncSubito;
      else if (selectedChannel === "VINTED") matchChannel = p.syncVinted;
      else if (selectedChannel === "EBAY") matchChannel = p.syncEbay;
      else if (selectedChannel === "FACEBOOK") matchChannel = p.syncFacebook;
      else if (selectedChannel === "NEGOZIO") matchChannel = p.stock > 0;

      return matchCat && matchSearch && matchChannel;
    });
  }, [products, selectedCategory, searchQuery, selectedChannel]);

  // Helper parsing immagini
  const getProductImages = (product: MockProduct): string[] => {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
    return ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];
  };

  // Generatore link per WhatsApp (Blocco / Informazioni rapido)
  const getWhatsAppInquiryUrl = (product: MockProduct) => {
    const rawPhone = tenantConfig.contact?.phone?.replace(/\D/g, "") || "390289015678";
    const condition = getConditionText(product.condition);
    const message = `👋 Ciao ${tenantConfig.theme.brandName}!
Ho visto sul vostro collettore online l'articolo:

🏷️ *${product.title}*
🔖 SKU: ${product.sku || product.id}
💰 Prezzo: € ${product.price.toFixed(2)}
📌 Condizione: ${condition}

Vorrei avere maggiori informazioni sulla disponibilità e sulle caratteristiche. Grazie!`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  // URL per i vari marketplace (ricerca mirata per titolo o annuncio)
  const getMarketplaceSearchUrl = (channel: "SUBITO" | "VINTED" | "EBAY" | "FACEBOOK", product: MockProduct) => {
    const q = encodeURIComponent(product.title);
    switch (channel) {
      case "SUBITO":
        return `https://www.subito.it/annunci-italia/vendita/usato/?q=${q}`;
      case "VINTED":
        return `https://www.vinted.it/catalog?search_text=${q}`;
      case "EBAY":
        return `https://www.ebay.it/sch/i.html?_nkw=${q}`;
      case "FACEBOOK":
        return `https://www.facebook.com/marketplace/search/?query=${q}`;
    }
  };

  function getConditionText(cond: string) {
    switch (cond) {
      case "NUOVO":
        return "Nuovo con etichetta";
      case "USATO_COME_NUOVO":
        return "Come nuovo / Impeccabile";
      case "OTTIME_CONDIZIONI":
        return "Ottime condizioni";
      case "BUONE_CONDIZIONI":
        return "Buone condizioni vintage";
      default:
        return "Selezionato & Garantito";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Collettore Ufficiale Vendite: Pezzi Unici sincronizzati su Subito, Vinted, eBay e Negozio Fisico
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>Assistenza & WhatsApp: {tenantConfig.contact?.phone || "+39 02 8901 5678"}</span>
          </div>
        </div>
      </div>

      {/* 2. Header Principale Collettore */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Store className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  {tenantConfig.theme.brandName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Globe className="w-3 h-3" />
                  Hub Multi-Marketplace
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                Vetrina Collettore & Disponibilità Live • Powered by Taaaac
              </span>
            </div>
          </div>

          {/* Azione Contatto Rapido */}
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${tenantConfig.contact?.phone?.replace(/\D/g, "") || "390289015678"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">Contatta il Negozio</span>
              <span className="md:hidden">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. Hero Collettore & Filosofia Hub */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Rischio Doppia Vendita • Sincronizzazione Cross-Canale</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Catalogo Unificato & Vetrina Multi-Marketplace
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Tutti i capi, le calzature e i pezzi selezionati del punto vendita{" "}
                <strong className="text-slate-800">{tenantConfig.theme.brandName}</strong>,
                sincronizzati istantaneamente con le migliori piattaforme di compravendita.
                Scegli se acquistare con la protezione del tuo marketplace preferito oppure chiedere
                maggiori informazioni direttamente a noi via WhatsApp.
              </p>

              {/* Garanzie e Vantaggi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Protezione Acquisti</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Spedizione 24/48h</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ritiro in Sede</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pezzi Autentici</span>
                </div>
              </div>
            </div>

            {/* Box Canali Attivi */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Presidio Canali di Vendita
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {channelStats.total} Articoli Registrati
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setSelectedChannel(selectedChannel === "SUBITO" ? "ALL" : "SUBITO")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedChannel === "SUBITO"
                        ? "border-amber-500 bg-amber-50/50 shadow-2xs ring-1 ring-amber-500"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-700">Subito.it</span>
                      <span className="text-[11px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-800">
                        {channelStats.subito}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">TuttoSubito & Ritiro a mano</p>
                  </button>

                  <button
                    onClick={() => setSelectedChannel(selectedChannel === "VINTED" ? "ALL" : "VINTED")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedChannel === "VINTED"
                        ? "border-cyan-500 bg-cyan-50/50 shadow-2xs ring-1 ring-cyan-500"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-cyan-700">Vinted</span>
                      <span className="text-[11px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-cyan-200 text-cyan-800">
                        {channelStats.vinted}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Protezione & Lockers</p>
                  </button>

                  <button
                    onClick={() => setSelectedChannel(selectedChannel === "EBAY" ? "ALL" : "EBAY")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedChannel === "EBAY"
                        ? "border-blue-500 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-700">eBay</span>
                      <span className="text-[11px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-800">
                        {channelStats.ebay}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Garanzia Cliente eBay</p>
                  </button>

                  <button
                    onClick={() => setSelectedChannel(selectedChannel === "FACEBOOK" ? "ALL" : "FACEBOOK")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedChannel === "FACEBOOK"
                        ? "border-indigo-500 bg-indigo-50/50 shadow-2xs ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-700">Facebook</span>
                      <span className="text-[11px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800">
                        {channelStats.facebook}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Marketplace locale</p>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-100/80 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>🏪 Disponibili per ritiro immediato in negozio:</span>
                  <strong className="font-mono text-slate-900">{channelStats.negozio} articoli</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Barra di Ricerca & Filtri Canale / Categoria */}
      <div className="bg-white border-b border-slate-200/90 sticky top-[69px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Input di Ricerca */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca per nome, SKU o caratteristiche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100/90 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtri Canali Marketplace (Pills) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1 hidden sm:inline">Canale:</span>
              <button
                onClick={() => setSelectedChannel("ALL")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tutti i Canali ({products.length})
              </button>
              <button
                onClick={() => setSelectedChannel("SUBITO")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "SUBITO"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100"
                }`}
              >
                Subito.it ({channelStats.subito})
              </button>
              <button
                onClick={() => setSelectedChannel("VINTED")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "VINTED"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-cyan-50 text-cyan-800 border border-cyan-200/80 hover:bg-cyan-100"
                }`}
              >
                Vinted ({channelStats.vinted})
              </button>
              <button
                onClick={() => setSelectedChannel("EBAY")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "EBAY"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100"
                }`}
              >
                eBay ({channelStats.ebay})
              </button>
              <button
                onClick={() => setSelectedChannel("FACEBOOK")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "FACEBOOK"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-indigo-50 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100"
                }`}
              >
                Facebook ({channelStats.facebook})
              </button>
            </div>
          </div>

          {/* Filtri Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-slate-100 pt-2.5">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Categoria:</span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutte
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Griglia Articoli Collettore */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Articoli Disponibili
              {selectedChannel !== "ALL" && (
                <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Filtro: {selectedChannel}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {filteredProducts.length} pezzi trovati nel catalogo multi-canale
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="taaaac-card text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nessun articolo trovato</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nessun articolo corrisponde ai filtri selezionati. Prova a reimpostare la ricerca o a selezionare un altro canale.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedChannel("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Azzera Tutti i Filtri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const images = getProductImages(product);
              const mainImage = images[0];
              const isLowStock = product.stock === 1;

              return (
                <div
                  key={product.id}
                  className="group taaaac-card p-0 overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all"
                >
                  {/* Immagine con badge sovrapposti */}
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={mainImage}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Badge Condizione */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200/80 shadow-2xs">
                        {getConditionText(product.condition)}
                      </span>
                    </div>

                    {/* Badge Riservato / Pezzo Unico / Scorta */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                      {product.isReserved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          In Trattativa
                        </span>
                      )}
                      {isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-2xs">
                          Pezzo Unico
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white shadow-2xs">
                          {product.stock} disp.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dettagli Articolo */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-medium text-slate-400">{product.category}</span>
                      {product.sku && (
                        <span className="font-mono text-[10px] text-slate-400">SKU: {product.sku}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.title}
                    </h3>

                    {/* Prezzo */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>

                    {/* Presenza Marketplace (Badge Canali Attivi) */}
                    <div className="pt-2 border-t border-slate-100 mt-auto mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Disponibile su:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {product.syncSubito && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70">
                            Subito
                          </span>
                        )}
                        {product.syncVinted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200/70">
                            Vinted
                          </span>
                        )}
                        {product.syncEbay && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/70">
                            eBay
                          </span>
                        )}
                        {product.syncFacebook && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                            Facebook
                          </span>
                        )}
                        {product.stock > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                            In Negozio
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottoni Azione (Zero Carrello: Dettagli / Marketplace o WhatsApp) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setActiveImageIndex(0);
                        }}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Dettagli</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={getWhatsAppInquiryUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center"
                        title="Chiedi informazioni su WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Chiedi Info</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Modale Scheda Dettaglio Articolo & Hub Acquisto Multi-Canale */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Header Modale */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Scheda Articolo Collettore
                </span>
                {selectedProduct.sku && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                    {selectedProduct.sku}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Galleria Immagini */}
                <div className="space-y-2">
                  <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80">
                    <img
                      src={getProductImages(selectedProduct)[activeImageIndex] || getProductImages(selectedProduct)[0]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {getProductImages(selectedProduct).length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {getProductImages(selectedProduct).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? "border-emerald-500 shadow-xs"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Prodotto */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      {getConditionText(selectedProduct.condition)}
                    </span>
                    <span className="text-xs text-slate-500">{selectedProduct.category}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {selectedProduct.title}
                  </h3>

                  <div className="flex items-baseline gap-2 py-1">
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(selectedProduct.price)}
                    </span>
                    {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(selectedProduct.comparePrice)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedProduct.description}
                  </p>

                  {selectedProduct.isReserved && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong className="block">In Trattativa con un cliente</strong>
                        <span className="text-[11px] text-amber-800">
                          {selectedProduct.reservedNote || "Un cliente ha richiesto informazioni su questo articolo. Puoi comunque contattarci per verificare la disponibilità."}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>Disponibilità fisica:</span>
                      <strong className="text-slate-800">
                        {selectedProduct.stock === 1 ? "Pezzo Unico Rimasto" : `${selectedProduct.stock} unità`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Stato sincronizzazione:</span>
                      <strong className="text-emerald-700 font-semibold">Attivo in tempo reale</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE HUB CANALI & ACQUISTO */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Scegli Dove Acquistare Questo Articolo
                  </h4>
                  <span className="text-[11px] text-slate-500">Transazione protetta</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opzione Subito.it */}
                  {selectedProduct.syncSubito && (
                    <a
                      href={getMarketplaceSearchUrl("SUBITO", selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-800">Acquista su Subito.it</span>
                        <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Protezione TuttoSubito con spedizione rapida tracciata o ritiro a mano
                      </p>
                    </a>
                  )}

                  {/* Opzione Vinted */}
                  {selectedProduct.syncVinted && (
                    <a
                      href={getMarketplaceSearchUrl("VINTED", selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl border border-cyan-200 bg-cyan-50/40 hover:bg-cyan-50 hover:border-cyan-400 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-cyan-800">Acquista su Vinted</span>
                        <ArrowUpRight className="w-4 h-4 text-cyan-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Protezione Acquisti Vinted con spedizione InPost, BRT o Fermopoint
                      </p>
                    </a>
                  )}

                  {/* Opzione eBay */}
                  {selectedProduct.syncEbay && (
                    <a
                      href={getMarketplaceSearchUrl("EBAY", selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-blue-800">Acquista su eBay</span>
                        <ArrowUpRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Garanzia Cliente eBay con pagamento sicuro PayPal o Carta
                      </p>
                    </a>
                  )}

                  {/* Opzione Facebook Marketplace */}
                  {selectedProduct.syncFacebook && (
                    <a
                      href={getMarketplaceSearchUrl("FACEBOOK", selectedProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-indigo-800">Facebook Marketplace</span>
                        <ArrowUpRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Visualizza l'inserzione e contatta direttamente su Messenger
                      </p>
                    </a>
                  )}
                </div>

                {/* Opzione WhatsApp Diretto / Chiedi Informazioni */}
                <div className="mt-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="text-xs font-bold text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Vuoi maggiori dettagli su questo articolo?
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Scrivici direttamente su WhatsApp per foto aggiuntive, misure o disponibilità
                    </p>
                  </div>

                  <a
                    href={getWhatsAppInquiryUrl(selectedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Chiedi Informazioni</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer con Link Discreto Commerciante */}
      <footer className="bg-white border-t border-slate-200/90 py-8 px-4 sm:px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">
              {tenantConfig.theme.brandName}
            </span>
            <span>• Collettore Vendite & Hub Multi-Marketplace Vendoly</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <p>© {new Date().getFullYear()} Taaaac Modular Ecosystem. Tutti i diritti riservati.</p>
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Area Riservata Esercente</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
