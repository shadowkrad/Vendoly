"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: "info" | "success" | "warning" | "addon";
  actionHref?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-v-1",
    title: "Nuovo Ordine Ricevuto",
    message: "Ordine #ORD-1082 confermato da Vetrina Online.",
    timestamp: "10 min fa",
    read: false,
    type: "success",
    actionHref: "/dashboard/ordini",
  },
  {
    id: "notif-v-2",
    title: "Sincronizzazione Marketplace",
    message: "Catalogo sincronizzato con successo con Subito.it e Vinted.",
    timestamp: "1 ora fa",
    read: false,
    type: "addon",
    actionHref: "/dashboard/canali",
  },
  {
    id: "notif-v-3",
    title: "Giacenza Minima Raggiunta",
    message: "3 prodotti sono in esaurimento scorte nel magazzino.",
    timestamp: "Ieri",
    read: true,
    type: "warning",
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

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.map((n) => n.id)));
    } catch {
      // ignore
    }
  };

  const markAsRead = (id: string) => {
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
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-900/60 transition-colors focus:outline-hidden"
        aria-label="Notifiche"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-emerald-950 animate-pulse" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute z-50 w-80 sm:w-96 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden top-full mt-2 ${
              placement === "topbar" ? "right-0" : "left-0"
            }`}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Centro Notifiche</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 font-medium transition"
                >
                  <Check className="w-3 h-3" />
                  Segna tutte come lette
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nessuna notifica presente
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                      n.read ? "opacity-60 bg-white" : "bg-emerald-50/40"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                        n.read ? "bg-transparent" : "bg-emerald-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      {n.actionHref && (
                        <Link
                          href={n.actionHref}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline mt-1.5"
                        >
                          Visualizza dettaglio
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Notifiche sincrone Taaaac Ecosystem
            </div>
          </div>
        </>
      )}
    </div>
  );
}
