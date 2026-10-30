"use client";

import React, { useState } from "react";
import { Award, Gift, Plus, Trash2, Sparkles, Percent, ShoppingBag, Sparkle, Tag } from "lucide-react";

export interface FidelityRewardItem {
  id: string;
  name: string;
  pointsRequired: number;
  rewardType: "DISCOUNT" | "FREE_ITEM";
  discountAmount?: number;
  freeItemName?: string;
}

export interface FidelitySettingsData {
  enabled: boolean;
  pointsPerEuro: number;
  welcomeBonusPoints: number;
  minPointsToRedeem: number;
  rewards: FidelityRewardItem[];
}

const PRESET_RETAIL: FidelitySettingsData = {
  enabled: true,
  pointsPerEuro: 1,
  welcomeBonusPoints: 10,
  minPointsToRedeem: 50,
  rewards: [
    { id: "rew_v1", name: "Buono Sconto 5€ sul Prossimo Acquisto", pointsRequired: 50, rewardType: "DISCOUNT", discountAmount: 5 },
    { id: "rew_v2", name: "Buono Sconto 15€ alla Cassa", pointsRequired: 100, rewardType: "DISCOUNT", discountAmount: 15 },
    { id: "rew_v3", name: "Gift Card Negozio 30€ o Capo Omaggio", pointsRequired: 200, rewardType: "FREE_ITEM", freeItemName: "Gift Card da 30€ spendibile in store o capo della selezione" },
  ],
};

const PRESET_BOTTEGA: FidelitySettingsData = {
  enabled: true,
  pointsPerEuro: 1,
  welcomeBonusPoints: 10,
  minPointsToRedeem: 40,
  rewards: [
    { id: "rew_b1", name: "Confezione Degustazione Tipica Omaggio", pointsRequired: 40, rewardType: "FREE_ITEM", freeItemName: "Assaggio specialità artigianale locale" },
    { id: "rew_b2", name: "Sconto 10€ sulla Spesa della Bottega", pointsRequired: 80, rewardType: "DISCOUNT", discountAmount: 10 },
    { id: "rew_b3", name: "Cesto Selezione Artigianale Esclusiva", pointsRequired: 180, rewardType: "FREE_ITEM", freeItemName: "Cesto prodotti d'eccellenza con confezione regalo" },
  ],
};

