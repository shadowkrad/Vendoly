"use client";

import React, { useState, useMemo } from "react";
import { MockOrder } from "@/lib/mock-store";
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Store,
  Layers,
  List,
  AlertCircle,
  X,
  Phone,
  Mail,
  Calendar,
  Send,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/store-actions";
import UniversalTrackingRadar from "./UniversalTrackingRadar";
import {
  detectCarrier,
  cleanTrackingCode,
  getParcelsAppUrl,
  buildWhatsAppTrackingMessage,
  SUPPORTED_CARRIERS,
} from "@/lib/tracking-utils";

interface OrdersDashboardClientProps {
  initialOrders: MockOrder[];
  storeName?: string;
  storePhone?: string;
}

type ViewMode = "kanban" | "table";
type ChannelFilter = "ALL" | "VINTED" | "SUBITO" | "EBAY" | "FACEBOOK" | "CASSA" | "WHATSAPP";
type FulfillmentFilter = "ALL" | "SPEDIZIONE" | "RITIRO_IN_NEGOZIO";

const STATUS_COLUMNS = [
  { id: "IN_ATTESA", label: "Nuovi / In Attesa", color: "amber", border: "border-amber-400" },
  { id: "PAGATO", label: "In Preparazione", color: "blue", border: "border-blue-500" },
  { id: "PRONTO_RITIRO", label: "Pronti al Banco", color: "purple", border: "border-purple-500" },
  { id: "SPEDITO", label: "Spediti con Corriere", color: "teal", border: "border-teal-500" },
  { id: "COMPLETATO", label: "Consegnati / Chiusi", color: "emerald", border: "border-emerald-500" },
];

