"use client";

import React, { useState, useEffect } from "react";
import { Store, CheckCircle2, DollarSign, Search, Package, Zap, ShieldCheck } from "lucide-react";
import { MockProduct } from "@/lib/mock-store";
import { getStoreProducts, recordMarketplaceSale } from "@/lib/store-actions";
import { formatCurrency } from "@/lib/utils";

export default function RegistraVenditaPage() {
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [channel, setChannel] = useState<"NEGOZIO" | "SUBITO" | "VINTED" | "EBAY" | "FACEBOOK">("VINTED");
  const [salePrice, setSalePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    getStoreProducts().then((prods) => {
      setProducts(prods);
      const firstAvailable = prods.find((p) => p.stock > 0);
      if (firstAvailable) {
        setSelectedProduct(firstAvailable);
        setSalePrice(firstAvailable.price);
      }
    });
  }, []);

  const handleSelectProduct = (p: MockProduct) => {
    setSelectedProduct(p);
    setSalePrice(p.price);
  };

  const handleRecordSale = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    try {
      const res = await recordMarketplaceSale({
        productId: selectedProduct.id,
        channel,
        quantity: 1,
        salePrice: Number(salePrice) || selectedProduct.price,
      });

      if (res.success) {
        setSuccessMessage(
          `Vendita su ${channel} registrata con successo per "${selectedProduct.title}"! Giacenza scalata e annunci sincronizzati.`
        );
        // Aggiorna lo stato locale dei prodotti
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? { ...p, stock: Math.max(0, p.stock - 1) }
              : p
          )
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Store className="w-6 h-6 text-emerald-600" />
          Registra Vendita Rapida &amp; Scarico Scorte
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hai concluso una vendita al banco o su un marketplace? Registrala qui per scalare istantaneamente la giacenza e disattivare gli annunci concorrenti (Anti-Doppia Vendita).
        </p>
      </div>

      {/* Banner Notifica Successo */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonna Sinistra: Ricerca & Selezione Articolo Venduto */}
        <div className="lg:col-span-7 space-y-4">
          <div className="taaaac-card p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>1. Seleziona l&apos;Articolo Venduto</span>
              <span className="text-xs font-normal text-slate-400">
                {filteredProducts.length} disponibili a magazzino
              </span>
            </h3>

            {/* Ricerca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per titolo, SKU o codice articolo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300"
              />
            </div>

            {/* Lista Articoli */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-emerald-50 border border-emerald-300 shadow-xs"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-emerald-950" : "text-slate-900"}`}>
                          {p.title}
                        </p>
                        {p.stock === 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Pezzo Unico
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.sku || "NO-SKU"} • {p.category}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-900">{formatCurrency(p.price)}</p>
                      <p className="text-[10px] text-slate-400">Giacenza: {p.stock} pz</p>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nessun articolo con giacenza disponibile trovato.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonna Destra: Canale di Vendita & Conferma Scarico */}
        <div className="lg:col-span-5 space-y-4">
          <div className="taaaac-card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              2. Canale di Vendita &amp; Incasso
            </h3>

            {selectedProduct ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Articolo Selezionato:</span>
                <p className="font-bold text-slate-900">{selectedProduct.title}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  SKU: {selectedProduct.sku || "-"} • Prezzo listino: {formatCurrency(selectedProduct.price)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Seleziona prima un articolo dalla lista.</p>
            )}

            {/* Scelta Canale */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Su quale canale hai venduto?
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "VINTED", label: "Vinted", badge: "0% Fee" },
                  { id: "SUBITO", label: "Subito.it", badge: "TuttoSubito" },
                  { id: "EBAY", label: "eBay", badge: "~13%" },
                  { id: "FACEBOOK", label: "Facebook", badge: "Social" },
                  { id: "NEGOZIO", label: "Al Banco", badge: "Diretta" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannel(ch.id as any)}
                    className={`p-2.5 rounded-xl border font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                      channel === ch.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{ch.label}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        channel === ch.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {ch.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prezzo Effettivo di Vendita */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prezzo Effettivo di Chiusura (€)
              </label>
              <input
                type="number"
                step="0.5"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-slate-300"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Puoi modificare il prezzo se hai applicato uno sconto o concordato un prezzo speciale.
              </span>
            </div>

            {/* Protezione Anti-Doppia Vendita */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protezione Anti-Doppia Vendita</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Al click su conferma, la giacenza verrà ridotta di 1 pz e gli annunci su tutti gli altri marketplace verranno disattivati.
              </p>
            </div>

            {/* Pulsante di Conferma */}
            <button
              onClick={handleRecordSale}
              disabled={!selectedProduct || selectedProduct.stock <= 0 || loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? "Salvataggio..." : "Registra Vendita & Scarica Giacenza"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