export default function FidelitySettingsPanel({ data, onChange }: { data: FidelitySettingsData; onChange: (upd: FidelitySettingsData) => void }) {
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState(50);
  const [newRewardType, setNewRewardType] = useState<"DISCOUNT" | "FREE_ITEM">("DISCOUNT");
  const [newRewardValue, setNewRewardValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddReward = () => {
    if (!newRewardName.trim()) return;

    const newItem: FidelityRewardItem = {
      id: "rew_" + Date.now(),
      name: newRewardName.trim(),
      pointsRequired: Math.max(1, Number(newRewardPoints) || 10),
      rewardType: newRewardType,
      discountAmount: newRewardType === "DISCOUNT" ? Number(newRewardValue) || 5 : undefined,
      freeItemName: newRewardType === "FREE_ITEM" ? (newRewardValue.trim() || newRewardName.trim()) : undefined,
    };

    onChange({
      ...data,
      rewards: [...(data.rewards || []), newItem],
    });

    setNewRewardName("");
    setNewRewardPoints(50);
    setNewRewardValue("");
    setShowAddForm(false);
  };

  const handleRemoveReward = (id: string) => {
    onChange({
      ...data,
      rewards: (data.rewards || []).filter((r) => r.id !== id),
    });
  };

  const applyPreset = (preset: FidelitySettingsData) => {
    onChange({
      ...preset,
      enabled: data.enabled !== undefined ? data.enabled : true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Taaaac Fidelity & Raccolta Punti Negozio</h3>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Novità v1.1.0
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Premia gli acquisti in cassa e sul catalogo online assegnando punti automatici. I clienti ricevono scontrini virtuali e notifica saldo punti su Telegram o WhatsApp.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.enabled || false}
              onChange={(e) => onChange({ ...data, enabled: e.target.checked })}
            />
            <div className="w-14 h-7 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {data.enabled && (
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Il programma fedeltà è attivo. Il numero di telefono del cliente è la sua tessera virtuale: nessun tesserino di plastica da stampare o smarrire!
            </span>
          </div>
        )}
      </div>

      {data.enabled && (
        <>
          {/* Preset Negozio */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-semibold text-neutral-900 dark:text-white">Preset Consigliati per Negozi & Retail</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Configura la campagna punti con un solo click scegliendo un modello collaudato:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => applyPreset(PRESET_RETAIL)}
                className="flex items-start gap-3 p-3 text-left rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm"
              >
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm text-neutral-900 dark:text-white">Abbigliamento & Retail Store</div>
                  <div className="text-xs text-neutral-500 mt-0.5">1 punto ogni 1 € • Buono 5€ a 50 pt • Buono 15€ a 100 pt • Gift card 30€</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(PRESET_BOTTEGA)}
                className="flex items-start gap-3 p-3 text-left rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm"
              >
                <div className="p-2 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-lg shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm text-neutral-900 dark:text-white">Bottega Artigiana & Tipicità</div>
                  <div className="text-xs text-neutral-500 mt-0.5">1 punto ogni 1 € • Assaggio tipico omaggio a 40 pt • Sconto 10€ a 80 pt</div>
                </div>
              </button>
            </div>
          </div>

          {/* Regole di Assegnazione Punti */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-neutral-500" />
              Regole di Assegnazione & Accumulo Punti
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Punti per ogni Euro speso (€)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={data.pointsPerEuro || 1}
                  onChange={(e) => onChange({ ...data, pointsPerEuro: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Es. 1 = 1 punto ogni 1 € di acquisto</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Punti Bonus di Benvenuto
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={data.welcomeBonusPoints || 10}
                  onChange={(e) => onChange({ ...data, welcomeBonusPoints: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Accreditati alla prima spesa</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Soglia Minima per Riscatto
                </label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={data.minPointsToRedeem || 50}
                  onChange={(e) => onChange({ ...data, minPointsToRedeem: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Punti minimi per spendere i punti</p>
              </div>
            </div>
          </div>

          {/* Catalogo Premi */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-500" />
                  Catalogo Buoni Sconto & Articoli Omaggio
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Definisci i vantaggi che i clienti possono riscattare con i punti accumulati in cassa
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Aggiungi Premio
              </button>
            </div>

            {/* Form Aggiunta Premio */}
            {showAddForm && (
              <div className="p-4 mb-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="font-medium text-xs text-neutral-700 dark:text-neutral-300">Nuovo Premio da Catalogo</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-neutral-500 mb-1">Nome Premio / Buono</label>
                    <input
                      type="text"
                      placeholder="es. Buono Sconto 10€ o Gift Card"
                      value={newRewardName}
                      onChange={(e) => setNewRewardName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">Punti Richiesti</label>
                    <input
                      type="number"
                      min="1"
                      value={newRewardPoints}
                      onChange={(e) => setNewRewardPoints(parseInt(e.target.value, 10) || 10)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">Tipologia</label>
                    <select
                      value={newRewardType}
                      onChange={(e) => setNewRewardType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                    >
                      <option value="DISCOUNT">Buono Sconto in Euro (€)</option>
                      <option value="FREE_ITEM">Articolo / Omaggio Fisico</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    {newRewardType === "DISCOUNT" ? "Valore dello Sconto (€)" : "Dettaglio / Descrizione Omaggio"}
                  </label>
                  <input
                    type="text"
                    placeholder={newRewardType === "DISCOUNT" ? "es. 10 (per 10€ di sconto)" : "es. T-shirt brandizzata o gadget del negozio"}
                    value={newRewardValue}
                    onChange={(e) => setNewRewardValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleAddReward}
                    className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    Salva Premio
                  </button>
                </div>
              </div>
            )}

            {/* Elenco Premi */}
            {(!data.rewards || data.rewards.length === 0) ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                Nessun premio configurato. Clicca &quot;Aggiungi Premio&quot; o applica un preset sopra.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.rewards.map((reward) => (
                  <div key={reward.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                          {reward.name}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {reward.rewardType === "DISCOUNT" ? `Sconto €${reward.discountAmount}` : "Omaggio"}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {reward.rewardType === "FREE_ITEM" && reward.freeItemName ? reward.freeItemName : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                        {reward.pointsRequired} pt
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReward(reward.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Elimina premio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
