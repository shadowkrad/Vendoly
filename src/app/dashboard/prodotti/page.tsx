import React from "react";
import { getStoreProducts } from "@/lib/store-actions";
import { Package, AlertTriangle, Plus, Search, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProdottiPage() {
  const products = await getStoreProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-600" />
            Catalogo Prodotti & Magazzino
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci articoli, prezzi, giacenze e sincronizzazione con i marketplace.
          </p>
        </div>

        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nuovo Prodotto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {p.category}
                </span>
                <h3 className="font-bold text-slate-900 mt-1">{p.title}</h3>
              </div>
              <span className="text-base font-black text-emerald-600 shrink-0">
                € {p.price.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Giacenza:{" "}
                <b className={p.stock <= 3 ? "text-amber-600" : "text-slate-900"}>
                  {p.stock} pz
                </b>
              </span>
              {p.stock <= 3 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Scorte Basse
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
