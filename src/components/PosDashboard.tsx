"use client";

import React, { useState, useMemo } from "react";
import {
  Store,
  CreditCard,
  Banknote,
  Receipt,
  ShoppingBag,
  Users,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Tag,
  ShieldCheck,
  Award,
  Layers,
  Clock,
  Shirt,
  Footprints,
  Smartphone,
  Watch,
  X,
  RefreshCw,
} from "lucide-react";
import { TenantConfigResponse } from "@/types/taaaac";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  price: number;
  vatRate: number;
  stockQuantity: number;
  categoryId: string;
  category: Category;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  fidelityCardNumber?: string | null;
  fidelityPoints: number;
  tier: string;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  vatRate: number;
  quantity: number;
}

interface PosDashboardProps {
  tenantConfig: TenantConfigResponse;
  initialCategories: Category[];
  initialProducts: Product[];
  initialCustomers: Customer[];
  initialSales: any[];
  initialStats: {
    revenue: number;
    salesCount: number;
    averageTicket: number;
    totalPoints: number;
  };
}

export default function PosDashboard({
  tenantConfig,
  initialCategories,
  initialProducts,
  initialCustomers,
  initialSales,
  initialStats,
}: PosDashboardProps) {
  // Stato navigazione
  const [activeTab, setActiveTab] = useState<"pos" | "sales">("pos");

  // Filtro categoria e ricerca
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Carrello Scontrino
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialCustomers[0] || null
  );

  // Stato vendita completata / modale scontrino
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>("CONTANTI");
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista vendite per la visualizzazione dinamica
  const [salesList, setSalesList] = useState(initialSales);
  const [stats, setStats] = useState(initialStats);
  const [products, setProducts] = useState(initialProducts);

  // Filtraggio prodotti in griglia
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategoryId === "ALL" || p.categoryId === selectedCategoryId;
      const matchSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Calcoli scontrino
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalVat = useMemo(() => {
    return cart.reduce((sum, item) => {
      const line = item.price * item.quantity;
      return sum + line * (item.vatRate / (100 + item.vatRate));
    }, 0);
  }, [cart]);

  // Sconto fedeltà in base al tier del cliente
  const discountRate = useMemo(() => {
    if (!selectedCustomer) return 0;
    if (selectedCustomer.tier === "VIP") return 0.1; // 10%
    if (selectedCustomer.tier === "GOLD") return 0.05; // 5%
    return 0;
  }, [selectedCustomer]);

  const discountAmount = subtotal * discountRate;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const pointsToEarn = Math.floor(grandTotal / 10);

  // Gestione Carrello
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          vatRate: product.vatRate,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Esecuzione Pagamento / Emissione Scontrino
  const handleCheckout = async (method: string) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setCheckoutPaymentMethod(method);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerId: selectedCustomer ? selectedCustomer.id : null,
          paymentMethod: method,
          discountAmount,
        }),
      });

      const data = await res.json();
      if (data.success && data.sale) {
        setCompletedSale(data.sale);
        setIsCheckingOut(true);

        // Aggiorna lista vendite e KPI localmente
        setSalesList((prev) => [data.sale, ...prev]);
        setStats((prev) => ({
          revenue: prev.revenue + data.sale.totalAmount,
          salesCount: prev.salesCount + 1,
          averageTicket:
            (prev.revenue + data.sale.totalAmount) / (prev.salesCount + 1),
          totalPoints: prev.totalPoints + (data.sale.pointsEarned || 0),
        }));

        // Svuota carrello per la vendita successiva
        setCart([]);
      } else {
        alert(data.error || "Errore nella registrazione della vendita");
      }
    } catch (err) {
      console.error("Errore checkout:", err);
      alert("Errore di connessione durante l'emissione");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funzione icona di categoria
  const renderCategoryIcon = (iconName?: string | null) => {
    switch (iconName) {
      case "Shirt":
        return <Shirt className="w-4 h-4" />;
      case "Watch":
        return <Watch className="w-4 h-4" />;
      case "Footprints":
        return <Footprints className="w-4 h-4" />;
      case "Sparkles":
        return <Sparkles className="w-4 h-4" />;
      case "Smartphone":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header Taaaac Ecosystem Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-5 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Taaaac Core Indicator */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {tenantConfig.theme.brandName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Vendoly POS
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Licenza {tenantConfig.licenseStatus}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  Core:{" "}
                  <span className="font-mono text-slate-700">
                    {tenantConfig.domain}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Moduli Add-on Attivi (da Taaaac Core) */}
          <div className="hidden lg:flex items-center gap-2">
            {tenantConfig.enabledModules.map((mod) => (
              <span
                key={mod}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {mod === "WHATSAPP_REMINDERS" && "WhatsApp"}
                {mod === "LOYALTY_CARD" && "Loyalty Card"}
                {mod === "VENDOLY_CHANNEL_MANAGER" && "Channel Manager"}
                {mod === "ONLINE_CATALOG" && "Catalogo Web"}
                {mod === "ADVANCED_ANALYTICS" && "Analytics"}
              </span>
            ))}
          </div>

          {/* Navigazione Tab & Operatore */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("pos")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "pos"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Cassa POS
              </button>
              <button
                onClick={() => setActiveTab("sales")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "sales"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Registro Vendite ({salesList.length})
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Cassa 01</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Statistiche Rapide di Cassa (KPI Cards) */}
      <section className="max-w-7xl mx-auto w-full px-5 pt-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Incasso Registrato</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Scontrini Emessi</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.salesCount}
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Scontrino Medio</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.averageTicket)}
              </p>
            </div>
          </div>

          <div className="taaaac-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Punti Loyalty Assegnati</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.totalPoints} pt
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contenuto Principale: Cassa POS o Registro Vendite */}
      <main className="max-w-7xl mx-auto w-full px-5 py-4 flex-1">
        {activeTab === "pos" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Colonna Sinistra / Centrale: Griglia Prodotti & Filtri (8/12) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              {/* Barra Ricerca & Scanner Barcode */}
              <div className="taaaac-card p-3 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 ml-1" />
                <input
                  type="text"
                  placeholder="Cerca per nome, SKU o scansiona codice a barre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Barra Categorie (Touch Filter) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryId("ALL")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    selectedCategoryId === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Tutti ({products.length})
                </button>
                {initialCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                      selectedCategoryId === cat.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
                    }`}
                  >
                    {renderCategoryIcon(cat.icon)}
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Griglia Card Prodotti Touch */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredProducts.map((product) => {
                  const inCartQty =
                    cart.find((item) => item.id === product.id)?.quantity || 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group taaaac-card p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98] relative"
                    >
                      {inCartQty > 0 && (
                        <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                          {inCartQty}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-600 font-mono mb-1">
                          <span>{product.sku}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${
                              product.stockQuantity > 5
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            Qta: {product.stockQuantity}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {product.description || product.category.name}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full taaaac-card p-8 text-center text-slate-500">
                    Nessun prodotto trovato per la ricerca &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            </div>

            {/* Colonna Destra: Scontrino Corrente & Cassa (5/12) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sticky top-20">
              <div className="taaaac-card p-5 flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
                {/* Intestazione Scontrino */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Scontrino Corrente
                    </h3>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Svuota
                    </button>
                  )}
                </div>

                {/* Selettore Cliente & Fidelity Card */}
                <div className="py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Cliente / Fidelity Card
                    </label>
                    {selectedCustomer && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Tier {selectedCustomer.tier} (
                        {selectedCustomer.fidelityPoints} pt)
                      </span>
                    )}
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-400"
                    value={selectedCustomer ? selectedCustomer.id : ""}
                    onChange={(e) => {
                      const cust = initialCustomers.find(
                        (c) => c.id === e.target.value
                      );
                      setSelectedCustomer(cust || null);
                    }}
                  >
                    <option value="">Cliente Anonimo (Nessuna carta)</option>
                    {initialCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.firstName} {cust.lastName} ({cust.fidelityCardNumber} - {cust.tier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Elenco Righe Scontrino (Scrollabile) */}
                <div className="flex-1 overflow-y-auto py-2.5 space-y-2.5 pr-1">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <ShoppingBag className="w-10 h-10 mb-2 stroke-[1.2]" />
                      <p className="text-sm font-medium text-slate-600">
                        Carrello vuoto
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Tocca i prodotti a sinistra per aggiungerli allo scontrino
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-xs text-slate-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-slate-900 w-16 text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </span>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Riepilogo Totali */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Imponibile</span>
                    <span>{formatCurrency(subtotal - totalVat)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (inclusa)</span>
                    <span>{formatCurrency(totalVat)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Sconto Loyalty ({discountRate * 100}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {selectedCustomer && pointsToEarn > 0 && (
                    <div className="flex justify-between text-purple-600 font-medium">
                      <span>Punti Fedeltà Guadagnati</span>
                      <span>+{pointsToEarn} pt</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">
                      Totale Da Pagare
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Pulsanti Rapidi di Pagamento & Emissione */}
                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={() => handleCheckout("CONTANTI")}
                    className="taaaac-btn-secondary py-3 flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Contanti
                  </button>

                  <button
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={() => handleCheckout("POS_CARTA")}
                    className="taaaac-btn-accent py-3 flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4" />
                    Carta POS
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 4. Tab Registro Vendite Recenti */
          <div className="taaaac-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registro Vendite & Scontrini
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Archivio delle ultime transazioni registrate su questo terminale
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                Totale: {salesList.length} transazioni
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Numero</th>
                    <th className="p-4">Data & Ora</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Metodo</th>
                    <th className="p-4">Punti Loyalty</th>
                    <th className="p-4 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesList.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {sale.saleNumber}
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {sale.customer
                          ? `${sale.customer.firstName} ${sale.customer.lastName}`
                          : "Cliente Occasionale"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                          {sale.paymentMethod === "CONTANTI" ? (
                            <Banknote className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <CreditCard className="w-3 h-3 text-blue-600" />
                          )}
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4">
                        {sale.pointsEarned > 0 ? (
                          <span className="text-purple-700 font-semibold">
                            +{sale.pointsEarned} pt
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 5. Modale Conferma Scontrino Emesso */}
      {isCheckingOut && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Scontrino Emesso con Successo!
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Transazione registrata nel database isolato tenant e sincronizzata
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Numero Documento:</span>
                <span className="font-mono font-bold text-slate-900">
                  {completedSale.saleNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metodo di Pagamento:</span>
                <span className="font-semibold text-slate-900">
                  {completedSale.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Importo Totale:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(completedSale.totalAmount)}
                </span>
              </div>
              {completedSale.pointsEarned > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold pt-1 border-t border-slate-200/60">
                  <span>Punti Fedeltà Accreditati:</span>
                  <span>+{completedSale.pointsEarned} pt</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setIsCheckingOut(false);
                  setCompletedSale(null);
                }}
                className="taaaac-btn-primary w-full py-3 text-xs"
              >
                Nuova Vendita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
