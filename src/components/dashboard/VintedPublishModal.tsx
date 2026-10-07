"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Package,
  Sparkles,
  Smartphone,
  Monitor,
  ShieldCheck,
  AlertCircle,
  Tag,
  ArrowRight,
  Download,
  Share2,
} from "lucide-react";
import {
  VintedProductInput,
  generateVintedPayload,
  executeVintedQuickBridge,
  isMobileDevice,
  calculateVintedParcelSize,
  mapConditionToVinted,
  parseProductImages,
} from "@/lib/vinted-bridge";
import { upsertChannelListing } from "@/lib/store-actions";
import { formatCurrency } from "@/lib/utils";
import VendolyAssistantGuideModal from "./VendolyAssistantGuideModal";

interface VintedPublishModalProps {
  product: VintedProductInput | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function VintedPublishModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: VintedPublishModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const isMobile = typeof window !== "undefined" ? isMobileDevice() : false;

  useEffect(() => {
    // Controlla se Vendoly Assistant Extension è installata
    if (typeof window !== "undefined") {
      const hasExt = document.documentElement.getAttribute("data-vendoly-assistant") === "installed";
      setIsExtensionActive(hasExt);
      window.postMessage({ type: "PING_VENDOLY_ASSISTANT", source: "vendoly-web" }, "*");
    }

    // Ascolta eventuale callback dall'estensione
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.type === "VENDOLY_ASSISTANT_AVAILABLE") {
        setIsExtensionActive(true);
      }
      if (event.data?.source === "vendoly-assistant" && event.data?.type === "VINTED_LISTING_CONFIRMED") {
        const payload = event.data.payload;
        if (payload?.externalUrl) {
          setExternalUrl(payload.externalUrl);
          handleSaveListing(payload.externalUrl);
        }
      }
    };

    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, []);

  if (!isOpen || !product) return null;

  const payload = generateVintedPayload(product);
  const parcel = calculateVintedParcelSize(product.weight, product.category);
  const condition = mapConditionToVinted(product.condition);
  const images = parseProductImages(product.images);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(payload.description);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickBridge = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await executeVintedQuickBridge(product);
      setActionMessage(res.message);
      if (onSuccess) onSuccess(res.message);
    } catch (err: any) {
      setActionMessage("Errore durante l'operazione: " + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveListing = async (urlToSave?: string) => {
    const finalUrl = urlToSave || externalUrl;
    if (!finalUrl) return;

    setIsSavingUrl(true);
    try {
      await upsertChannelListing({
        productId: product.id,
        channel: "VINTED",
        externalUrl: finalUrl,
        listedPrice: product.price,
        status: "ACTIVE",
        notes: `Pacco ${parcel.label} • Taglia ${product.size || "ND"}`,
      });
      if (onSuccess) onSuccess("Annuncio Vinted registrato con successo in Vendoly!");
      onClose();
    } catch (err: any) {
      alert("Errore salvataggio annuncio: " + err?.message);
    } finally {
      setIsSavingUrl(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Vinted Cyan */}
        <div className="bg-gradient-to-r from-cyan-900 via-cyan-800 to-cyan-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-lg">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Vinted Quick-Bridge</h3>
                {isExtensionActive && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    Assistant Attivo
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-200">
                Cross-listing rapido • 0% commissioni per il venditore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-cyan-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo Modal */}
        <div className="p-6 space-y-5 text-xs text-slate-600">
          {/* Card Riepilogo Capo */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{product.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>SKU: {product.sku || "N/D"}</span>
                  {product.brand && <span>• Brand: <b>{product.brand}</b></span>}
                  {product.size && <span>• Taglia: <b>{product.size}</b></span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-700">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-[10px] text-emerald-600 block font-semibold">
                  Netto 100%
                </span>
              </div>
            </div>

            {/* Formato Pacco Raccomandato */}
            <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-700 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-950 text-xs">{parcel.label}</span>
                  <span className="text-[11px] text-cyan-800 block">
                    {parcel.weightRange} ({parcel.examples})
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-200 text-cyan-900">
                {condition.label}
              </span>
            </div>

            {/* Anteprima Foto */}
            {images.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                  Foto ({images.length}):
                </span>
                {images.slice(0, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Foto ${i + 1}`}
                    className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Azione Principale Quick-Bridge */}
          <div className="space-y-2">
            <button
              onClick={handleQuickBridge}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isProcessing
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-cyan-700 hover:bg-cyan-800 active:scale-[0.99]"
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin text-base">⏳</span>
                  <span>Elaborazione in corso...</span>
                </>
              ) : isMobile ? (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Invia all&apos;App Vinted Mobile</span>
                </>
              ) : isExtensionActive ? (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Autocompila con Vendoly Assistant</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Scarica Foto & Apri Vinted Web</span>
                </>
              )}
            </button>

            {actionMessage && (
              <p className="text-[11px] text-center font-medium text-cyan-900 bg-cyan-50 p-2 rounded-lg border border-cyan-200">
                {actionMessage}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
              <span>
                {isMobile
                  ? "📱 Smartphone PWA attivo"
                  : isExtensionActive
                  ? "🚀 Estensione Desktop attiva"
                  : "💻 Web Desktop senza estensione"}
              </span>
              <button
                onClick={handleCopyText}
                className="text-cyan-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? "Copiato!" : "Copia solo descrizione"}</span>
              </button>
            </div>

            {/* Suggerimento Estensione se su Desktop senza estensione */}
            {!isMobile && !isExtensionActive && (
              <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                    <span className="font-bold text-cyan-950 text-[11px] truncate">
                      Vuoi l&apos;autocompilazione 1-click?
                    </span>
                  </div>
                  <a
                    href="/downloads/vendoly-assistant.zip"
                    download="vendoly-assistant.zip"
                    className="px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[10px] flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Scarica .ZIP</span>
                  </a>
                </div>
                <div className="flex items-center justify-between text-[10px] text-cyan-800">
                  <span>Installa l&apos;estensione per caricare foto e dati in automatico.</span>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-cyan-900 underline font-semibold hover:text-cyan-950 cursor-pointer shrink-0 ml-2"
                  >
                    Guida 1 minuto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sezione Chiusura Cerchio: Salva Link Annuncio per Kill-Switch */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Collega link per Protezione Kill-Switch
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Incolla qui il link dell&apos;annuncio Vinted appena pubblicato: se venderai questo capo al banco cassa, Vendoly ti fornirà il link immediato per toglierlo da Vinted.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.vinted.it/items/12345678-..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={() => handleSaveListing()}
                disabled={!externalUrl || isSavingUrl}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                {isSavingUrl ? "Salvataggio..." : "Salva Annuncio"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Guida Installazione Estensione */}
      <VendolyAssistantGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
