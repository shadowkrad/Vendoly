import React from "react";
import { getStoreOrders } from "@/lib/store-actions";
import { Truck, CheckCircle2, Clock, MapPin, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdiniPage() {
  const orders = await getStoreOrders();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Truck className="w-6 h-6 text-emerald-600" />
          Ordini & Spedizioni
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitoraggio vendite online, evasione colli e tracciamento spedizioni corriere.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">Nessun ordine presente</p>
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700">#{o.id}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    o.status === "SPEDITO" || o.status === "CONSEGNATO"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : o.status === "IN_LAVORAZIONE"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">{o.customerName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {o.shippingAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {o.items.length} {o.items.length === 1 ? "articolo" : "articoli"}
                </span>
                <span className="font-black text-emerald-600">
                  € {o.totalAmount.toFixed(2)}
                </span>
              </div>

              {o.trackingCode && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center gap-1.5 font-mono">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Tracking: {o.trackingCode}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
