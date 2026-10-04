"use client";

import React, { useState } from "react";
import {
  Truck,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Package,
  Globe,
  X,
  AlertCircle,
  Share2,
} from "lucide-react";
import {
  detectCarrier,
  cleanTrackingCode,
  getParcelsAppUrl,
  get17TrackUrl,
  buildWhatsAppTrackingMessage,
  SUPPORTED_CARRIERS,
} from "@/lib/tracking-utils";
import { MockOrder } from "@/lib/mock-store";

interface UniversalTrackingRadarProps {
  order: MockOrder;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  onUpdateStatus?: (orderId: string, status: string, trackingCode?: string) => Promise<void>;
  onEditTracking?: (order: MockOrder) => void;
}

export default function UniversalTrackingRadar({
  order,
  isOpen,
  onClose,
  storeName = "Vendoly Store",
  onUpdateStatus,
  onEditTracking,
}: UniversalTrackingRadarProps) {
  const [copied, setCopied] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  if (!isOpen) return null;

  const rawTracking = order.trackingCode || "";
  const cleanCode = cleanTrackingCode(rawTracking) || rawTracking;
  const carrier = detectCarrier(rawTracking);
  const parcelsUrl = getParcelsAppUrl(rawTracking);
  const seventeenTrackUrl = get17TrackUrl(rawTracking);
  const officialUrl = carrier.officialTrackingUrl ? carrier.officialTrackingUrl(cleanCode) : null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const rawPhone = order.customerPhone.replace(/[^0-9+]/g, "");
    const formattedPhone = rawPhone.startsWith("+")
      ? rawPhone.replace("+", "")
      : rawPhone.startsWith("39")
      ? rawPhone
      : `39${rawPhone}`;

    const text = buildWhatsAppTrackingMessage({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      storeName,
      trackingCode: rawTracking,
      carrierName: carrier.name,
    });

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleMarkAsDelivered = async () => {
    if (!onUpdateStatus) return;
    setMarkingDelivered(true);
    try {
      await onUpdateStatus(order.id, "COMPLETATO", rawTracking);
      onClose();
    } finally {
      setMarkingDelivered(false);
    }
  };

  // Determina lo stato della spedizione per la timeline
  const isDelivered = order.status === "COMPLETATO";
  const isShipped = order.status === "SPEDITO" || isDelivered;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${carrier.iconBg}`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Radar Tracking Spedizione
              </h3>
              <p className="text-xs text-slate-500">
                Ordine <strong>#{order.orderNumber}</strong> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Dati Corriere e Codice */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${carrier.iconBg}`}>
                {carrier.name}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Rilevamento automatico</span>
            </div>

            {onEditTracking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditTracking(order);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Modifica Codice
              </button>
            )}
          </div>

          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Lettera di Vettura / Codice Tracking
              </span>
              <span className="font-mono text-sm font-black text-slate-900 tracking-wide">
                {rawTracking}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Copia codice"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copiato!" : "Copia"}</span>
            </button>
          </div>

          {/* Destinazione Spedizione */}
          {order.shippingAddress && (
            <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>Destinazione: <strong>{order.shippingAddress}</strong></span>
            </div>
          )}
        </div>

        {/* Pulsante Principale: ParcelsApp Deep-Link */}
        <div className="space-y-2">
          <a
            href={parcelsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Globe className="w-4 h-4 text-teal-200 group-hover:rotate-12 transition-transform" />
            <span>Traccia in Tempo Reale su ParcelsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Link Alternativi */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Portale Ufficiale {carrier.shortName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span>•</span>
            <a
              href={seventeenTrackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>Traccia con 17Track</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Timeline Spedizione Grafica */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Avanzamento Spedizione
          </span>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1 */}
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Affidato al Corriere & Etichetta Generata</p>
                <p className="text-[11px] text-slate-500">Pacco imballato e pronto presso {storeName}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isShipped ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-400"
                }`}
              >
                <Truck className="w-3 h-3" />
              </div>
              <div>
                <p className={`text-xs font-bold ${isShipped ? "text-slate-800" : "text-slate-400"}`}>
                  In Transito & Hub di Smistamento
                </p>
                <p className="text-[11px] text-slate-500">In viaggio verso la filiale di destinazione</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isDelivered ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                }`}
              >
                {isDelivered ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </div>
              <div>
                <p className={`text-xs font-bold ${isDelivered ? "text-emerald-700" : "text-slate-400"}`}>
                  {isDelivered ? "Consegnato al Cliente ✅" : "In Consegna / Consegna Programmata"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isDelivered ? "Pacco recapitato con successo" : "Attesa recapito a domicilio o al punto di ritiro"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Azioni Bottom: WhatsApp & Segna Consegnato */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Invia su WhatsApp</span>
          </button>

          {!isDelivered && onUpdateStatus && (
            <button
              type="button"
              onClick={handleMarkAsDelivered}
              disabled={markingDelivered}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Segna Consegnato</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
