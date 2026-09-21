import React from "react";
import { Globe, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";

export default function CanaliMarketplacePage() {
  const channels = [
    {
      name: "Subito.it",
      type: "Marketplace Second-hand / Local",
      status: "COLLEGATO",
      syncedItems: 24,
      lastSync: "15 min fa",
    },
    {
      name: "Vinted",
      type: "Marketplace Moda & Accessori",
      status: "COLLEGATO",
      syncedItems: 18,
      lastSync: "30 min fa",
    },
    {
      name: "eBay Italia",
      type: "E-Commerce Globale",
      status: "IN_ATTESA",
      syncedItems: 0,
      lastSync: "Mai",
    },
    {
      name: "Shopify / Meta Shop",
      type: "Social Commerce",
      status: "COLLEGATO",
      syncedItems: 24,
      lastSync: "1 ora fa",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-emerald-600" />
            Canali di Vendita & Marketplace Sync
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sincronizzazione automatica 1-Click del catalogo verso Subito, Vinted, eBay e Meta.
          </p>
        </div>

        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          Sincronizza Tutti i Canali
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((ch, idx) => (
          <div
            key={idx}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{ch.name}</h3>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  ch.status === "COLLEGATO"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {ch.status}
              </span>
            </div>

            <p className="text-xs text-slate-500">{ch.type}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Articoli sincronizzati: <b>{ch.syncedItems}</b></span>
              <span className="text-slate-400">Ultimo sync: {ch.lastSync}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
