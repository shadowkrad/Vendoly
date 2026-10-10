"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  Package,
  Globe,
  AlertTriangle,
  ExternalLink,
  X,
  RotateCw,
} from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: "order" | "channel" | "stock" | "info";
  actionHref?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-v-1",
    title: "Nuovo Ordine Ricevuto",
    message: "Ordine #ORD-1082 confermato da Vetrina Online.",
    timestamp: "10 min fa",
    read: false,
    type: "order",
    actionHref: "/dashboard/ordini",
  },
  {
    id: "notif-v-2",
    title: "Sincronizzazione Marketplace",
    message: "Catalogo sincronizzato con successo con Subito.it e Vinted.",
    timestamp: "1 ora fa",
    read: false,
    type: "channel",
    actionHref: "/dashboard/canali",
  },
  {
    id: "notif-v-3",
    title: "Giacenza Minima Raggiunta",
    message: "3 prodotti sono in esaurimento scorte nel magazzino.",
    timestamp: "Ieri",
    read: true,
    type: "stock",
    actionHref: "/dashboard/prodotti",
  },
];

const STORAGE_KEY = "vendoly_read_notifications";

export default function NotificationBell({
  placement = "sidebar",
}: {
  placement?: "sidebar" | "topbar";
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "order" | "channel" | "stock">("ALL");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const readIds: string[] = JSON.parse(stored);
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read: n.read || readIds.includes(n.id),
          }))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = useCallback(() => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.map((n) => n.id)));
    } catch {
      // ignore
    }
  }, [notifications]);

  const markAsRead = useCallback((id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: string[] = stored ? JSON.parse(stored) : [];
      if (!current.includes(id)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
      }
    } catch {
      // ignore
    }
  }, [notifications]);

  // Chiudi cliccando fuori
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    return n.type === filter;
  });

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Icona Campanella */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-900/60 transition-colors focus:outline-hidden cursor-pointer flex items-center justify-center shrink-0"
        aria-label="Notifiche Vendoly"
        title={unreadCount > 0 ? `${unreadCount} nuove notifiche` : "Nessuna nuova notifica"}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-black text-white items-center justify-center shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown con posizionamento allineato a Schedly e Tavoly */}
      {open && (
        <>
          {/* Backdrop mobile per chiudere facilmente al tap fuori */}
          <div
            className="fixed inset-0 bg-slate-950/40 z-40 md:hidden backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />

          <div
            className={
              placement === "sidebar"
                ? "fixed inset-x-3 top-16 max-w-sm mx-auto md:max-w-none md:mx-0 md:fixed md:left-[268px] md:top-4 md:w-96 md:inset-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
                : "fixed inset-x-3 top-14 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:inset-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            }
          >
            {/* Header Popover */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    Notifiche & Attività
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    {unreadCount > 0 ? `${unreadCount} da verificare` : "Tutto aggiornato"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    Segna lette ✓
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtri Notifiche */}
            <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
              {[
                { key: "ALL", label: "Tutte" },
                { key: "order", label: "📦 Ordini" },
                { key: "channel", label: "🛍️ Canali" },
                { key: "stock", label: "⚠️ Scorte" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key as any)}
                  className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer ${
                    filter === t.key
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Lista Notifiche */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <span className="text-3xl block">✨</span>
                  <p className="text-xs font-semibold text-slate-700">Nessuna notifica in questa sezione</p>
                  <p className="text-[10px] text-slate-400">Tutte le vendite e i canali sono in ordine!</p>
                </div>
              ) : (
                filtered.map((n) => {
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-emerald-50/50 flex items-start gap-3 ${
                        n.read ? "opacity-75 bg-white" : "bg-emerald-50/30"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5 border shadow-2xs ${
                          n.type === "order"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : n.type === "channel"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        {n.type === "order" ? (
                          <Package className="w-4 h-4" />
                        ) : n.type === "channel" ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        {n.actionHref && (
                          <Link
                            href={n.actionHref}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline mt-1"
                          >
                            <span>Dettagli</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/dashboard/ordini"
                onClick={() => setOpen(false)}
                className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline px-2"
              >
                Tutti gli ordini →
              </Link>
              <span className="text-[10px] text-slate-400 font-medium px-2">
                Vendoly Hub
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
