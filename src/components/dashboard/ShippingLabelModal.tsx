"use client";

import React, { useState, useMemo } from "react";
import {
  Printer,
  Truck,
  CheckCircle2,
  Calendar,
  X,
  RefreshCw,
  Clock,
  Package,
  MapPin,
  ExternalLink,
  Download,
  AlertCircle,
  Building,
  User,
} from "lucide-react";
import { MockOrder } from "@/lib/mock-store";
import {
  WaybillData,
  createWaybill,
  generateBarcodeSVG,
} from "@/lib/shipping-labels";
import { SUPPORTED_CARRIERS } from "@/lib/tracking-utils";

interface ShippingLabelModalProps {
  order: MockOrder;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  storePhone?: string;
  onConfirmShipping?: (orderId: string, waybillCode: string) => Promise<void>;
}

export default function ShippingLabelModal({
  order,
  isOpen,
  onClose,
  storeName = "Vendoly Boutique Store",
  storePhone = "+39 02 8901 5678",
  onConfirmShipping,
}: ShippingLabelModalProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<"GLS" | "BRT" | "POSTE" | "INPOST" | "DHL" | "UPS">("GLS");
  const [weightKg, setWeightKg] = useState<number>(0.85);
  const [colliCount, setColliCount] = useState<number>(1);
  const [requestPickup, setRequestPickup] = useState<boolean>(true);
  const [pickupSlot, setPickupSlot] = useState<string>("14:00 - 18:00");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Genera i dati della Lettera di Vettura
  const waybill = useMemo<WaybillData>(() => {
    const carrierInfo = SUPPORTED_CARRIERS[selectedCarrier] || SUPPORTED_CARRIERS.GLS;
    return createWaybill({
      orderId: order.id,
      orderNumber: order.orderNumber,
      carrierId: selectedCarrier,
      carrierName: carrierInfo.name,
      storeConfig: {
        name: storeName,
        address: "Via della Spiga 12",
        city: "Milano",
        province: "MI",
        zip: "20121",
        phone: storePhone,
      },
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      weightKg,
      colliCount,
      pickupRequested: requestPickup,
      pickupTimeSlot: pickupSlot,
    });
  }, [order, selectedCarrier, weightKg, colliCount, requestPickup, pickupSlot, storeName, storePhone]);

  // Genera il Barcode SVG
  const barcodeSvg = useMemo(() => {
    return generateBarcodeSVG(waybill.waybillNumber, 360, 68);
  }, [waybill.waybillNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmAndShip = async () => {
    if (!onConfirmShipping) return;
    setIsConfirming(true);
    try {
      await onConfirmShipping(order.id, waybill.waybillNumber);
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* CSS dedicato per la stampa dell'etichetta termica 10x15cm */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shipping-label,
          #printable-shipping-label * {
            visibility: visible !important;
          }
          #printable-shipping-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            height: 150mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Lettera di Vettura & Etichetta Termica (10x15cm)
              </h3>
              <p className="text-xs text-slate-500">
                Ordine <strong>#{order.orderNumber}</strong> • Destinatario: {order.customerName}
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

        {/* Corpo: Opzioni a sinistra, Anteprima Etichetta a destra */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
          {/* Colonna Sinistra: Configurazione Spedizione */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-teal-600" />
                Vettore & Dati Collo
              </h4>

              {/* Selettore Vettore */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Corriere Espresso
                </label>
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="GLS">GLS Express Italy (24/48h)</option>
                  <option value="BRT">BRT Bartolini / DPD Network</option>
                  <option value="POSTE">Poste Italiane / Crono SDA</option>
                  <option value="INPOST">InPost Locker & Point</option>
                  <option value="DHL">DHL Express Domestic</option>
                  <option value="UPS">UPS Standard / Express</option>
                </select>
              </div>

              {/* Peso & Colli */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numero Colli
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={colliCount}
                    onChange={(e) => setColliCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Prenotazione Pick-up Ritiro Corriere */}
              <div className="pt-2 border-t border-slate-200/70 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestPickup}
                    onChange={(e) => setRequestPickup(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Prenota Ritiro al Banco Negozio
                  </span>
                </label>

                {requestPickup && (
                  <div className="pl-6 space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Fascia oraria di passaggio autista:
                    </span>
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium"
                    >
                      <option value="09:00 - 13:00">Mattina (09:00 - 13:00)</option>
                      <option value="14:00 - 18:00">Pomeriggio (14:00 - 18:00)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Riepilogo Dati Destinazione */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dati Consegna Destinatario
              </span>
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-slate-600">{order.shippingAddress || "Indirizzo standard"}</p>
              <p className="text-slate-500">Tel: {order.customerPhone}</p>
            </div>
          </div>

          {/* Colonna Destra: Mockup Etichetta Termica 10x15cm (Printable Area) */}
          <div className="md:col-span-7 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              Anteprima Etichetta Termica 100x150 mm
            </span>

            {/* Etichetta di Spedizione Standard 10x15cm */}
            <div
              id="printable-shipping-label"
              className="w-full max-w-[340px] bg-white border-2 border-slate-900 rounded-xl p-4 text-slate-900 shadow-md font-sans space-y-3"
            >
              {/* Header Etichetta con Logo Corriere e Servizio */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h4 className="text-xl font-black tracking-tight leading-none">
                    {waybill.carrierId}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {waybill.serviceType}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    STANDARD PARCEL
                  </span>
                  <span className="text-[9px] block text-slate-500 mt-0.5 font-mono">
                    ORD #{order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Routing Hub */}
              <div className="bg-slate-100 border border-slate-300 rounded p-1.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Nodo di Smistamento
                </span>
                <span className="font-black text-xs tracking-wider">
                  {waybill.routingHub}
                </span>
              </div>

              {/* Barcode Code 128 */}
              <div className="text-center py-1 border-b border-slate-200">
                <div
                  className="flex justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
                <span className="font-mono text-xs font-black tracking-widest block mt-1">
                  {waybill.waybillNumber}
                </span>
              </div>

              {/* Box Mittente */}
              <div className="border border-slate-200 rounded p-1.5 text-[9px] leading-tight text-slate-600 bg-slate-50">
                <span className="font-bold text-slate-800 uppercase block text-[8px]">
                  Mittente:
                </span>
                <span className="font-bold text-slate-900">{waybill.sender.companyName}</span> -{" "}
                {waybill.sender.address}, {waybill.sender.zip} {waybill.sender.city} ({waybill.sender.province}) • Tel:{" "}
                {waybill.sender.phone}
              </div>

              {/* Box Destinatario in Risalto */}
              <div className="border-2 border-slate-900 rounded-lg p-2.5 text-xs bg-white space-y-0.5">
                <span className="font-extrabold uppercase text-[9px] text-slate-500 tracking-wider block">
                  Destinatario:
                </span>
                <p className="font-black text-sm text-slate-950 uppercase leading-snug">
                  {waybill.recipient.fullName}
                </p>
                <p className="font-semibold text-slate-800 leading-snug">
                  {waybill.recipient.address}
                </p>
                <p className="font-black text-slate-950">
                  {waybill.recipient.zip} {waybill.recipient.city} ({waybill.recipient.province})
                </p>
                <p className="text-[10px] text-slate-600 pt-0.5">
                  Tel: <strong>{waybill.recipient.phone}</strong>
                </p>
              </div>

              {/* Specifiche Collo Bottom */}
              <div className="flex items-center justify-between text-[9px] font-bold border-t border-slate-200 pt-1.5 text-slate-600">
                <span>COLLI: {waybill.packageSpecs.colliCount}/1</span>
                <span>PESO: {waybill.packageSpecs.weightKg} KG</span>
                <span>DATA: {new Date(waybill.createdAt).toLocaleDateString("it-IT")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Azioni: Stampa Etichetta & Conferma Spedizione */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Codice LDV:</span>
            <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900 text-xs">
              {waybill.waybillNumber}
            </code>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Stampa Etichetta Termica (10x15)</span>
            </button>

            {onConfirmShipping && (
              <button
                type="button"
                onClick={handleConfirmAndShip}
                disabled={isConfirming}
                className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Conferma e Salva LDV sull&apos;Ordine</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
