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
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  Package,
  Sparkles,
  Lock,
  Globe,
  ArrowUpRight,
  Phone,
  Clock,
  Star,
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
Ho visto sul vostro catalogo online l'articolo:

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
        return "Nuovo con cartellino";
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

  const rawPhone = tenantConfig.contact?.phone?.replace(/\D/g, "") || "390289015678";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Principale Vetrina - Stile coordinato con Schedly, Barberly, Tavoly */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  {tenantConfig.theme.brandName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  <Globe className="w-3 h-3" />
                  Hub Multi-Marketplace
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                Vetrina Ufficiale &amp; Disponibilità Live • Powered by Taaaac
              </span>
            </div>
          </div>

          {/* Navigazione Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#catalogo" className="hover:text-emerald-600 transition-colors">
              Catalogo Capi
            </a>
            <a href="#canali" className="hover:text-emerald-600 transition-colors">
              I Nostri Canali
            </a>
            <a href="#info" className="hover:text-emerald-600 transition-colors">
              Negozio &amp; Orari
            </a>
          </nav>

          {/* Azione Contatto Rapido & Area Riservata */}
          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/${rawPhone}?text=${encodeURIComponent("👋 Ciao! Vorrei maggiori informazioni sui vostri capi e articoli in vetrina.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Scrivici su WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
            <Link
              href="/admin"
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Area Riservata Esercente"
            >
              <Lock className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section - Elegante, Accogliente e Coerente */}
      <section className="relative py-14 sm:py-20 overflow-hidden bg-gradient-to-b from-white via-emerald-50/25 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Colonna Testo & Claim */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Boutique &amp; Retail Store • Pezzi Unici Selezionati</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Capi Selezionati &amp; Oggetti Unici, <br className="hidden sm:inline" />
                <span className="text-emerald-600">sempre sincronizzati.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Scopri la selezione esclusiva di <strong className="text-slate-900">{tenantConfig.theme.brandName}</strong>: capi autentici, sneakers vintage e accessori ricercati. Acquistali con la protezione del tuo marketplace preferito oppure riservali direttamente in negozio via WhatsApp.
              </p>

              {/* Bottoni Call-to-Action */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <a
                  href="#catalogo"
                  className="px-7 py-3.5 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Esplora la Collezione</span>
                  <ArrowDown className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${rawPhone}?text=${encodeURIComponent("👋 Ciao! Vorrei sapere se sono disponibili nuovi arrivi in negozio.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chiedi in Negozio</span>
                </a>
              </div>

              {/* Trust Badges Orizzontali - identici al design system di Barberly, Schedly e Tavoly */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/60 max-w-2xl mx-auto lg:mx-0 text-left">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Spedizione 24/48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Acquisti Protetti</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">100% Autentici</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Ritiro al Banco</span>
                </div>
              </div>
            </div>

            {/* Colonna Destra: Card Live Status Collettore (Visual Showcase Preview) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl space-y-4 relative z-10">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        LIVE
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Hub Sincronizzato</h4>
                        <p className="text-[11px] text-slate-500">Giacenza unificata in tempo reale</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {channelStats.total} Articoli
                    </span>
                  </div>

                  {/* Canali Connessi */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Disponibilità Cross-Canale
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedChannel(selectedChannel === "SUBITO" ? "ALL" : "SUBITO")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedChannel === "SUBITO"
                            ? "border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-500"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-amber-800 block text-xs">Subito.it</span>
                          <span className="text-[10px] text-slate-500">TuttoSubito</span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">
                          {channelStats.subito}
                        </span>
                      </button>

                      <button
                        onClick={() => setSelectedChannel(selectedChannel === "VINTED" ? "ALL" : "VINTED")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedChannel === "VINTED"
                            ? "border-cyan-500 bg-cyan-50/70 shadow-2xs ring-1 ring-cyan-500"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-cyan-800 block text-xs">Vinted</span>
                          <span className="text-[10px] text-slate-500">Protezione &amp; Box</span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-cyan-200 text-cyan-800">
                          {channelStats.vinted}
                        </span>
                      </button>

                      <button
                        onClick={() => setSelectedChannel(selectedChannel === "EBAY" ? "ALL" : "EBAY")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedChannel === "EBAY"
                            ? "border-blue-500 bg-blue-50/70 shadow-2xs ring-1 ring-blue-500"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-blue-800 block text-xs">eBay</span>
                          <span className="text-[10px] text-slate-500">Garanzia Cliente</span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                          {channelStats.ebay}
                        </span>
                      </button>

                      <button
                        onClick={() => setSelectedChannel(selectedChannel === "NEGOZIO" ? "ALL" : "NEGOZIO")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedChannel === "NEGOZIO"
                            ? "border-emerald-500 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-500"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-emerald-800 block text-xs">In Negozio</span>
                          <span className="text-[10px] text-slate-500">Pronta Consegna</span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                          {channelStats.negozio}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero rischio di doppia vendita: venduto su un canale, scalato da tutti.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Fascia Canali Connessi */}
      <section id="canali" className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Sincronizzato in tempo reale su:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1.5">
              <span>🟠</span> Subito.it TuttoSubito
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold flex items-center gap-1.5">
              <span>🔵</span> Vinted Locker &amp; Home
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold flex items-center gap-1.5">
              <span>🌐</span> eBay Shopping Protetto
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5">
              <span>🏪</span> Negozio Fisico &amp; Ritiro Banco
            </span>
          </div>
        </div>
      </section>

      {/* 4. Barra di Ricerca & Filtri Canale / Categoria */}
      <section id="catalogo" className="bg-slate-50 border-b border-slate-200/80 sticky top-18 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Input di Ricerca */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca capo, brand, SKU o caratteristica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-full text-xs bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtri Canali Marketplace (Pills con icone) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedChannel("ALL")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Tutti i Canali ({products.length})
              </button>
              <button
                onClick={() => setSelectedChannel("SUBITO")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "SUBITO"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100"
                }`}
              >
                Subito.it ({channelStats.subito})
              </button>
              <button
                onClick={() => setSelectedChannel("VINTED")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "VINTED"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-cyan-50 text-cyan-800 border border-cyan-200/80 hover:bg-cyan-100"
                }`}
              >
                Vinted ({channelStats.vinted})
              </button>
              <button
                onClick={() => setSelectedChannel("EBAY")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "EBAY"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100"
                }`}
              >
                eBay ({channelStats.ebay})
              </button>
              <button
                onClick={() => setSelectedChannel("NEGOZIO")}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedChannel === "NEGOZIO"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                }`}
              >
                In Negozio ({channelStats.negozio})
              </button>
            </div>
          </div>

          {/* Filtri Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-400 text-[11px] font-medium mr-1 shrink-0">Categoria:</span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tutte
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Griglia Articoli Collettore */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Collezione &amp; Capi Disponibili
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredProducts.length} articoli sincronizzati nel collettore multi-canale
            </p>
          </div>
          {selectedChannel !== "ALL" && (
            <div className="self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Canale attivo: {selectedChannel}
                <button
                  onClick={() => setSelectedChannel("ALL")}
                  className="hover:text-emerald-950 font-black cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="taaaac-card text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
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
              className="mt-4 px-5 py-2.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Azzera Tutti i Filtri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const images = getProductImages(product);
              const mainImage = images[0];
              const isLowStock = product.stock === 1;

              return (
                <div
                  key={product.id}
                  className="group bg-white border border-slate-200/90 rounded-3xl overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-xl transition-all duration-300"
                >
                  {/* Immagine con badge sovrapposti */}
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={mainImage}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge Condizione */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 shadow-xs">
                        {getConditionText(product.condition)}
                      </span>
                    </div>

                    {/* Badge Riservato / Pezzo Unico / Scorta */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {product.isReserved && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          In Trattativa
                        </span>
                      )}
                      {isLowStock ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-xs">
                          Pezzo Unico
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                          {product.stock} disp.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dettagli Articolo */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        {product.category}
                      </span>
                      {product.sku && (
                        <span className="font-mono text-[10px] text-slate-400">SKU: {product.sku}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.title}
                    </h3>

                    {/* Prezzo */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-black text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>

                    {/* Presenza Marketplace (Badge Canali Attivi) */}
                    <div className="pt-3 border-t border-slate-100 mt-auto mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Disponibile anche su:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {product.syncSubito && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                            Subito
                          </span>
                        )}
                        {product.syncVinted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/70">
                            Vinted
                          </span>
                        )}
                        {product.syncEbay && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/70">
                            eBay
                          </span>
                        )}
                        {product.stock > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                            In Negozio
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottoni Azione */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setActiveImageIndex(0);
                        }}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>Dettagli</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={getWhatsAppInquiryUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer text-center active:scale-95"
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

      {/* 6. Sezione Orari & Negozio (Stile coordinato con gli altri moduli) */}
      <section id="info" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Punto Vendita Fisico</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Vieni a trovarci in Negozio
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tutti i capi del catalogo possono essere provati e ritirati direttamente al banco senza costi di spedizione. Puoi anche riservare un capo online e ritirarlo entro 24 ore.
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Via Garibaldi 42, Arezzo (AR)</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href={`tel:${tenantConfig.contact?.phone || "+390289015678"}`} className="hover:text-emerald-700 font-semibold">
                  {tenantConfig.contact?.phone || "+39 02 8901 5678"}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp attivo per foto e misure dal vivo</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Orari di Apertura Negozio
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-800">Lunedì – Venerdì</span>
                <span>09:30 – 13:00 / 15:30 – 19:30</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-800">Sabato (Orario Continuato)</span>
                <span className="font-semibold text-emerald-700">09:30 – 19:30</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400">
                <span>Domenica</span>
                <span>Chiuso</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Modale Scheda Dettaglio Articolo & Hub Acquisto Multi-Canale */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Header Modale */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Dettaglio Articolo
                </span>
                {selectedProduct.sku && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
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
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
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

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {selectedProduct.description}
                  </p>

                  {selectedProduct.isReserved && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong className="block">In Trattativa</strong>
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
                      <span>Sincronizzazione scorte:</span>
                      <strong className="text-emerald-700 font-semibold">Attiva in tempo reale</strong>
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
                      className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
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
                      className="p-3.5 rounded-2xl border border-cyan-200 bg-cyan-50/40 hover:bg-cyan-50 hover:border-cyan-400 transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
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
                      className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
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
                      className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
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

                {/* Opzione WhatsApp Diretto */}
                <div className="mt-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="text-xs font-bold text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Vuoi maggiori dettagli su questo articolo?
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Scrivici direttamente su WhatsApp per foto aggiuntive, misure o prenotazione al banco
                    </p>
                  </div>

                  <a
                    href={getWhatsAppInquiryUrl(selectedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
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

      {/* 8. Footer Dark Coordinato - Identico a Barberly, Schedly, Tavoly e Taskly */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>{tenantConfig.theme.brandName}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Boutique di moda &amp; accessori selezionati. Sincronizzazione multi-canale in tempo reale su Subito, Vinted, eBay e Negozio Fisico.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Navigazione</h5>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#catalogo" className="hover:text-emerald-400 transition-colors">Tutti i Capi</a></li>
                <li><a href="#canali" className="hover:text-emerald-400 transition-colors">Marketplace Connessi</a></li>
                <li><a href="#info" className="hover:text-emerald-400 transition-colors">Orari &amp; Dove Siamo</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Garanzie &amp; Servizi</h5>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>✓ Spedizione Rapida 24/48h</li>
                <li>✓ Protezione Acquisti Garantita</li>
                <li>✓ Ritiro Gratuito al Banco</li>
                <li>✓ Assistenza WhatsApp Dedicata</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Contatti Rapidi</h5>
              <p className="text-xs text-slate-400">
                Telefono: {tenantConfig.contact?.phone || "+39 02 8901 5678"}<br />
                WhatsApp: Attivo per info e foto dal vivo<br />
                Indirizzo: Via Garibaldi 42, Arezzo
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} {tenantConfig.theme.brandName}. Tutti i diritti riservati. Powered by Taaaac.</p>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔒 Area Riservata Esercente</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
