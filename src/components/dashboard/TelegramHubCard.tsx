"use client";

import React from "react";
import { Send, ExternalLink, CheckCircle2, CircleOff } from "lucide-react";

export interface TelegramHubData {
  managedByCore: boolean;
  enabled: boolean;
  botUsername: string;
  staffAlerts: boolean;
  reminder24h: boolean;
}

/**
 * Telegram è gestito al 100% da Taaaac Core (token, gruppo staff e invii).
 * Qui si mostra solo lo stato, senza campi da compilare.
 */
export default function TelegramHubCard({ hub }: { hub: TelegramHubData | null }) {
  const enabled = Boolean(hub?.enabled);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notifiche Telegram</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestite da Taaaac: nessun bot o codice da inserire qui.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
            enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleOff className="w-3.5 h-3.5" />}
          {enabled ? "Attivo" : "Non attivo"}
        </span>
      </div>

      {enabled && (
        <ul className="text-xs text-slate-700 space-y-1.5">
          {hub?.botUsername && (
            <li>
              Bot: <span className="font-mono font-semibold">@{hub.botUsername.replace(/^@/, "")}</span>
            </li>
          )}
          <li>{hub?.staffAlerts ? "✅" : "⏸️"} Avvisi istantanei allo staff (comande, asporto, prenotazioni)</li>
          <li>{hub?.reminder24h ? "✅" : "⏸️"} Promemoria automatico 24 ore prima</li>
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-500">
          Per attivare, disattivare o cambiare gruppo, entra nel tuo portale Taaaac.
        </p>
        <a
          href="https://taaaac.eu/portal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Apri il portale
        </a>
      </div>
    </div>
  );
}
