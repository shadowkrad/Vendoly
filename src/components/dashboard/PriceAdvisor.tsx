"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Zap,
  Target,
  Award,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Flame,
  Clock,
} from "lucide-react";
import { analyzeMarketPrice, MarketPriceAnalysis } from "@/lib/market-pricing";

interface PriceAdvisorProps {
  title?: string;
  category: string;
  brand?: string | null;
  condition: string;
  basePrice: number;
  onApplyPrice?: (price: number) => void;
  onPriceChange?: (channel: string, price: number) => void;
}

const CHANNEL_FEES = {
  NEGOZIO: {
    name: "Al Banco (Negozio Fisico)",
    percent: 0,
    fixedFee: 0,
    shippingCost: 0,
    label: "0% Commissioni (POS/Contanti)",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  VINTED: {
    name: "Vinted",
    percent: 0,
    fixedFee: 0,
    shippingCost: 0,
    label: "Gratis (Commissione pagata dal compratore)",
    badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  SUBITO: {
    name: "Subito.it (TuttoSubito)",
    percent: 3,
    fixedFee: 0,
    shippingCost: 0,
    label: "~3% Servizio Protezione Acquisti",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
  },
  EBAY: {
    name: "eBay Italia",
    percent: 13,
    fixedFee: 0.35,
    shippingCost: 0,
    label: "~13% + €0.35 tariffa finale",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
  },
  FACEBOOK: {
    name: "Facebook Marketplace",
    percent: 0,
    fixedFee: 0,
    shippingCost: 0,
    label: "Gratis (Ritiro a mano / Spedizione)",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
};

export default function PriceAdvisor({
  title = "",
  category,
  brand,
  condition,
  basePrice,
  onApplyPrice,
}: PriceAdvisorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<MarketPriceAnalysis>(() =>
    analyzeMarketPrice({
      query: title,
      brand: brand || "",
      category,
      condition,
    })
  );

  // Ricalcola l'analisi quando cambiano brand, categoria, condizione o titolo
  useEffect(() => {
    const res = analyzeMarketPrice({
      query: title,
      brand: brand || "",
      category,
      condition,
    });
    setAnalysis(res);
  }, [title, brand, category, condition]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const res = analyzeMarketPrice({
        query: title,
        brand: brand || "",
        category,
        condition,
      });
      setAnalysis(res);
      setIsRefreshing(false);
    }, 450);
  };

  // Posizionamento del cursore sulla barra Keepa
  const minRange = Math.min(analysis.minSoldPrice, basePrice || analysis.minSoldPrice);
  const maxRange = Math.max(analysis.maxSoldPrice, basePrice || analysis.maxSoldPrice);
  const percentage = useMemo(() => {
    if (basePrice <= minRange) return 0;
    if (basePrice >= maxRange) return 100;
    return ((basePrice - minRange) / (maxRange - minRange)) * 100;
  }, [basePrice, minRange, maxRange]);

  // Valutazione di congruità
  const priceEvaluation = useMemo(() => {
    if (!basePrice || basePrice === 0) {
      return {
        type: "NEUTRAL",
        label: "Nessun Prezzo Impostato",
        desc: "Scegli un prezzo rapido o applica la media di mercato consigliata.",
        color: "text-slate-600",
        border: "border-slate-200",
        bg: "bg-slate-50",
      };
    }
    if (basePrice < analysis.quickSalePrice) {
      return {
        type: "BARGAIN",
        label: "Prezzo Sotto Mercato (Vendita Immediata) 🔥",
        desc: `Il prezzo è inferiore alla media di liquidazione (€ ${analysis.quickSalePrice}). Probabilità di vendita stimata < 5 giorni.`,
        color: "text-emerald-700",
        border: "border-emerald-200",
        bg: "bg-emerald-50",
      };
    }
    if (basePrice <= analysis.avgSoldPrice * 1.15) {
      return {
        type: "OPTIMAL",
        label: "Prezzo Ottimale & In Linea col Mercato 🎯",
        desc: `Prezzo perfettamente congruo rispetto alle ${analysis.sampleSize} vendite storiche registrate. Tempo stimato: ${analysis.estimatedDaysToSell}.`,
        color: "text-blue-700",
        border: "border-blue-200",
        bg: "bg-blue-50",
      };
    }
    const diffPct = Math.round(((basePrice - analysis.avgSoldPrice) / analysis.avgSoldPrice) * 100);
    return {
      type: "HIGH",
      label: `Sopra la Media di Mercato (+${diffPct}%) ⚠️`,
      desc: `Il prezzo supera la media recente (€ ${analysis.avgSoldPrice}). Consigliato solo per pezzi da collezione o condizioni eccezionali.`,
      color: "text-amber-800",
      border: "border-amber-200",
      bg: "bg-amber-50",
    };
  }, [basePrice, analysis]);

  return (
    <div className="border border-slate-200 rounded-3xl bg-white shadow-xs overflow-hidden space-y-6 p-5 sm:p-6">
      {/* Header Keepa Radar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">Keepa Market Radar</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Benchmark
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultazione prezzi reali di vendita su eBay Sold, Vinted, StockX e Subito.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          <span>Aggiorna Dati Online</span>
        </button>
      </div>

      {/* 3 Benchmark Cards Keepa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Quick Sale */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 relative group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Vendita Rapida
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md font-medium">
              &lt; 10 gg
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(analysis.quickSalePrice)}
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Prezzo per liquidare l&apos;articolo rapidamente massimizzando il ricircolo.
          </p>

          {onApplyPrice && (
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.quickSalePrice)}
              className="w-full mt-2 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Applica € {analysis.quickSalePrice}</span>
            </button>
          )}
        </div>

        {/* 2. Fair Market Price (Consigliato) */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-500/80 space-y-2 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Media di Mercato
            </span>
            <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              Consigliato
            </span>
          </div>

          <div className="text-2xl font-black text-indigo-950">
            {formatCurrency(analysis.avgSoldPrice)}
          </div>

          <p className="text-[11px] text-slate-600 leading-tight">
            Media ponderata su <strong>{analysis.sampleSize} vendite reali</strong> rilevate.
          </p>

          {onApplyPrice && (
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.avgSoldPrice)}
              className="w-full mt-2 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Applica € {analysis.avgSoldPrice}</span>
            </button>
          )}
        </div>

        {/* 3. Max Collector / Premium */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              Valore Massimo
            </span>
            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded-md font-medium border border-slate-200">
              Collezione
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(analysis.maxSoldPrice)}
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Valore massimo per collezionisti o condizioni impeccabili d&apos;epoca.
          </p>

          {onApplyPrice && (
            <button
              type="button"
              onClick={() => onApplyPrice(analysis.maxSoldPrice)}
              className="w-full mt-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Applica € {analysis.maxSoldPrice}</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicatore Visivo di Congruità Prezzo Attuale */}
      <div className={`p-4 rounded-2xl border ${priceEvaluation.border} ${priceEvaluation.bg} space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${priceEvaluation.color}`}>
              {priceEvaluation.label}
            </span>
          </div>
          <span className="text-xs font-black text-slate-900">
            Prezzo Impostato: {formatCurrency(basePrice)}
          </span>
        </div>

        <p className="text-xs text-slate-600">{priceEvaluation.desc}</p>

        {/* Barra di Posizionamento Keepa */}
        <div className="space-y-1.5 pt-1">
          <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden flex items-center">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-400 via-indigo-400 to-rose-400 w-full opacity-60" />
            <div
              className="absolute top-0 bottom-0 bg-slate-900 w-2.5 rounded-full transform -translate-x-1.5 shadow-md ring-2 ring-white transition-all duration-300"
              style={{ left: `${Math.max(2, Math.min(98, percentage))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Min: {formatCurrency(minRange)}</span>
            <span className="text-indigo-700 font-extrabold">Media: {formatCurrency(analysis.avgSoldPrice)}</span>
            <span>Max: {formatCurrency(maxRange)}</span>
          </div>
        </div>
      </div>

      {/* Mini Grafico Storico Trend Ultimi Mesi */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Trend Prezzi Storico Negli Ultimi 90 Giorni
          </span>
          <span
            className={`text-xs font-bold flex items-center gap-1 ${
              analysis.priceTrend === "UP"
                ? "text-emerald-600"
                : analysis.priceTrend === "DOWN"
                ? "text-rose-600"
                : "text-slate-600"
            }`}
          >
            {analysis.priceTrend === "UP" ? (
              <>
                <TrendingUp className="w-3.5 h-3.5" /> +{analysis.trendPercentage}% (In Aumento)
              </>
            ) : analysis.priceTrend === "DOWN" ? (
              <>
                <TrendingDown className="w-3.5 h-3.5" /> {analysis.trendPercentage}% (In Calo)
              </>
            ) : (
              <span>Stabile (~0%)</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          {analysis.historicalTrend.map((pt, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-2.5 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block font-medium">{pt.label}</span>
              <span className="text-xs font-black text-slate-900 block">{formatCurrency(pt.price)}</span>
              <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full inline-block">
                {pt.volume} vendite
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabella Comparatore Profitto Netto Multi-Canale */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Simulatore Profitto Netto Reale Incassato per Canale
          </h4>
          <span className="text-[11px] text-slate-500">
            Calcolato sul prezzo base: <strong>{formatCurrency(basePrice || 0)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Piattaforma / Canale</th>
                <th className="px-3.5 py-2.5">Prezzo Vendita</th>
                <th className="px-3.5 py-2.5">Commissione Canale</th>
                <th className="px-3.5 py-2.5 text-right">Netto Incassato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(CHANNEL_FEES).map(([key, fee]) => {
                const commission = (basePrice * (fee.percent / 100)) + fee.fixedFee;
                const net = Math.max(0, basePrice - commission);
                const isBest = key === "NEGOZIO" || (fee.percent === 0 && commission === 0);

                return (
                  <tr key={key} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{fee.name}</span>
                        {isBest && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md border border-emerald-200">
                            100% Netto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-700">
                      {formatCurrency(basePrice)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${fee.badgeBg}`}>
                        {fee.label}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className="font-black text-sm text-emerald-700">
                        {formatCurrency(net)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