export default function OrdersDashboardClient({
  initialOrders,
  storeName = "Vendoly Store",
  storePhone = "+39 02 8901 5678",
}: OrdersDashboardClientProps) {
  const [orders, setOrders] = useState<MockOrder[]>(initialOrders);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilter>("ALL");
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modale Dettaglio Ordine
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  // Modale Codice Tracking
  const [trackingModalOrder, setTrackingModalOrder] = useState<MockOrder | null>(null);
  const [inputTrackingCode, setInputTrackingCode] = useState("");
  const [selectedCarrierKey, setSelectedCarrierKey] = useState<string>("AUTO");
  const [radarTrackingOrder, setRadarTrackingOrder] = useState<MockOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // KPI a Colpo d'Occhio
  const stats = useMemo(() => {
    let pendingPrep = 0; // Nuovi o Pagati da preparare
    let readyPickup = 0; // Pronti per il ritiro in negozio
    let toShip = 0; // Da spedire con corriere
    let totalRevenue = 0;

    orders.forEach((o) => {
      totalRevenue += o.totalAmount;
      if (o.status === "IN_ATTESA" || o.status === "PAGATO") {
        pendingPrep++;
      }
      if (o.fulfillmentType === "RITIRO_IN_NEGOZIO" && (o.status === "PRONTO_RITIRO" || o.status === "PAGATO")) {
        readyPickup++;
      }
      if (o.fulfillmentType === "SPEDIZIONE" && (o.status === "PAGATO" || o.status === "IN_ATTESA")) {
        toShip++;
      }
    });

    return { pendingPrep, readyPickup, toShip, totalRevenue, totalOrders: orders.length };
  }, [orders]);

  // Filtraggio ordini
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        o.customerPhone.includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q));

      let matchChannel = true;
      if (selectedChannel === "ALL") {
        matchChannel = true;
      } else if (selectedChannel === "CASSA") {
        matchChannel =
          o.channel === "CASSA" ||
          o.channel === "CASSA_CONTANTI" ||
          o.channel === "CASSA_POS" ||
          o.channel === "NEGOZIO";
      } else {
        matchChannel = o.channel === selectedChannel;
      }
      const matchFulfillment = selectedFulfillment === "ALL" || o.fulfillmentType === selectedFulfillment;
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;

      return matchSearch && matchChannel && matchFulfillment && matchStatus;
    });
  }, [orders, searchQuery, selectedChannel, selectedFulfillment, statusFilter]);

  // Gestione avanzamento stato ordine
  const handleUpdateStatus = async (orderId: string, newStatus: string, trackingCode?: string) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatus(orderId, newStatus, trackingCode);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  ...(trackingCode !== undefined ? { trackingCode } : {}),
                }
              : o
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, status: newStatus, ...(trackingCode !== undefined ? { trackingCode } : {}) } : null
          );
        }
        showFeedback(`Ordine aggiornato a: ${formatStatusBadge(newStatus).label}`);
      } else {
        showFeedback("Impossibile aggiornare lo stato dell'ordine", "error");
      }
    } catch {
      showFeedback("Errore durante la connessione", "error");
    } finally {
      setUpdating(false);
      setTrackingModalOrder(null);
      setInputTrackingCode("");
    }
  };

  // Helper WhatsApp Link
  const getWhatsAppMessageUrl = (order: MockOrder) => {
    const rawPhone = order.customerPhone.replace(/\D/g, "");
    let text = "";

    if (order.status === "PRONTO_RITIRO" || order.fulfillmentType === "RITIRO_IN_NEGOZIO") {
      text = `👋 Ciao ${order.customerName}! Il tuo ordine #${order.orderNumber} è pronto per essere ritirato presso ${storeName}. Ti aspettiamo in negozio!`;
    } else if (order.trackingCode) {
      const carrier = detectCarrier(order.trackingCode);
      text = buildWhatsAppTrackingMessage({
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        storeName,
        trackingCode: order.trackingCode,
        carrierName: carrier.name,
      });
    } else {
      text = `👋 Ciao ${order.customerName}! Ti contattiamo da ${storeName} in merito al tuo ordine #${order.orderNumber}.`;
    }

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  };

  function formatStatusBadge(status: string) {
    switch (status) {
      case "IN_ATTESA":
        return { label: "In Attesa", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" };
      case "PAGATO":
        return { label: "In Preparazione", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" };
      case "PRONTO_RITIRO":
        return { label: "Pronto al Banco", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" };
      case "SPEDITO":
        return { label: "Spedito", bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" };
      case "COMPLETATO":
      case "CONSEGNATO":
        return { label: "Completato", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" };
      default:
        return { label: status, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
    }
  }

  function formatChannelBadge(channel: string) {
    switch (channel) {
      case "VINTED":
        return { label: "Vinted", bg: "bg-cyan-50 text-cyan-800 border-cyan-200" };
      case "SUBITO":
        return { label: "Subito.it", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "EBAY":
        return { label: "eBay", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "FACEBOOK":
        return { label: "Facebook", bg: "bg-indigo-50 text-indigo-800 border-indigo-200" };
      case "CASSA_CONTANTI":
      case "CASSA_POS":
      case "CASSA":
      case "NEGOZIO":
        return { label: "Cassa Negozio", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "WHATSAPP":
        return { label: "WhatsApp", bg: "bg-green-50 text-green-800 border-green-200" };
      default:
        return { label: "Marketplace", bg: "bg-purple-50 text-purple-800 border-purple-200" };
    }
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* 1. Header & Switcher Viste */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>📦 Gestione Evasione & Ordini</span>
            <span>•</span>
            <span>Pipeline Multi-Marketplace &amp; Negozio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-emerald-600" />
            Hub Ordini &amp; Spedizioni
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualizza tutti gli ordini generati dai marketplace integrati (Vinted, Subito, eBay, Facebook) e registrati in negozio fisico. Nessun checkout diretto dal sito.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pipeline Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tabella Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Stats Bar - KPI a Colpo d'Occhio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Da Preparare</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.pendingPrep}</p>
          <p className="text-[11px] text-amber-700 font-semibold">Picking a magazzino richiesto</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pronti al Banco</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700">{stats.readyPickup}</p>
          <p className="text-[11px] text-slate-400">Ritiro in sede (Click &amp; Collect)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Da Spedire Oggi</span>
            <Truck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700">{stats.toShip}</p>
          <p className="text-[11px] text-slate-400">In attesa passaggio corriere</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Incasso Totale</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-[11px] text-slate-400">Su {stats.totalOrders} ordini registrati</p>
        </div>
      </div>

      {/* 3. Filtri & Ricerca Rapida */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Ricerca Testuale */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per cliente, numero ordine (#ORD-...), email o tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtri a Tendina */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as ChannelFilter)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Tutti i Canali Marketplace & Negozio</option>
            <option value="VINTED">Solo Vinted</option>
            <option value="SUBITO">Solo Subito.it</option>
            <option value="EBAY">Solo eBay</option>
            <option value="FACEBOOK">Solo Facebook</option>
            <option value="CASSA">Solo Cassa Negozio</option>
            <option value="WHATSAPP">Solo Accordi WhatsApp</option>
          </select>

          <select
            value={selectedFulfillment}
            onChange={(e) => setSelectedFulfillment(e.target.value as FulfillmentFilter)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Tutte le Modalità</option>
            <option value="SPEDIZIONE">Spedizione Corriere</option>
            <option value="RITIRO_IN_NEGOZIO">Ritiro al Banco</option>
          </select>

          {viewMode === "table" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tutti gli Stati</option>
              <option value="IN_ATTESA">In Attesa</option>
              <option value="PAGATO">In Preparazione</option>
              <option value="PRONTO_RITIRO">Pronto al Banco</option>
              <option value="SPEDITO">Spedito</option>
              <option value="COMPLETATO">Completato</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. Vista Operativa Principale: KANBAN vs TABELLA */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nessun ordine trovato</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nessun ordine corrisponde ai filtri di ricerca selezionati.
          </p>
          {(searchQuery || selectedChannel !== "ALL" || selectedFulfillment !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedChannel("ALL");
                setSelectedFulfillment("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Azzera Filtri
            </button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        /* VISTA 1: PIPELINE KANBAN A COLONNE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => {
              if (col.id === "COMPLETATO") {
                return o.status === "COMPLETATO" || o.status === "CONSEGNATO";
              }
              return o.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/90 flex flex-col min-h-[450px]"
              >
                {/* Header Colonna */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white text-slate-700 shadow-2xs border border-slate-200">
                    {colOrders.length}
                  </span>
                </div>

                {/* Lista Card Colonna */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Nessun ordine in questa fase
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const channelBadge = formatChannelBadge(order.channel);
                      const isPickup = order.fulfillmentType === "RITIRO_IN_NEGOZIO";

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3"
                        >
                          {/* Testata Card: ID & Canale */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              #{order.orderNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${channelBadge.bg}`}>
                              {channelBadge.label}
                            </span>
                          </div>

                          {/* Info Cliente & Tipologia */}
                          <div>
                            <p className="text-xs font-bold text-slate-900 truncate">{order.customerName}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              {isPickup ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                                  <Store className="w-3 h-3" />
                                  Ritiro al banco
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-teal-700 font-semibold truncate">
                                  <Truck className="w-3 h-3 shrink-0" />
                                  Spedizione corriere
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Importo & Totale Capi */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px]">
                              {order.items?.length || 1} {order.items?.length === 1 ? "capo" : "capi"}
                            </span>
                            <span className="font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
                          </div>

                          {/* Codice Tracking se presente */}
                          {order.trackingCode && (
                            <button
                              type="button"
                              onClick={() => setRadarTrackingOrder(order)}
                              className="w-full text-left p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[10px] font-mono text-teal-800 truncate flex items-center justify-between gap-1 transition-colors cursor-pointer group"
                              title="Apri Radar Tracking Universale"
                            >
                              <span className="truncate">🚚 {order.trackingCode}</span>
                              <ExternalLink className="w-3 h-3 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
                            </button>
                          )}

                          {/* Azioni Rapide Card */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {/* Dettagli Modal */}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                              title="Visualizza dettagli ordine"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Rapido */}
                            <a
                              href={getWhatsAppMessageUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="Invia messaggio WhatsApp al cliente"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* Avanzamento Fase */}
                            {col.id === "IN_ATTESA" && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "PAGATO")}
                                disabled={updating}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Prepara
                              </button>
                            )}
                            {col.id === "PAGATO" && isPickup && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "PRONTO_RITIRO")}
                                disabled={updating}
                                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Pronto al Banco
                              </button>
                            )}
                            {col.id === "PAGATO" && !isPickup && (
                              <button
                                onClick={() => {
                                  setTrackingModalOrder(order);
                                  setInputTrackingCode(order.trackingCode || "");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Spedisci
                              </button>
                            )}
                            {col.id === "PRONTO_RITIRO" && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "COMPLETATO")}
                                disabled={updating}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Consegnato
                              </button>
                            )}
                            {col.id === "SPEDITO" && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "COMPLETATO")}
                                disabled={updating}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Chiudi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: TABELLA DETTAGLIATA */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Ordine</th>
                  <th className="p-3.5">Cliente &amp; Contatto</th>
                  <th className="p-3.5">Canale</th>
                  <th className="p-3.5">Modalità</th>
                  <th className="p-3.5">Stato</th>
                  <th className="p-3.5">Totale</th>
                  <th className="p-3.5">Tracking</th>
                  <th className="p-3.5 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusBadge = formatStatusBadge(order.status);
                  const channelBadge = formatChannelBadge(order.channel);
                  const isPickup = order.fulfillmentType === "RITIRO_IN_NEGOZIO";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        #{order.orderNumber}
                        <span className="block text-[10px] font-normal text-slate-400 font-sans">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${channelBadge.bg}`}>
                          {channelBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {isPickup ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                            <Store className="w-3.5 h-3.5" />
                            Ritiro Banco
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                            <Truck className="w-3.5 h-3.5" />
                            Spedizione
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {order.trackingCode ? (
                          <button
                            type="button"
                            onClick={() => setRadarTrackingOrder(order)}
                            className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 flex items-center gap-1 transition-colors cursor-pointer group"
                            title="Apri Radar Tracking Universale"
                          >
                            <span>{order.trackingCode}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={getWhatsAppMessageUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Dettaglio Ordine"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modale Dettaglio Ordine */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Dettaglio Ordine
                </span>
                <h3 className="text-lg font-black text-slate-900">#{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Stato & Canale */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Stato Attuale</span>
                  <p className="text-xs font-bold text-slate-800">
                    {formatStatusBadge(selectedOrder.status).label}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Canale Vendita</span>
                  <p className="text-xs font-bold text-slate-800">
                    {formatChannelBadge(selectedOrder.channel).label}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Data Ricezione</span>
                  <p className="text-xs font-bold text-slate-800">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Dati Cliente */}
              <div className="space-y-1.5 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Anagrafica Cliente
                </span>
                <p className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedOrder.customerPhone}
                </p>
                {selectedOrder.customerEmail && (
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOrder.customerEmail}
                  </p>
                )}
                <p className="text-xs text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {selectedOrder.shippingAddress || "Ritiro in sede al banco"}
                </p>
              </div>

              {/* Box Spedizione & Tracking */}
              {selectedOrder.fulfillmentType === "SPEDIZIONE" && (
                <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-teal-600" />
                      Spedizione Corriere
                    </span>
                    {selectedOrder.trackingCode && (
                      <button
                        type="button"
                        onClick={() => setRadarTrackingOrder(selectedOrder)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Radar ParcelsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {selectedOrder.trackingCode ? (
                    <div className="flex items-center justify-between bg-white border border-teal-100 rounded-xl px-3 py-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Lettera di Vettura
                        </span>
                        <span className="font-mono text-xs font-black text-slate-800">
                          {selectedOrder.trackingCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRadarTrackingOrder(selectedOrder)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Traccia Pacco
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-white/70 border border-teal-100 rounded-xl px-3 py-2">
                      <span>Nessun tracking associato</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingModalOrder(selectedOrder);
                          setInputTrackingCode("");
                          setSelectedCarrierKey("AUTO");
                        }}
                        className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                      >
                        + Aggiungi Tracking
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Capi Acquistati */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Articoli Ordinati
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {item.product?.title || `Prodotto #${item.productId.slice(-6)}`}
                            </p>
                            <p className="text-[10px] text-slate-400">Qtà: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500">Nessun dettaglio articolo</div>
                  )}
                </div>
              </div>

              {/* Totale */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Importo Totale Ordine</span>
                <span className="text-lg font-black text-emerald-700">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>

              {/* Bottoni Cambio Stato Rapido */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Avanzamento Stato Ordine
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "PAGATO")}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                  >
                    In Preparazione
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "PRONTO_RITIRO")}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                  >
                    Pronto al Banco
                  </button>
                  <button
                    onClick={() => {
                      setTrackingModalOrder(selectedOrder);
                      setInputTrackingCode(selectedOrder.trackingCode || "");
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
                  >
                    Spedito (Tracking)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "COMPLETATO")}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Segna Consegnato
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modale Inserimento Tracking Corriere */}
      {trackingModalOrder && (() => {
        const detected = detectCarrier(inputTrackingCode);
        const activeCarrier =
          selectedCarrierKey !== "AUTO" && SUPPORTED_CARRIERS[selectedCarrierKey]
            ? SUPPORTED_CARRIERS[selectedCarrierKey]
            : detected;
        const cleanCode = cleanTrackingCode(inputTrackingCode) || inputTrackingCode.trim();
        const finalTrackingCode =
          selectedCarrierKey !== "AUTO" && cleanCode && !inputTrackingCode.toUpperCase().startsWith(selectedCarrierKey)
            ? `${selectedCarrierKey}-${cleanCode}`
            : inputTrackingCode.trim();

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${activeCarrier.iconBg}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Assegna Lettera di Vettura / Spedizione
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ordine #{trackingModalOrder.orderNumber} • {trackingModalOrder.customerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingModalOrder(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* Selettore Corriere */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Corriere Spedizioniere
                </label>
                <select
                  value={selectedCarrierKey}
                  onChange={(e) => setSelectedCarrierKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="AUTO">🔍 Riconoscimento Automatico (Auto-detect)</option>
                  <option value="GLS">GLS Express Italy</option>
                  <option value="BRT">BRT Bartolini / DPD</option>
                  <option value="POSTE">Poste Italiane / Crono / SDA</option>
                  <option value="INPOST">InPost Locker & Point</option>
                  <option value="DHL">DHL Express</option>
                  <option value="UPS">UPS</option>
                  <option value="SUBITO">TuttoSubito Spedizioni</option>
                  <option value="VINTED">Vinted Spedizioni (InPost / Mondial Relay)</option>
                </select>
              </div>

              {/* Input Codice Tracking */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Codice di Tracciamento / ID Spedizione
                </label>
                <input
                  type="text"
                  placeholder="Es. GLS-99482910IT, BRT-448201993IT, 1Z9999..."
                  value={inputTrackingCode}
                  onChange={(e) => setInputTrackingCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Anteprima Riconoscimento & Link ParcelsApp */}
              {inputTrackingCode.trim() && (
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-teal-800">
                      Corriere Rilevato:
                    </span>
                    <span className="font-bold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-200 text-[11px]">
                      {activeCarrier.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-teal-700 flex items-center gap-1">
                    <span>Tracking Universale ParcelsApp:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[180px]">
                      {getParcelsAppUrl(finalTrackingCode)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(trackingModalOrder.id, "SPEDITO", finalTrackingCode || undefined)
                  }
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Conferma e Spedisci</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Modale Radar Tracking Universale (ParcelsApp Deep-Link) */}
      {radarTrackingOrder && (
        <UniversalTrackingRadar
          order={radarTrackingOrder}
          isOpen={Boolean(radarTrackingOrder)}
          onClose={() => setRadarTrackingOrder(null)}
          storeName={storeName}
          onUpdateStatus={handleUpdateStatus}
          onEditTracking={(o) => {
            setTrackingModalOrder(o);
            setInputTrackingCode(o.trackingCode || "");
            setSelectedCarrierKey("AUTO");
          }}
        />
      )}
    </div>
  );
}
