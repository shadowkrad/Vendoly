"use client";

import React, { useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Info, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface PriceAdvisorProps {
  category: string;
  brand?: string | null;
  condition: string;
  basePrice: number;
  onPriceChange?: (channel: string, price: number) => void;
}

const CHANNEL_FEES = {
  SUBITO: { percent: 3, fixedFee: 0, shippingCost: 5.90, label: '~3% TuttoSubito', color: 'text-amber-600', bg: 'bg-amber-100' },
  VINTED: { percent: 0, fixedFee: 0, shippingCost: 0, label: 'Gratis (buyer paga)', color: 'text-cyan-600', bg: 'bg-cyan-100' },
  EBAY: { percent: 13, fixedFee: 0.35, shippingCost: 6.90, label: '~13% + €0.35', color: 'text-blue-600', bg: 'bg-blue-100' },
  FACEBOOK: { percent: 0, fixedFee: 0, shippingCost: 0, label: 'Gratis (ritiro locale)', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  NEGOZIO: { percent: 0, fixedFee: 0, shippingCost: 0, label: 'Nessuna commissione', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const CATEGORY_PRICES: Record<string, { min: number; max: number }> = {
  "Abbigliamento Vintage": { min: 20, max: 150 },
  "Scarpe & Sneakers": { min: 40, max: 250 },
  "Borse & Zaini": { min: 30, max: 300 },
  "Accessori": { min: 10, max: 100 },
  "Orologi & Gioielli": { min: 50, max: 500 },
  "Elettronica & Audio": { min: 20, max: 400 },
  "Casa & Benessere": { min: 15, max: 120 },
  "Sport & Outdoor": { min: 20, max: 200 },
  "Abbigliamento": { min: 15, max: 100 },
};

export default function PriceAdvisor({
  category,
  brand,
  condition,
  basePrice,
  onPriceChange,
}: PriceAdvisorProps) {
  const range = CATEGORY_PRICES[category] || { min: 10, max: 100 };
  
  const percentage = useMemo(() => {
    if (basePrice <= range.min) return 0;
    if (basePrice >= range.max) return 100;
    return ((basePrice - range.min) / (range.max - range.min)) * 100;
  }, [basePrice, range]);

  return (
    <div className="taaaac-card flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-slate-700" />
        <h3 className="font-semibold text-lg">Analisi Prezzo & Profitti</h3>
      </div>

      {/* Sezione A - Range */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-slate-600">Range Prezzo Suggerito</h4>
        <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden flex items-center">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 w-full opacity-50" />
          <div 
            className="absolute top-0 bottom-0 bg-slate-800 w-2 rounded-full transform -translate-x-1 shadow-md"
            style={{ left: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Min: {formatCurrency(range.min)}</span>
          <span className="text-slate-800 font-bold text-sm">Tu: {formatCurrency(basePrice)}</span>
          <span>Max: {formatCurrency(range.max)}</span>
        </div>
      </div>

      {/* Sezione B - Tabella Canali */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-slate-600">Calcolatore Profitto Netto</h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Canale</th>
                <th className="px-4 py-2 font-medium">Prezzo</th>
                <th className="px-4 py-2 font-medium">Commissioni</th>
                <th className="px-4 py-2 font-medium">Spedizione</th>
                <th className="px-4 py-2 font-medium text-right">Netto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(CHANNEL_FEES).map(([key, fee]) => {
                const commission = (basePrice * (fee.percent / 100)) + fee.fixedFee;
                const net = basePrice - commission - fee.shippingCost;
                
                return (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700 capitalize">{key.toLowerCase()}</td>
                    <td className="px-4 py-2 text-slate-600">{formatCurrency(basePrice)}</td>
                    <td className="px-4 py-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", fee.bg, fee.color)}>
                        {fee.label}
                      </span>
                      {commission > 0 && <span className="ml-2 text-rose-600 text-xs">-{formatCurrency(commission)}</span>}
                    </td>
                    <td className="px-4 py-2 text-rose-600 text-xs">
                      {fee.shippingCost > 0 ? `-${formatCurrency(fee.shippingCost)}` : '€ 0,00'}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-600">
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sezione C - Suggerimenti */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-700 font-medium mb-1">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Suggerimenti per la vendita</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-2">
          {percentage > 80 && (
            <li className="flex items-start gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
              Il prezzo è nella fascia alta per questa categoria. Assicurati di evidenziare pregi o rarità nella descrizione.
            </li>
          )}
          {percentage < 20 && (
            <li className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
              Prezzo molto competitivo! Potresti vendere velocemente, specialmente su Vinted o Subito.
            </li>
          )}
          <li className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
            Vendere in negozio fisico o su Facebook offre il margine migliore grazie a 0 commissioni e no spedizione a tuo carico.
          </li>
        </ul>
      </div>
    </div>
  );
}
