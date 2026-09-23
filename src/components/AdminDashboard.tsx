"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LogOut,
  DollarSign,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { MockProduct, MockOrder } from "@/lib/mock-store";
import {
  updateOrderStatus,
  updateProductStock,
  toggleProductMarketplaceSync,
  recordMarketplaceSale,
  createProduct,
  toggleProductReservation,
  upsertChannelListing,
  CreateProductInput,
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"catalog" | "marketplaces" | "orders">("catalog");
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [orders, setOrders] = useState<MockOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Modale Quick Lister 1-Click
  const [listerProduct, setListerProduct] = useState<MockProduct | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel>("SUBITO");
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);
  const [listingUrlInput, setListingUrlInput] = useState("");
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [listingSavedSuccess, setListingSavedSuccess] = useState(false);

  // Modale Registra Vendita Rapida (Anti-Doppia Vendita)
  const [saleProduct, setSaleProduct] = useState<MockProduct | null>(null);
  const [saleChannel, setSaleChannel] = useState<string>("VINTED");
  const [salePrice, setSalePrice] = useState<number>(0);
  const [isRecordingSale, setIsRecordingSale] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Modale Nuovo Articolo Multi-Canale
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newComparePrice, setNewComparePrice] = useState("");
  const [newCategory, setNewCategory] = useState("Abbigliamento Vintage");
  const [newCondition, setNewCondition] = useState("OTTIME_CONDIZIONI");
  const [newStock, setNewStock] = useState("1");
  const [newSku, setNewSku] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSyncSubito, setNewSyncSubito] = useState(true);
  const [newSyncVinted, setNewSyncVinted] = useState(true);
  const [newSyncEbay, setNewSyncEbay] = useState(false);
  const [newSyncFacebook, setNewSyncFacebook] = useState(true);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Modale Modifica Tracking Spedizione
  const [trackingModalOrder, setTrackingModalOrder] = useState<MockOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState("");

  // Modale Riserva / Blocca per Cliente (Trattativa WhatsApp o Negozio)
  const [reserveModalProduct, setReserveModalProduct] = useState<MockProduct | null>(null);
  const [reserveNoteInput, setReserveNoteInput] = useState("");
  const [isReserving, setIsReserving] = useState(false);

  // Filtro Canale Ordini
  const [orderChannelFilter, setOrderChannelFilter] = useState<string>("ALL");

  // KPI Dashboard
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock === 1).length;
    const pendingOrders = orders.filter((o) => o.status === "IN_ATTESA" || o.status === "PAGATO").length;
    let totalMarketplaceListings = 0;
    products.forEach((p) => {
      if (p.stock > 0) {
        if (p.syncFacebook) totalMarketplaceListings++;
        if (p.syncSubito) totalMarketplaceListings++;
        if (p.syncEbay) totalMarketplaceListings++;
        if (p.syncVinted) totalMarketplaceListings++;
      }
    });

    const totalSalesVolume = orders.reduce((acc, o) => acc + o.totalAmount, 0);

    return {
      totalProducts: products.length,
      totalInventoryValue,
      lowStockCount,
      pendingOrders,
      totalMarketplaceListings,
      totalSalesVolume,
    };
  }, [products, orders]);

  // Filtro Prodotti
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        searchQuery === "" ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  // Filtro Ordini
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderChannelFilter === "ALL") return true;
      return o.channel.toUpperCase() === orderChannelFilter.toUpperCase();
    });
  }, [orders, orderChannelFilter]);

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

  // Toggle Riserva Articolo (Trattative WhatsApp o Banco)
  const handleToggleReserve = async () => {
    if (!reserveModalProduct) return;
    setIsReserving(true);

    const newReservedState = !reserveModalProduct.isReserved;
    const note = newReservedState
      ? reserveNoteInput.trim() || "In trattativa con cliente"
      : undefined;

    try {
      await toggleProductReservation(reserveModalProduct.id, newReservedState, note);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === reserveModalProduct.id
            ? { ...p, isReserved: newReservedState, reservedNote: note }
            : p
        )
      );

      setReserveModalProduct(null);
      setReserveNoteInput("");
    } catch (err) {
      console.error("Errore riserva articolo:", err);
      alert("Errore durante l'aggiornamento dello stato dell'articolo.");
    } finally {
      setIsReserving(false);
    }
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

  // Registra Vendita (Anti-Doppia Vendita)
  const handleOpenSaleModal = (product: MockProduct) => {
    setSaleProduct(product);
    setSalePrice(product.price);
    // Seleziona come default il primo canale attivo
    if (product.syncVinted) setSaleChannel("VINTED");
    else if (product.syncSubito) setSaleChannel("SUBITO");
    else if (product.syncEbay) setSaleChannel("EBAY");
    else if (product.syncFacebook) setSaleChannel("FACEBOOK");
    else setSaleChannel("NEGOZIO");
  };

  const handleConfirmSale = async () => {
    if (!saleProduct) return;
    setIsRecordingSale(true);

    try {
      const res = await recordMarketplaceSale({
        productId: saleProduct.id,
        channel: saleChannel,
        quantity: 1,
        salePrice: Number(salePrice) || saleProduct.price,
      });

      if (res.success && res.order) {
        // Aggiorna stato prodotti
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === saleProduct.id) {
              const updatedStock = Math.max(0, p.stock - 1);
              return {
                ...p,
                stock: updatedStock,
                ...(updatedStock === 0
                  ? {
                      syncFacebook: false,
                      syncSubito: false,
                      syncEbay: false,
                      syncVinted: false,
                    }
                  : {}),
              };
            }
            return p;
          })
        );

        // Aggiungi vendita al registro ordini
        setOrders((prev) => [res.order as MockOrder, ...prev]);

        setSaleSuccessMessage(
          `Vendita registrata su ${saleChannel}! ${
            saleProduct.stock <= 1
              ? "Articolo esaurito: sincronizzazione disattivata da tutti i canali (Anti-Doppia Vendita)."
              : "Scorta scalata con successo."
          }`
        );

        setSaleProduct(null);
        setTimeout(() => setSaleSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Errore registrazione vendita:", err);
      alert("Si è verificato un errore durante la registrazione della vendita.");
    } finally {
      setIsRecordingSale(false);
    }
  };

  // Creazione Nuovo Articolo Multi-Canale
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) {
      alert("Inserisci almeno il titolo e il prezzo dell'articolo.");
      return;
    }

    setIsCreatingProduct(true);
    try {
      const imagesArray = newImageUrl.trim()
        ? [newImageUrl.trim()]
        : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];

      const input: CreateProductInput = {
        title: newTitle.trim(),
        description: newDescription.trim() || `${newTitle} selezionato e verificato per la vendita.`,
        price: parseFloat(newPrice),
        comparePrice: newComparePrice ? parseFloat(newComparePrice) : null,
        stock: parseInt(newStock) || 1,
        category: newCategory,
        images: JSON.stringify(imagesArray),
        sku: newSku.trim() || `VD-${Date.now().toString().slice(-6)}`,
        condition: newCondition,
        syncSubito: newSyncSubito,
        syncVinted: newSyncVinted,
        syncEbay: newSyncEbay,
        syncFacebook: newSyncFacebook,
      };

      const res = await createProduct(input);
      if (res.success && res.product) {
        setProducts((prev) => [res.product as MockProduct, ...prev]);
        setIsNewModalOpen(false);

        // Apri immediatamente il Quick Lister per pubblicare sui canali selezionati!
        setListerProduct(res.product as MockProduct);
        setSelectedChannel(newSyncSubito ? "SUBITO" : newSyncVinted ? "VINTED" : "FACEBOOK");

        // Reset form
        setNewTitle("");
        setNewPrice("");
        setNewComparePrice("");
        setNewSku("");
        setNewImageUrl("");
        setNewDescription("");
      }
    } catch (err) {
      console.error("Errore creazione prodotto:", err);
      alert("Errore durante la creazione del prodotto.");
    } finally {
      setIsCreatingProduct(false);
    }
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

  // Copia negli appunti
  const handleCopyText = (text: string, type: string = "all") => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(type);
    setTimeout(() => setCopiedSuccess(null), 2500);
  };

  // Salva Link Inserzione Live sul Marketplace (Issue #6)
  const handleSaveListingLink = async () => {
    if (!listerProduct || !listingUrlInput.trim()) return;
    setIsSavingListing(true);
    try {
      await upsertChannelListing({
        productId: listerProduct.id,
        channel: selectedChannel,
        externalUrl: listingUrlInput.trim(),
        listedPrice: listerProduct.price,
        status: "ACTIVE",
      });
      setListingSavedSuccess(true);
      setTimeout(() => setListingSavedSuccess(false), 3000);
      setListingUrlInput("");
    } finally {
      setIsSavingListing(false);
    }
  };

  // Logout / Blocco Cassa
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  // URL per aprire il form di inserimento del canale
  const getMarketplacePublishFormUrl = (channel: SalesChannel) => {
    switch (channel) {
      case "SUBITO":
        return "https://www.subito.it/inserisci/";
      case "VINTED":
        return "https://www.vinted.it/items/new";
      case "EBAY":
        return "https://www.ebay.it/sl/sell";
      case "FACEBOOK":
        return "https://www.facebook.com/marketplace/create/item";
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* 1. Header Area Riservata Commerciante */}
      <header className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Riga Superiore: Brand Info & Azioni Rapide (Sempre allineati a destra) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold tracking-tight text-white truncate">
                  {tenantConfig.theme.brandName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Collettore & Hub Marketplace
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Pannello di Gestione Multi-Canale & Anti-Doppia Vendita • Taaaac
              </p>
            </div>
          </div>

          {/* Azioni Rapide a Destra: Sempre accanto */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
            >
              <span>Vedi Collettore</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
              title="Blocca sessione cassa e richiedi PIN"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "Uscita..." : "Blocca Cassa"}</span>
            </button>
          </div>
        </div>

        {/* Riga Inferiore: Tab Switcher & Status Indicator */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "marketplaces"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Marketplace Hub
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Vendite & Spedizioni ({orders.length})
              {stats.pendingOrders > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] font-bold">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sync Live Attivo • Subito, Vinted, eBay, FB</span>
          </div>
        </div>
      </header>

      {/* Banner Notifica Successo Vendita Anti-Doppia Vendita */}
      {saleSuccessMessage && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span className="font-semibold">{saleSuccessMessage}</span>
          </div>
          <button onClick={() => setSaleSuccessMessage(null)} className="text-white hover:text-emerald-200">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Articoli a Catalogo</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalProducts} pezzi</p>
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
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pezzi Unici Rimasti</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.lowStockCount} ad alto rischio
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Volume Vendite</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalSalesVolume)}
              </p>
            </div>
          </div>
        </div>

      {/* 3. Contenuto Principale Dinamico */}
      <div className="space-y-4">
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
                  placeholder="Cerca per titolo, categoria o SKU..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="taaaac-btn-accent text-xs flex items-center gap-1.5 py-2 px-3.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo Articolo Multi-Canale</span>
                </button>
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
                      <th className="p-4">Giacenza</th>
                      <th className="p-4">Sync Canali Marketplace</th>
                      <th className="p-4 text-right">Azioni Vendita & Lister</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock === 1;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                              {p.isReserved && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  🔒 In Trattativa
                                </span>
                              )}
                            </div>
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
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
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
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
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
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                Subito
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncVinted")}
                                title="Vinted"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncVinted
                                    ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                Vinted
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncEbay")}
                                title="eBay"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncEbay
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                eBay
                              </button>
                              <button
                                onClick={() => handleToggleSync(p.id, "syncFacebook")}
                                title="Facebook Marketplace"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  p.syncFacebook
                                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                    : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                                }`}
                              >
                                FB
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pulsante Riserva / Blocca per Trattativa */}
                              {p.isReserved ? (
                                <button
                                  onClick={() => {
                                    setReserveModalProduct(p);
                                    setReserveNoteInput(p.reservedNote || "");
                                  }}
                                  title="Articolo riservato: clicca per gestire o sbloccare"
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Bloccato</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReserveModalProduct(p);
                                    setReserveNoteInput("");
                                  }}
                                  disabled={p.stock <= 0}
                                  title="Blocca / Riserva questo articolo per un cliente in trattativa"
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Blocca</span>
                                </button>
                              )}

                              {/* Pulsante Segna come Venduto (Anti-Doppia Vendita) */}
                              <button
                                onClick={() => handleOpenSaleModal(p)}
                                disabled={p.stock <= 0}
                                title="Registra vendita su un canale e scala giacenza"
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Venduto</span>
                              </button>

                              {/* Pulsante Quick Lister */}
                              <button
                                onClick={() => {
                                  setListerProduct(p);
                                  setSelectedChannel("SUBITO");
                                }}
                                className="taaaac-btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Pubblica</span>
                              </button>
                            </div>
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
            <div className="taaaac-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold">
                      Hub di Pubblicazione 1-Click sui Marketplace
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Sincronizza e gestisci le inserzioni su <strong>Subito.it</strong>,{" "}
                    <strong>Vinted</strong>, <strong>eBay</strong> e <strong>Facebook Marketplace</strong>.
                    Quando vendi un articolo su uno qualsiasi dei canali, la disponibilità viene scalata istantaneamente,
                    proteggendoti da doppie vendite e dispute.
                  </p>
                </div>
              </div>
            </div>

            {/* Portali Collegati */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="taaaac-card p-5 border-t-4 border-t-amber-500">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">Subito.it</h4>
                  <a
                    href="https://www.subito.it/inserisci/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>Inserisci</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Ideale per vendite locali con TuttoSubito e spedizione.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-amber-700 font-bold">
                    {products.filter((p) => p.syncSubito && p.stock > 0).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-cyan-500">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">Vinted</h4>
                  <a
                    href="https://www.vinted.it/items/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>Carica</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Specializzato per abbigliamento, scarpe e second-hand.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-cyan-700 font-bold">
                    {products.filter((p) => p.syncVinted && p.stock > 0).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-blue-600">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">eBay</h4>
                  <a
                    href="https://www.ebay.it/sl/sell"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>Vendi</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Vendite professionali con corriere e garanzia cliente.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-blue-700 font-bold">
                    {products.filter((p) => p.syncEbay && p.stock > 0).length}
                  </span>
                </div>
              </div>

              <div className="taaaac-card p-5 border-t-4 border-t-indigo-600">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">Facebook Marketplace</h4>
                  <a
                    href="https://www.facebook.com/marketplace/create/item"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>Crea</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Massima visibilità sui gruppi d&apos;acquisto locali.
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Articoli Attivi:</span>
                  <span className="text-indigo-700 font-bold">
                    {products.filter((p) => p.syncFacebook && p.stock > 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Lister Selector */}
            <div className="taaaac-card p-5">
              <h3 className="font-bold text-base text-slate-900 mb-1">
                Generatore Inserzione Rapida 1-Click
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Clicca su un qualsiasi articolo per generare istantaneamente il testo, i tag e le note di spedizione pronte per essere incollate:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.slice(0, 9).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setListerProduct(p);
                      setSelectedChannel("SUBITO");
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs text-slate-900 truncate group-hover:text-emerald-800">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(p.price)} • {p.category} ({p.stock} pz)
                      </p>
                    </div>
                    <Share2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Gestione Vendite & Spedizioni */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="taaaac-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registro Vendite Cross-Canale
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tutte le vendite registrate da Vinted, Subito.it, eBay, Facebook e Banco Negozio
                  </p>
                </div>

                {/* Filtro per Canale */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Canale:</span>
                  {["ALL", "SUBITO", "VINTED", "EBAY", "FACEBOOK", "NEGOZIO"].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setOrderChannelFilter(ch)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        orderChannelFilter === ch
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {ch === "ALL" ? "Tutti" : ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Codice Transazione</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Cliente / Riferimento</th>
                      <th className="p-4">Canale di Vendita</th>
                      <th className="p-4">Modalità</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4">Tracking</th>
                      <th className="p-4 text-right">Totale Incassato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Nessuna vendita registrata per questo filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
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
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                o.channel === "VINTED"
                                  ? "bg-cyan-50 text-cyan-800 border border-cyan-200"
                                  : o.channel === "SUBITO"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : o.channel === "EBAY"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : o.channel === "FACEBOOK"
                                  ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
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
                              <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                {o.trackingCode}
                              </span>
                            ) : (
                              <button
                                onClick={() => setTrackingModalOrder(o)}
                                className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                              >
                                + Inserisci
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-slate-900">
                            {formatCurrency(o.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODALE REGISTRA VENDITA RAPIDA (ANTI-DOPPIA VENDITA) */}
      {saleProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Registra Vendita</h3>
                  <p className="text-[11px] text-slate-500">Scarico scorta & protezione anti-doppia vendita</p>
                </div>
              </div>
              <button
                onClick={() => setSaleProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
              <p className="font-bold text-xs text-slate-900 line-clamp-1">{saleProduct.title}</p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>SKU: {saleProduct.sku || "-"}</span>
                <span>Giacenza attuale: <strong>{saleProduct.stock} pz</strong></span>
              </div>
            </div>

            {/* Canale Vendita */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-semibold text-slate-700 block">
                Su quale canale è avvenuta la vendita?
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "VINTED", name: "Vinted", color: "border-cyan-500 bg-cyan-50/50 text-cyan-900" },
                  { id: "SUBITO", name: "Subito.it", color: "border-amber-500 bg-amber-50/50 text-amber-900" },
                  { id: "EBAY", name: "eBay", color: "border-blue-500 bg-blue-50/50 text-blue-900" },
                  { id: "FACEBOOK", name: "Facebook", color: "border-indigo-500 bg-indigo-50/50 text-indigo-900" },
                  { id: "NEGOZIO", name: "Banco Negozio", color: "border-emerald-500 bg-emerald-50/50 text-emerald-900" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSaleChannel(ch.id)}
                    className={`p-2.5 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                      saleChannel === ch.id
                        ? `${ch.color} ring-1 ring-emerald-500 shadow-2xs`
                        : "border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prezzo Effettivo */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Prezzo finale concordato (€):
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Alert Anti-Doppia Vendita */}
            {saleProduct.stock <= 1 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Giacenza a zero:</strong> Confermata la vendita, l'articolo verrà automaticamente ritirato e disattivato da tutti gli altri marketplace collegati.
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSaleProduct(null)}
                className="taaaac-btn-secondary w-1/2 py-2.5 text-xs"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isRecordingSale}
                onClick={handleConfirmSale}
                className="taaaac-btn-accent w-1/2 py-2.5 text-xs font-bold"
              >
                {isRecordingSale ? "Salvataggio..." : "Conferma Vendita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODALE NUOVO ARTICOLO MULTI-CANALE (QUICK INTAKE) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Nuovo Articolo Multi-Canale</h3>
                  <p className="text-[11px] text-slate-500">Inserimento rapido & pubblicazione automatica sui marketplace</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Titolo Articolo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Giacca Vintage Harrington Baracuta Navy taglia L"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Prezzo di Vendita (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="85.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Prezzo di Listino/Confronto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.00"
                    value={newComparePrice}
                    onChange={(e) => setNewComparePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Abbigliamento Vintage">Abbigliamento Vintage</option>
                    <option value="Scarpe & Sneakers">Scarpe & Sneakers</option>
                    <option value="Accessori">Accessori</option>
                    <option value="Elettronica">Elettronica & Audio</option>
                    <option value="Collezionismo">Collezionismo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Condizione
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="NUOVO">Nuovo con cartellino</option>
                    <option value="USATO_COME_NUOVO">Come nuovo</option>
                    <option value="OTTIME_CONDIZIONI">Ottime condizioni</option>
                    <option value="BUONE_CONDIZIONI">Buone condizioni</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Giacenza (Pz)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Codice SKU
                  </label>
                  <input
                    type="text"
                    placeholder="es. VD-HAR-09"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    URL Immagine
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Descrizione Articolo
                </label>
                <textarea
                  rows={3}
                  placeholder="Dettagli, misure, tessuto o particolarità..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Canali da attivare */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Canali Marketplace da Attivare Istantaneamente:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSyncSubito}
                      onChange={(e) => setNewSyncSubito(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-amber-800">Subito.it</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSyncVinted}
                      onChange={(e) => setNewSyncVinted(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-bold text-cyan-800">Vinted</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSyncEbay}
                      onChange={(e) => setNewSyncEbay(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-blue-800">eBay</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSyncFacebook}
                      onChange={(e) => setNewSyncFacebook(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-indigo-800">Facebook</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="taaaac-btn-secondary w-1/3 py-2.5 text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="taaaac-btn-accent w-2/3 py-2.5 text-xs font-bold"
                >
                  {isCreatingProduct ? "Salvataggio..." : "Salva & Genera Annunci"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODALE QUICK LISTER 1-CLICK CON LINK DIRETTI AI MARKETPLACE */}
      {listerProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 my-auto p-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header Modale */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Quick Lister 1-Click
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Articolo: <strong>{listerProduct.title}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setListerProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scelta Canale */}
            <div className="pt-3 pb-2">
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Seleziona Canale Marketplace:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["SUBITO", "VINTED", "EBAY", "FACEBOOK"] as SalesChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChannel(ch);
                      setCopiedSuccess(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedChannel === ch
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ch === "SUBITO" && "Subito.it"}
                    {ch === "VINTED" && "Vinted"}
                    {ch === "EBAY" && "eBay"}
                    {ch === "FACEBOOK" && "Facebook"}
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
                <div className="flex-1 overflow-y-auto py-2 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Titolo Inserzione</span>
                      <span className="font-bold text-slate-900">{listing.title}</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(listing.title, "title")}
                        className="text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                      >
                        {copiedSuccess === "title" ? "Copiato!" : "Copia Titolo"}
                      </button>
                      <span className="text-base font-black text-emerald-600">
                        {formatCurrency(listing.price)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-600">
                        Testo Formattato su Misura per {listing.channelName}:
                      </label>
                      <button
                        onClick={() => handleCopyText(listing.formattedText, "all")}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSuccess === "all" ? "Copiato!" : "Copia Testo"}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={7}
                      value={listing.formattedText}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Note: {listing.shippingNotes}</span>
                    <div className="flex gap-1">
                      {listing.tags.map((t) => (
                        <span key={t} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Azioni Modale: Copia + Apri Form Piattaforma */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
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
                  <>
                    <button
                      onClick={() => handleCopyText(listing.formattedText, "all")}
                      className="taaaac-btn-accent py-3 text-xs flex items-center justify-center gap-1.5"
                    >
                      {copiedSuccess === "all" ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Copiato negli Appunti!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>1. Copia Testo Annuncio</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getMarketplacePublishFormUrl(selectedChannel)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="taaaac-btn-primary py-3 text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>2. Apri {listing.channelName}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </>
                );
              })()}
            </div>

            {/* Step 3: Registra Link Annuncio Live (Issue #6) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                3. Hai pubblicato l&apos;annuncio? Incolla il link per tracciarlo su Vendoly:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={listingUrlInput}
                  onChange={(e) => setListingUrlInput(e.target.value)}
                  placeholder="https://www.subito.it/... o https://www.vinted.it/..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300"
                />
                <button
                  type="button"
                  onClick={handleSaveListingLink}
                  disabled={!listingUrlInput.trim() || isSavingListing}
                  className="taaaac-btn-accent text-xs px-3.5 py-2 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {isSavingListing ? "Salvataggio..." : listingSavedSuccess ? "Salvato! ✓" : "Registra Annuncio"}
                </button>
              </div>
              {listingSavedSuccess && (
                <p className="text-[11px] text-emerald-600 font-semibold">
                  ✓ Annuncio salvato nel registro marketplace! Monitorabile dalla sezione Canali.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Modale Aggiunta Tracking Spedizione */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Aggiungi Tracking Spedizione
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Transazione: {trackingModalOrder.orderNumber} ({trackingModalOrder.customerName})
            </p>

            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="es. InPost-IT19920199, BRT-3382910..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 mb-4 focus:outline-none focus:border-slate-400"
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

      {/* 8. Modale Riserva / Blocca Articolo per Cliente (Trattativa WhatsApp o Negozio) */}
      {reserveModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {reserveModalProduct.isReserved ? "Gestione Blocco Articolo" : "Blocca / Riserva Articolo"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    In base alle richieste del cliente via WhatsApp o al banco
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReserveModalProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
              <p className="font-bold text-xs text-slate-900 line-clamp-1">
                {reserveModalProduct.title}
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Prezzo: <strong>{formatCurrency(reserveModalProduct.price)}</strong></span>
                <span>Giacenza: {reserveModalProduct.stock} pz</span>
              </div>
            </div>

            {!reserveModalProduct.isReserved ? (
              <div className="space-y-3 mb-4">
                <label className="text-xs font-semibold text-slate-700 block">
                  Dettagli / Nota Trattativa (es. Nome cliente, orario o accordo):
                </label>
                <input
                  type="text"
                  placeholder="es. Riservato per Marco fino a domani alle 18:00"
                  value={reserveNoteInput}
                  onChange={(e) => setReserveNoteInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  L&apos;articolo verrà segnalato come <strong>In Trattativa</strong> sul collettore online per informare altri visitatori.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 mb-4 space-y-1">
                <p className="font-bold">Articolo attualmente bloccato:</p>
                <p className="text-[11px] italic">&quot;{reserveModalProduct.reservedNote || "In trattativa con cliente"}&quot;</p>
                <p className="text-[10px] text-amber-700 pt-1">
                  Se il cliente non finalizza, sbloccalo con un clic. Se finalizza, clicca su &quot;Venduto&quot; per scalare la giacenza.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReserveModalProduct(null)}
                className="taaaac-btn-secondary w-1/2 py-2.5 text-xs"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isReserving}
                onClick={handleToggleReserve}
                className={`w-1/2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  reserveModalProduct.isReserved
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                }`}
              >
                {isReserving
                  ? "Salvataggio..."
                  : reserveModalProduct.isReserved
                  ? "Sblocca Articolo"
                  : "Conferma Blocco"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
