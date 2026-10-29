"use client";

import { useState } from "react";

export interface ChannelStatusInfo {
  google?: {
    enabled: boolean;
    status: string;
    lastSyncAt?: string | null;
    hasLocation?: boolean;
    hasPlaceId?: boolean;
  };
  meta?: {
    enabled: boolean;
    status: string;
    lastSyncAt?: string | null;
    hasPageId?: boolean;
  };
  whatsapp?: {
    enabled: boolean;
    displayNumber?: string | null;
  };
  reviewBooster?: {
    enabled: boolean;
    totalSent: number;
    googleUrl?: string | null;
  };
}

interface OmnichannelSyncCardProps {
  channelStatus?: ChannelStatusInfo | null;
  lastSyncAt?: string | null;
  orari?: any[];
  eccezioni?: any[];
  onSyncSuccess?: (newStatus: any) => void;
  accentColor?: string; // e.g. "pink", "emerald", "amber", "blue", "purple"
}

export default function OmnichannelSyncCard({
  channelStatus,
  lastSyncAt,
  orari = [],
  eccezioni = [],
  onSyncSuccess,
  accentColor = "pink",
}: OmnichannelSyncCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncing(true);
    setErrorMsg(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/sync/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_HOURS",
          orari,
          eccezioni,
        }),
      });

      const data = await res.json();
      if (!res.ok || (!data.ok && !data.success)) {
        throw new Error(data.error || "Impossibile completare la sincronizzazione");
      }

      setSyncResult(data);
      if (onSyncSuccess) {
        onSyncSuccess(data.channels || channelStatus);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Errore di connessione con il centro di sincronizzazione");
    } finally {
      setSyncing(false);
    }
  };

  const isGoogleActive = channelStatus?.google?.enabled ?? false;
  const isMetaActive = channelStatus?.meta?.enabled ?? false;
  const isWhatsappActive = channelStatus?.whatsapp?.enabled ?? false;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-xs">
            🌐
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Sincronizzazione Social & Omnicanale
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Hub v1.1.0
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Aggiorna orari, aperture speciali e ferie all&apos;unisono su Google Maps, Facebook, Instagram e WhatsApp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sincronizzazione in corso...
            </>
          ) : (
            <>
              <span>⚡</span> Sincronizza Canali Ora
            </>
          )}
        </button>
      </div>

      {/* Griglia Canali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Google Maps */}
        <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>🗺️</span> Google Maps
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isGoogleActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isGoogleActive ? "Collegato" : "Opzionale"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            {isGoogleActive
              ? "Orari e giorni festivi sincronizzati sulla scheda dell'attività."
              : "Collegabile tramite il supporto per aggiornare la scheda Google."}
          </p>
        </div>

        {/* Facebook & Instagram */}
        <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>📸</span> Meta Pages & IG
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isMetaActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isMetaActive ? "Collegato" : "Opzionale"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            {isMetaActive
              ? "Orari di apertura allineati sui profili social aziendali."
              : "Collegabile per sincronizzare la pagina Facebook e Instagram."}
          </p>
        </div>

        {/* WhatsApp Business */}
        <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>💬</span> WhatsApp Business
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isWhatsappActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isWhatsappActive ? "Attivo" : "Opzionale"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            {channelStatus?.whatsapp?.displayNumber
              ? `Chat rapida attiva su ${channelStatus.whatsapp.displayNumber}.`
              : "Pulsante di contatto diretto per i clienti su smartphone."}
          </p>
        </div>

        {/* Vetrina Web Locale */}
        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 transition space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <span>🏪</span> Vetrina & App PWA
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Sempre Attiva
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80 leading-tight">
            Orari e aperture straordinarie aggiornati in tempo reale per tutti i clienti.
          </p>
        </div>
      </div>

      {/* Esito Sincronizzazione / Feedback */}
      {syncResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
          <div className="font-bold flex items-center gap-1.5">
            <span>✅</span>
            <span>{syncResult.summary || "Sincronizzazione completata con successo!"}</span>
          </div>
          {syncResult.channels && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-emerald-800 pt-1">
              {syncResult.channels.google?.message && (
                <div>• Google: {syncResult.channels.google.message}</div>
              )}
              {syncResult.channels.meta?.message && (
                <div>• Meta: {syncResult.channels.meta.message}</div>
              )}
              {syncResult.channels.whatsapp?.message && (
                <div>• WhatsApp: {syncResult.channels.whatsapp.message}</div>
              )}
              {syncResult.channels.localShowcase?.message && (
                <div>• Vetrina: {syncResult.channels.localShowcase.message}</div>
              )}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Info Ultimo Sync */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        <span>Taaaac Mesh Omnichannel Cloud Hub</span>
        <span>
          {lastSyncAt
            ? `Ultimo allineamento: ${new Date(lastSyncAt).toLocaleString("it-IT")}`
            : "Allineamento automatico ad ogni salvataggio orari"}
        </span>
      </div>
    </div>
  );
}
