"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Globe,
  Truck,
  Search,
  Plus,
  Minus,
  Check,
  Copy,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Share2,
  Clock,
  ShieldCheck,
  Zap,
  Store,
  X,
  ExternalLink,
} from "lucide-react";
import { MockProduct, MockOrder } from "@/lib/mock-store";
import {
  updateOrderStatus,
  updateProductStock,
  toggleProductMarketplaceSync,
} from "@/lib/store-actions";
import { TenantConfigResponse } from "@/types/taaaac";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  generateChannelListing,
  SalesChannel,
} from "@/lib/channel-manager";

interface AdminDashboardProps {
  initialProducts: MockProduct[];
  initialOrders: MockOrder[];
  tenantConfig: TenantConfigResponse;
}

export default function AdminDashboard({
  initialProducts,
  initialOrders,
  tenantConfig,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "marketplaces" | "orders">("catalog");
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [orders, setOrders] = useState<MockOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");

  // Modale Quick Lister 1-Click
  const [listerProduct, setListerProduct] = useState<MockProduct | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel>("SUBITO");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Modale Modifica Tracking Spedizione
  const [trackingModalOrder, setTrackingModalOrder] = useState<MockOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState("");

  // KPI Dashboard
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= 3).length;
    const pendingOrders = orders.filter((o) => o.status === "IN_ATTESA" || o.status === "PAGATO").length;
    let totalMarketplaceListings = 0;
    products.forEach((p) => {
      if (p.syncFacebook) totalMarketplaceListings++;
      if (p.syncSubito) totalMarketplaceListings++;
      if (p.syncEbay) totalMarketplaceListings++;
      if (p.syncVinted) totalMarketplaceListings++;
    });

    return {
      totalProducts: products.length,
      totalInventoryValue,
      lowStockCount,
      pendingOrders,
      totalMarketplaceListings,
    };
  }, [products, orders]);

  // Filtro Prodotti
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        searchQuery === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [products, searchQuery]);

  // Aggiorna Scorta Magazzino
  const handleStockChange = async (productId: string, delta: number) => {
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    const newStock = Math.max(0, current.stock + delta);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    await updateProductStock(productId, newStock);
  };

  // Toggle Sincronizzazione Canale
  const handleToggleSync = async (
    productId: string,
    channel: "syncFacebook" | "syncSubito" | "syncEbay" | "syncVinted"
  ) => {
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    const newVal = !current[channel];

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [channel]: newVal } : p))
    );
    await toggleProductMarketplaceSync(productId, channel, newVal);
  };

  // Aggiorna Stato Ordine
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    await updateOrderStatus(orderId, newStatus);
  };

  // Salva Tracking Code
  const handleSaveTracking = async () => {
    if (!trackingModalOrder) return;
    const orderId = trackingModalOrder.id;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, trackingCode: trackingInput, status: "SPEDITO" } : o
      )
    );
    await updateOrderStatus(orderId, "SPEDITO", trackingInput);
    setTrackingModalOrder(null);
    setTrackingInput("");
  };

  // Copia annuncio negli appunti
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Header Area Riservata Commerciante */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-5 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  {tenantConfig.theme.brandName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Merchant Hub
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pannello di Controllo E-Commerce & Marketplace • Taaaac
              </p>
            </div>
          </div>

          {/* Navigazione Tab */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "catalog"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Catalogo & Scorte
            </button>
            <button
              onClick={() => setActiveTab("marketplaces")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "marketplaces"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Marketplace Hub
              {stats.lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Ordini ({orders.length})
              {stats.pendingOrders > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] font-bold">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          </div>

          {/* Link alla Vetrina Pubblica */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
          >
            <span>Vedi Vetrina Pubblica</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      </header>

      {/* 2. Top KPI Cards */}
      <section className="max-w-7xl mx-auto w-full px-5 pt-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Articoli a Catalogo</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalProducts} prodotti</p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Valore Magazzino</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalInventoryValue)}
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Annunci Marketplace</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.totalMarketplaceListings} attivi
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Ordini Da Lavorare</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.pendingOrders} da spedire
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contenuto Principale Dinamico */}
      <main className="max-w-7xl mx-auto w-full px-5 py-4 flex-1">
        {/* TAB 1: Catalogo & Scorte */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
            <div className="taaaac-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca prodotto per titolo, categoria o SKU..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300"
                />
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Modifiche sincronizzate in tempo reale</span>
              </div>
            </div>

            <div className="taaaac-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Articolo</th>
                      <th className="p-4">Prezzo</th>
                      <th className="p-4">Condizione</th>
                      <th className="p-4">Giacenza Magazzino</th>
                      <th className="p-4">Sync Canali Marketplace</th>
                      <th className="p-4 text-right">Quick Lister</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock <= 3;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 max-w-xs">
                            <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {p.sku || "NO-SKU"} • {p.category}
                            </p>
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {formatCurrency(p.price)}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                              {p.condition}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStockChange(p.id, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                  p.stock <= 0
                                    ? "bg-rose-100 text-rose-800"
                                    : isLowStock
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {p.stock} pz
                              </span>
                              <button
                                onClick={() => handleStockChange(p.id, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleSync(p.id, "syncSubito")}
                                title="Subito.it"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncSubito
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                Subito
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncFacebook")}
                                title="Facebook Marketplace"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncFacebook
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                FB
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncEbay")}
                                title="eBay"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncEbay
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                eBay
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncVinted")}
                                title="Vinted"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncVinted
                                    ? "bg-teal-100 text-teal-800 border border-teal-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                Vinted
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setListerProduct(p);
                                setSelectedChannel("SUBITO");
                              }}
                              className="taaaac-btn-primary py-1.5 px-3 text-xs"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Pubblica 1-Click
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Marketplace Hub */}
        {activeTab === "marketplaces" && (
          <div className="space-y-6">
            <div className="taaaac-card p-6 bg-linear-to-r from-slate-900 to-slate-800 text-white border-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold">
                      Hub di Pubblicazione 1-Click sui Marketplace
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Sincronizza automaticamente i tuoi articoli su <strong>Facebook Marketplace</strong>, <strong>Subito.it</strong>, <strong>eBay</strong> e <strong>Vinted</strong>. Quando un capo viene venduto sul sito o in negozio, la disponibilità viene scalata ovunque evitando doppie vendite.
                  </p>
                </div>
              </div>
            </div>

            {/* Portali Collegati */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="taaaac-card p-5 border-t-4 border-t-orange-500">
                <h4 className="font-bold text-sm text-slate-900 mb-1">Subito.it</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Ideale per ritiro a mano locale e spedizioni TuttoSubito.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-orange-600 font-bold">
                    {products.filter((p) => p.syncSubito).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-blue-600">
                <h4 className="font-bold text-sm text-slate-900 mb-1">Facebook Marketplace</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Massima visibilità sui gruppi d&apos;acquisto locali e social.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-blue-600 font-bold">
                    {products.filter((p) => p.syncFacebook).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-emerald-600">
                <h4 className="font-bold text-sm text-slate-900 mb-1">eBay</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Vendite professionali con corriere espresso e garanzia.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-emerald-600 font-bold">
                    {products.filter((p) => p.syncEbay).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-teal-500">
                <h4 className="font-bold text-sm text-slate-900 mb-1">Vinted</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Specializzato per abbigliamento, scarpe e second-hand.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-teal-600 font-bold">
                    {products.filter((p) => p.syncVinted).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Lister Selector */}
            <div className="taaaac-card p-5">
              <h3 className="font-bold text-base text-slate-900 mb-3">
                Generatore Inserzione Rapida per Qualsiasi Prodotto
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Seleziona un prodotto per generare immediatamente il testo e i dati ottimizzati per il portale di destinazione:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setListerProduct(p);
                      setSelectedChannel("SUBITO");
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-slate-900 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-500">{formatCurrency(p.price)} • {p.category}</p>
                    </div>
                    <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Gestione Ordini & Spedizioni */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="taaaac-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registro Ordini Ricevuti
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Traccia gli ordini dalla vetrina online e dai canali sincronizzati
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Numero Ordine</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Cliente & Recapito</th>
                      <th className="p-4">Canale</th>
                      <th className="p-4">Consegna</th>
                      <th className="p-4">Stato Avanzamento</th>
                      <th className="p-4">Tracking</th>
                      <th className="p-4 text-right">Totale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {o.orderNumber}
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(o.createdAt)}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{o.customerName}</p>
                          <p className="text-[11px] text-slate-500">{o.customerPhone}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                            {o.channel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              o.fulfillmentType === "SPEDIZIONE"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {o.fulfillmentType === "SPEDIZIONE" ? "Spedizione" : "Ritiro Negozio"}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                              o.status === "COMPLETATO"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : o.status === "SPEDITO"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : o.status === "PAGATO"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="IN_ATTESA">In Attesa</option>
                            <option value="PAGATO">Pagato</option>
                            <option value="SPEDITO">Spedito</option>
                            <option value="COMPLETATO">Completato</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {o.trackingCode ? (
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {o.trackingCode}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setTrackingModalOrder(o);
                                setTrackingInput("");
                              }}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                            >
                              + Aggiungi Tracking
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(o.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Modale Quick Lister 1-Click */}
      {listerProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Quick Lister: {listerProduct.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Genera testo ottimizzato in 1 clic per i portali di vendita
                </p>
              </div>
              <button
                onClick={() => setListerProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scelta Canale */}
            <div className="pt-4 pb-2">
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Seleziona Piattaforma Marketplace:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["SUBITO", "FACEBOOK", "EBAY", "VINTED"] as SalesChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChannel(ch);
                      setCopiedSuccess(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === ch
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ch === "SUBITO" && "Subito.it"}
                    {ch === "FACEBOOK" && "Facebook"}
                    {ch === "EBAY" && "eBay"}
                    {ch === "VINTED" && "Vinted"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dati Inserzione */}
            {(() => {
              const listing = generateChannelListing(
                {
                  id: listerProduct.id,
                  name: listerProduct.title,
                  sku: listerProduct.sku || "PROD",
                  description: listerProduct.description,
                  price: listerProduct.price,
                  condition: listerProduct.condition,
                  category: { name: listerProduct.category },
                },
                selectedChannel,
                tenantConfig.theme.brandName
              );

              return (
                <div className="flex-1 overflow-y-auto py-3 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Titolo Annuncio</span>
                      <span className="font-bold text-slate-900">{listing.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Prezzo Calcolato</span>
                      <span className="text-base font-black text-emerald-600">
                        {formatCurrency(listing.price)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Testo Formattato Pronto da Incollare:
                    </label>
                    <textarea
                      readOnly
                      rows={8}
                      value={listing.formattedText}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Note: {listing.shippingNotes}</span>
                    <div className="flex gap-1">
                      {listing.tags.map((t) => (
                        <span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Azioni Modale */}
            <div className="pt-4 border-t border-slate-100">
              {(() => {
                const listing = generateChannelListing(
                  {
                    id: listerProduct.id,
                    name: listerProduct.title,
                    sku: listerProduct.sku || "PROD",
                    description: listerProduct.description,
                    price: listerProduct.price,
                    condition: listerProduct.condition,
                    category: { name: listerProduct.category },
                  },
                  selectedChannel,
                  tenantConfig.theme.brandName
                );
                return (
                  <button
                    onClick={() => handleCopyText(listing.formattedText)}
                    className="taaaac-btn-accent w-full py-3 text-xs"
                  >
                    {copiedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Copiato negli Appunti! Incolla su {listing.channelName}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copia Testo Inserzione per {listing.channelName}
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modale Aggiunta Tracking Spedizione */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Aggiungi Tracking Spedizione
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ordine: {trackingModalOrder.orderNumber} ({trackingModalOrder.customerName})
            </p>

            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="es. BRT-19920199IT, GLS-3382910..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 mb-4 focus:outline-hidden focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="taaaac-btn-secondary w-1/2 py-2 text-xs"
              >
                Annulla
              </button>
              <button
                disabled={!trackingInput.trim()}
                onClick={handleSaveTracking}
                className="taaaac-btn-primary w-1/2 py-2 text-xs"
              >
                Salva & Segna Spedito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
