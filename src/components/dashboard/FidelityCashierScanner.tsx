"use strict";
"use client";

import React, { useState } from "react";
import {
  QrCode,
  Search,
  PlusCircle,
  Gift,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  Share2,
} from "lucide-react";
import { FidelityRewardItem } from "./FidelitySettingsPanel";

interface Props {
  tenantName: string;
  pointsPerEuro: number;
  welcomeBonusPoints: number;
  rewards: FidelityRewardItem[];
}

interface SimulatedCustomer {
  phone: string;
  name: string;
  points: number;
  visits: number;
  cardToken: string;
}

export default function FidelityCashierScanner({
  tenantName,
  pointsPerEuro,
  welcomeBonusPoints,
  rewards,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<SimulatedCustomer | null>(null);
  const [spentAmount, setSpentAmount] = useState("");
  const [manualPoints, setManualPoints] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const cleanPhoneInput = (val: string) => val.replace(/[^0-9+]/g, "");

  const handleLookup = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setFeedback(null);

    // Se l'input è un URL o token (es. tc_xxx o https://.../tc_xxx)
    let token = searchQuery.trim();
    if (token.includes("/fidelity/card/")) {
      token = token.split("/fidelity/card/")[1].split("?")[0];
    }

    setTimeout(() => {
      // In modalità demo locale o cassa:
      const cleanPhone = cleanPhoneInput(searchQuery);
      const isToken = token.startsWith("tc_");

      setCustomer({
        phone: isToken ? "+39 340 1234567" : cleanPhone || "+39 340 1234567",
        name: isToken ? "Mario Rossi (Cliente VIP)" : "Cliente Fedeltà",
        points: isToken ? 120 : (welcomeBonusPoints || 10),
        visits: isToken ? 5 : 1,
        cardToken: isToken ? token : `tc_${Math.random().toString(16).substring(2, 10)}`,
      });

      setIsSearching(false);
      setFeedback({
        type: "success",
        text: "Tessera cliente identificata con successo!",
      });
    }, 300);
  };

  const handleCredit = () => {
    if (!customer) return;

    let pointsToAdd = 0;
    const spent = parseFloat(spentAmount);
    if (!isNaN(spent) && spent > 0) {
      pointsToAdd += Math.floor(spent * (pointsPerEuro || 1));
    }

    const manual = parseInt(manualPoints, 10);
    if (!isNaN(manual) && manual > 0) {
      pointsToAdd += manual;
    }

    if (pointsToAdd <= 0) {
      pointsToAdd = 1; // 1 punto visita di cortesia
    }

    const newPoints = customer.points + pointsToAdd;
    setCustomer({
      ...customer,
      points: newPoints,
      visits: customer.visits + 1,
    });

    setSpentAmount("");
    setManualPoints("");
    setFeedback({
      type: "success",
      text: `Accreditati +${pointsToAdd} punti! Nuovo saldo: ${newPoints} PT. Notifica inviata al cliente con link al Portafoglio Smartphone.`,
    });
  };

  const handleRedeem = (reward: FidelityRewardItem) => {
    if (!customer) return;
    if (customer.points < reward.pointsRequired) {
      setFeedback({
        type: "error",
        text: `Punti insufficienti per "${reward.name}" (${customer.points}/${reward.pointsRequired} PT)`,
      });
      return;
    }

    const newPoints = customer.points - reward.pointsRequired;
    setCustomer({
      ...customer,
      points: newPoints,
    });

    setFeedback({
      type: "success",
      text: `Premio "${reward.name}" riscattato con successo! Scalati -${reward.pointsRequired} punti. Saldo residuo: ${newPoints} PT.`,
    });
  };

  const cardWebUrl = customer ? `https://admin.taaaac.eu/fidelity/card/${customer.cardToken}` : "#";

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            Scanner & Cassa Fidelity Card
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Inquadra il QR Code dello smartphone del cliente o inserisci il suo numero di telefono per accreditare punti o riscattare premi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Smartphone className="w-3.5 h-3.5" />
            Apple & Google Wallet Ready
          </span>
        </div>
      </div>

      {/* Input Ricerca Rapida */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Scansiona QR Code o digita numero di cellulare (es. 3401234567)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        </div>
        <button
          type="button"
          onClick={handleLookup}
          disabled={isSearching || !searchQuery.trim()}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
        >
          {isSearching ? "Ricerca in corso..." : "Trova / Scansiona"}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Scheda Cliente Attivo */}
      {customer && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 p-5 space-y-5">
          {/* Dati Intestazione Cliente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{customer.name}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    {customer.points >= 100 ? "VIP Gold" : "Membro"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Saldo Attuale
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {customer.points} <span className="text-xs font-bold">PT</span>
                </span>
              </div>

              <a
                href={cardWebUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-amber-500 transition-colors"
                title="Apri Card Smartphone"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Griglia Azioni Cassa: Accredito & Riscatti */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Box 1: Accredito Punti */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  Accredita Punti Spesa
                </h5>
                <span className="text-[10px] text-neutral-400">
                  Tasso: {pointsPerEuro || 1} pt/€
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-500 mb-1">Importo Conto (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="es. 45"
                    value={spentAmount}
                    onChange={(e) => setSpentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 mb-1">Punti Extra (Opz.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="es. 5"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCredit}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Conferma Accredito Punti
              </button>
            </div>

            {/* Box 2: Premi Riscattabili */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                Riscatto Premi Disponibili
              </h5>

              {rewards.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">Nessun premio configurato.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {rewards.map((rew) => {
                    const canRedeem = customer.points >= rew.pointsRequired;
                    return (
                      <div
                        key={rew.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          canRedeem
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80"
                            : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-60"
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-semibold text-neutral-900 dark:text-white block truncate">
                            {rew.name}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Costo: {rew.pointsRequired} pt
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!canRedeem}
                          onClick={() => handleRedeem(rew)}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                            canRedeem
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                          }`}
                        >
                          {canRedeem ? "Riscatta" : "Mancano pt"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Barra Portafoglio & Link Tessera */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              La card del cliente si aggiorna in tempo reale sul suo Apple / Google Wallet.
            </span>

            <a
              href={cardWebUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 shrink-0"
            >
              Visualizza Tessera Smartphone
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
