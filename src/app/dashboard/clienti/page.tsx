import React from "react";
import { getStoreOrders } from "@/lib/store-actions";
import { Users, Mail, MapPin, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientiPage() {
  const orders = await getStoreOrders();

  // Deduplicazione clienti
  const clientsMap = new Map<string, { name: string; email: string; address: string; ordersCount: number; totalSpent: number }>();
  for (const o of orders) {
    const email = o.customerEmail || `${o.customerName.toLowerCase().replace(/\s+/g, ".")}@cliente.taaaac.eu`;
    const key = email.toLowerCase().trim();
    const address = o.shippingAddress || "Ritiro al banco in negozio";

    if (!clientsMap.has(key)) {
      clientsMap.set(key, {
        name: o.customerName,
        email,
        address,
        ordersCount: 1,
        totalSpent: o.totalAmount,
      });
    } else {
      const existing = clientsMap.get(key)!;
      existing.ordersCount += 1;
      existing.totalSpent += o.totalAmount;
    }
  }

  const clients = Array.from(clientsMap.values());

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Users className="w-6 h-6 text-emerald-600" />
          Clienti & Storico Acquisti
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Anagrafica acquirenti, volume d&apos;affari generato e fedeltà al brand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">Nessun cliente registrato</p>
          </div>
        ) : (
          clients.map((c, idx) => (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{c.name}</h3>
                <span className="text-xs font-bold text-emerald-600">
                  € {c.totalSpent.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {c.email}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {c.address}
                </p>
                <p className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  {c.ordersCount} {c.ordersCount === 1 ? "ordine completato" : "ordini completati"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
