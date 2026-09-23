"use client";

import React, { useState, useMemo } from "react";
import { MockProduct } from "@/lib/mock-store";
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Globe,
  Share2,
  Lock,
} from "lucide-react";
import ProductEditor from "./ProductEditor";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  toggleProductReservation,
} from "@/lib/store-actions";
import { formatCurrency } from "@/lib/utils";

interface ProductsCatalogClientProps {
  initialProducts: MockProduct[];
  storeName?: string;
}

export default function ProductsCatalogClient({
  initialProducts,
  storeName = "Vendoly Store",
}: ProductsCatalogClientProps) {
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCondition, setSelectedCondition] = useState<string>("ALL");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Stato Modale ProductEditor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MockProduct | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Lista categorie uniche per il filtro
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  // Filtro prodotti
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || p.category === selectedCategory;
      const matchesCond =
        selectedCondition === "ALL" || p.condition === selectedCondition;
      const matchesStock = !filterLowStock || p.stock <= 1;

      return matchesSearch && matchesCat && matchesCond && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, selectedCondition, filterLowStock]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (p: MockProduct) => {
    setEditingProduct(p);
    setIsEditorOpen(true);
  };

  const handleSaveProduct = async (saved: MockProduct) => {
    setIsEditorOpen(false);

    const exists = products.some((p) => p.id === saved.id);

    if (exists) {
      // Aggiornamento
      setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      showFeedback(`Articolo "${saved.title}" aggiornato con successo`);
      await updateProduct(saved.id, {
        title: saved.title,
        description: saved.description,
        price: saved.price,
        comparePrice: saved.comparePrice,
        stock: saved.stock,
        category: saved.category,
        images: saved.images,
        sku: saved.sku,
        condition: saved.condition,
        brand: saved.brand,
        size: saved.size,
        color: saved.color,
        material: saved.material,
        weight: saved.weight,
        conditionNotes: saved.conditionNotes,
        tags: saved.tags,
        syncFacebook: saved.syncFacebook,
        syncSubito: saved.syncSubito,
        syncEbay: saved.syncEbay,
        syncVinted: saved.syncVinted,
      });
    } else {
      // Creazione
      setProducts((prev) => [saved, ...prev]);
      showFeedback(`Nuovo articolo "${saved.title}" creato e pronto per la pubblicazione`);
      await createProduct({
        title: saved.title,
        description: saved.description,
        price: saved.price,
        comparePrice: saved.comparePrice,
        stock: saved.stock,
        category: saved.category,
        images: saved.images,
        sku: saved.sku,
        condition: saved.condition,
        brand: saved.brand,
        size: saved.size,
        color: saved.color,
        material: saved.material,
        weight: saved.weight,
        conditionNotes: saved.conditionNotes,
        tags: saved.tags,
        syncFacebook: saved.syncFacebook,
        syncSubito: saved.syncSubito,
        syncEbay: saved.syncEbay,
        syncVinted: saved.syncVinted,
      });
    }
  };

  const handleDeleteProduct = async (productId: string, title: string) => {
    if (!confirm(`Sei sicuro di voler eliminare l'articolo "${title}"?`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showFeedback(`Articolo "${title}" rimosso dal catalogo`);
    await deleteProduct(productId);
  };

  const handleStockQuickChange = async (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    const target = products.find((p) => p.id === productId);
    if (target) {
      await updateProductStock(productId, Math.max(0, target.stock + delta));
    }
  };

  const parseFirstImage = (imagesStr: string): string => {
    try {
      const arr = JSON.parse(imagesStr);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : "";
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-600" />
            Catalogo Prodotti & Gestione Centrale
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inserisci un articolo una sola volta: Vendoly adatta descrizioni, tag e prezzi per ogni marketplace.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="taaaac-btn-accent text-xs sm:text-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto px-4 py-2.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Articolo Multi-Canale</span>
        </button>
      </div>

      {/* Alert Notifica Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Barra Ricerca & Filtri */}
      <div className="taaaac-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per titolo, SKU, brand o categoria..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Filtro Condizione */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tutte le condizioni</option>
            <option value="NUOVO">Nuovo</option>
            <option value="COME_NUOVO">Come Nuovo</option>
            <option value="OTTIMO">Ottimo</option>
            <option value="BUONO">Buono</option>
          </select>

          {/* Toggle Pezzo Unico / Scorte Basse */}
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterLowStock
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Pezzi Unici ({products.filter((p) => p.stock === 1).length})</span>
          </button>
        </div>
      </div>

      {/* Griglia Card Articoli */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const firstImg = parseFirstImage(p.images);
          const isLowStock = p.stock === 1;

          return (
            <div
              key={p.id}
              className="taaaac-card flex flex-col justify-between hover:border-emerald-300 transition-all group overflow-hidden"
            >
              <div>
                {/* Immagine Copertina + Badge */}
                <div className="relative w-full h-44 bg-slate-100 rounded-xl overflow-hidden mb-3 border border-slate-100">
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Package className="w-8 h-8" />
                      <span className="text-[10px]">Nessuna immagine</span>
                    </div>
                  )}

                  {/* Badge Condizione in overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-slate-800 shadow-xs border border-slate-200/80">
                      {p.condition}
                    </span>
                    {p.isReserved && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-xs flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Riservato
                      </span>
                    )}
                  </div>

                  {/* Badge Prezzo in overlay */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white font-black text-sm shadow-xs backdrop-blur-xs">
                    {formatCurrency(p.price)}
                    {p.comparePrice && p.comparePrice > p.price && (
                      <span className="text-[10px] line-through text-slate-400 font-normal ml-1">
                        €{p.comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Prodotto */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono font-semibold">{p.sku || "NO-SKU"}</span>
                    <span>{p.category}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {p.title}
                  </h3>

                  {p.brand && (
                    <p className="text-xs text-slate-500 font-medium">
                      Brand: <b className="text-slate-700">{p.brand}</b>
                      {p.size && <> • Taglia: <b className="text-slate-700">{p.size}</b></>}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                    {p.description}
                  </p>
                </div>

                {/* Badge Marketplace Connessi */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sync:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      p.syncSubito
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-50 text-slate-400 border-slate-200 opacity-40"
                    }`}
                  >
                    Subito
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      p.syncVinted
                        ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                        : "bg-slate-50 text-slate-400 border-slate-200 opacity-40"
                    }`}
                  >
                    Vinted
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      p.syncEbay
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-50 text-slate-400 border-slate-200 opacity-40"
                    }`}
                  >
                    eBay
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      p.syncFacebook
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-slate-50 text-slate-400 border-slate-200 opacity-40"
                    }`}
                  >
                    FB
                  </span>
                </div>
              </div>

              {/* Bottom: Gestione Giacenza + Azioni Modifica / Elimina */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Giacenza Rapida */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStockQuickChange(p.id, -1)}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    -
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
                    onClick={() => handleStockQuickChange(p.id, 1)}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Pulsanti Modifica / Cancella */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    title="Modifica articolo e annunci marketplace"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id, p.title)}
                    title="Elimina articolo"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="taaaac-card p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700">Nessun articolo trovato</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nessun articolo corrisponde ai filtri di ricerca selezionati.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedCondition("ALL");
              setFilterLowStock(false);
            }}
            className="taaaac-btn-primary text-xs py-2 px-4 cursor-pointer"
          >
            Azzera Filtri
          </button>
        </div>
      )}

      {/* Modale ProductEditor Completo */}
      {isEditorOpen && (
        <ProductEditor
          product={editingProduct}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveProduct}
          storeName={storeName}
        />
      )}
    </div>
  );
}
