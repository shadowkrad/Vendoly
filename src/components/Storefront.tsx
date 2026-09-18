"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
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
} from "lucide-react";
import { MockProduct } from "@/lib/mock-store";
import { createOrder } from "@/lib/store-actions";
import { TenantConfigResponse } from "@/types/taaaac";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  product: MockProduct;
  quantity: number;
}

interface StorefrontProps {
  initialProducts: MockProduct[];
  tenantConfig: TenantConfigResponse;
}

export default function Storefront({ initialProducts, tenantConfig }: StorefrontProps) {
  const [products] = useState<MockProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Carrello
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Scheda Dettaglio Prodotto
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  // Form Checkout
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"SPEDIZIONE" | "RITIRO_IN_NEGOZIO">("SPEDIZIONE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Estrazione categorie uniche
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtraggio catalogo
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Totali Carrello
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (product: MockProduct, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + qty);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, qty) }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Giacenza massima disponibile: ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Helper parsing immagini
  const getProductImage = (product: MockProduct) => {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {
      // fallback
    }
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
  };

  // Ordina su WhatsApp (Pulsante 1-Click per massima conversione)
  const handleOrderWhatsApp = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      alert("Inserisci almeno il tuo Nome e Numero di Telefono per completare la richiesta su WhatsApp");
      return;
    }

    const storePhone = tenantConfig.contact?.phone?.replace(/\D/g, "") || "390289015678";
    const itemsList = cart
      .map(
        (it) =>
          `• ${it.quantity}x ${it.product.title} - ${formatCurrency(it.product.price * it.quantity)}`
      )
      .join("\n");

    const message = `🛍️ *NUOVO ORDINE DA VENDOLY STORE*
----------------------------------
👤 *Cliente*: ${customerName}
📞 *Telefono*: ${customerPhone}
${customerEmail ? `📧 *Email*: ${customerEmail}\n` : ""}${
      fulfillmentType === "SPEDIZIONE"
        ? `🚚 *Consegna*: Spedizione a Domicilio\n📍 *Indirizzo*: ${shippingAddress || "Da concordare"}`
        : "🏪 *Consegna*: Ritiro in Negozio (Click & Collect)"
    }

🛒 *ARTICOLI ORDINATI*:
${itemsList}

💰 *TOTALE*: ${formatCurrency(cartTotal)}
----------------------------------
Vorrei confermare l'ordine e ricevere dettagli per il pagamento e la spedizione. Grazie!`;

    const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Conferma Ordine Online
  const handleOnlineCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      alert("Compila il nome e il recapito telefonico per confermare l'ordine");
      return;
    }
    if (fulfillmentType === "SPEDIZIONE" && !shippingAddress) {
      alert("Inserisci l'indirizzo di spedizione per la consegna");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrder({
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        shippingAddress: fulfillmentType === "SPEDIZIONE" ? shippingAddress : "Ritiro in negozio",
        fulfillmentType,
        channel: "SITO_WEB",
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: it.product.price,
        })),
      });

      if (res.success && res.order) {
        setCompletedOrder(res.order);
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (err) {
      console.error("Errore ordine:", err);
      alert("Si è verificato un errore durante la registrazione dell'ordine");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Spedizioni rapide in 24/48h o Ritiro Gratuito in Negozio</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>Assistenza: {tenantConfig.contact?.phone || "+39 02 8901 5678"}</span>
          </div>
        </div>
      </div>

      {/* 2. Header Principale Vetrina */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Store className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                {tenantConfig.theme.brandName}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                Vetrina Ufficiale • Powered by Taaaac
              </span>
            </div>
          </div>

          {/* Barra Ricerca Veloce */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per articolo, marca o categoria..."
                className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-300 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Pulsante Carrello */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="taaaac-btn-primary py-2.5 px-4 text-xs flex items-center gap-2 relative shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            <span className="font-bold hidden sm:inline">Carrello</span>
            <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {cartItemsCount}
            </span>
          </button>
        </div>
      </header>

      {/* 3. Hero Promo Banner */}
      <section className="bg-linear-to-b from-white to-slate-50 border-b border-slate-200/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Nuovi Arrivi & Occasioni Selezionate
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              I migliori capi, accessori e pezzi unici per te.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Esplora il catalogo del nostro negozio. Puoi acquistare comodamente online, ritirare senza attesa al banco o ordinare direttamente su WhatsApp!
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <div className="flex-1 sm:w-48 taaaac-card p-4 flex items-center gap-3 bg-white/80">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Spedizioni 24/48h</p>
                <p className="text-[11px] text-slate-500">Corriere Espresso</p>
              </div>
            </div>

            <div className="flex-1 sm:w-48 taaaac-card p-4 flex items-center gap-3 bg-white/80">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Click & Collect</p>
                <p className="text-[11px] text-slate-500">Ritiro Gratuito</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Filtro Categorie Pillole */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100"
            }`}
          >
            Tutti i Prodotti ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Griglia Prodotti Vetrina */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const hasDiscount = product.comparePrice && product.comparePrice > product.price;
            const discountPercent = hasDiscount
              ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="taaaac-card p-4 flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Badge Sconto & Condizione */}
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5 items-start">
                  {hasDiscount && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      -{discountPercent}%
                    </span>
                  )}
                  <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {product.condition === "NUOVO"
                      ? "NUOVO"
                      : product.condition === "USATO_COME_NUOVO"
                      ? "COME NUOVO"
                      : "OTTIMO STATO"}
                  </span>
                </div>

                {/* Immagine con click per dettaglio */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer relative mb-3 group-hover:opacity-95 transition-opacity"
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.stock <= 3 && product.stock > 0 && (
                    <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Solo {product.stock} rimasti!
                    </div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider">
                      Esaurito
                    </div>
                  )}
                </div>

                {/* Info Prodotto */}
                <div>
                  <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
                    {product.category}
                  </span>
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-emerald-600 cursor-pointer leading-tight mb-1.5"
                  >
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {product.description}
                  </p>
                </div>

                {/* Prezzo e Azioni */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-600 line-through font-medium">
                          {formatCurrency(product.comparePrice!)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                    className="taaaac-btn-primary py-2 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="taaaac-card p-12 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">Nessun articolo trovato</h3>
            <p className="text-xs text-slate-400 mt-1">
              Prova a cambiare termine di ricerca o rimuovi il filtro categoria.
            </p>
          </div>
        )}
      </main>

      {/* 6. Scheda Dettaglio Prodotto (Modal) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedProduct.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={getProductImage(selectedProduct)}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(selectedProduct.price)}
                    </span>
                    {selectedProduct.comparePrice && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(selectedProduct.comparePrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Condizione: {selectedProduct.condition}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        selectedProduct.stock > 0
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-rose-50 text-rose-800"
                      }`}
                    >
                      {selectedProduct.stock > 0
                        ? `Disponibili: ${selectedProduct.stock} pz`
                        : "Esaurito"}
                    </span>
                    {selectedProduct.sku && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-mono">
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="taaaac-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Aggiungi al Carrello
                  </button>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      handleOrderWhatsApp();
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs border border-emerald-500 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    Ordina Subito su WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Drawer Carrello & Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Il tuo Carrello ({cartItemsCount})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista Articoli Carrello */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-700">Il carrello è vuoto</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Aggiungi qualche capo o accessorio dalla vetrina
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <img
                      src={getProductImage(item.product)}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {item.product.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(item.product.price)} cad.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Dati Cliente e Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {/* Selezione Metodo di Consegna */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Metodo di Ricezione:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFulfillmentType("SPEDIZIONE")}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        fulfillmentType === "SPEDIZIONE"
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Spedizione
                    </button>
                    <button
                      onClick={() => setFulfillmentType("RITIRO_IN_NEGOZIO")}
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        fulfillmentType === "RITIRO_IN_NEGOZIO"
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ritiro in Negozio
                    </button>
                  </div>
                </div>

                {/* Form Campi Cliente */}
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome e Cognome *"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Cellulare (per WhatsApp / Corriere) *"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
                  />
                  {fulfillmentType === "SPEDIZIONE" && (
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Indirizzo completo di spedizione, Città e CAP *"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400"
                    />
                  )}
                </div>

                {/* Totale */}
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Totale Ordine</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                {/* Pulsanti Azione */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleOrderWhatsApp}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Ordina Subito su WhatsApp
                  </button>

                  <button
                    disabled={isSubmitting}
                    onClick={handleOnlineCheckout}
                    className="taaaac-btn-secondary w-full py-2.5 text-xs text-slate-700 font-semibold"
                  >
                    Conferma Ordine Online
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Modale Conferma Ordine Ricevuto */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              Ordine Confermato con Successo!
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Abbiamo registrato la tua richiesta. Ti contatteremo a breve via SMS o WhatsApp per la conferma.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Numero Ordine:</span>
                <span className="font-mono font-bold text-slate-900">
                  {completedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold text-slate-900">
                  {completedOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalità Consegna:</span>
                <span className="font-semibold text-slate-900">
                  {completedOrder.fulfillmentType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Importo Totale:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(completedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setCompletedOrder(null)}
                className="taaaac-btn-primary w-full py-3 text-xs"
              >
                Torna allo Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-8 px-4 sm:px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">
              {tenantConfig.theme.brandName}
            </span>
            <span>• Modulo E-Commerce & Marketplace Vendoly</span>
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
