"use client";

import React, { useState } from "react";
import { Store, Plus, Trash2, CheckCircle2, CreditCard, Banknote } from "lucide-react";

export default function CassaPosPage() {
  const [cart, setCart] = useState<{ name: string; price: number; qty: number }[]>([
    { name: "T-Shirt Basic Cotone Bio", price: 24.9, qty: 1 },
  ]);
  const [completed, setCompleted] = useState(false);

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleCheckout = () => {
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      setCart([]);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Store className="w-6 h-6 text-emerald-600" />
          Cassa Veloce POS & Vendita al Banco
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Punto cassa per emissione scontrini, vendite dirette e scarico immediato giacenze di magazzino.
        </p>
      </div>

      {completed && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Vendita registrata con successo! Scorte aggiornate in tempo reale.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Articoli nel Carrello Banco</h3>
            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nessun articolo al momento nel carrello.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">€ {item.price.toFixed(2)} cad.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">Q.tà: {item.qty}</span>
                      <span className="text-xs font-black text-emerald-600">
                        € {(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 text-sm">Riepilogo Incasso</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Totale Parziale</span>
              <span>€ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (22% scorporata)</span>
              <span>€ {(total * 0.22).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Totale da Pagare</span>
              <span className="text-emerald-600">€ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pagamento POS Carta
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Banknote className="w-4 h-4" />
              Pagamento Contanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
