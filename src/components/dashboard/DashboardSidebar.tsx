"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { TaaaacLogo } from "@/components/common/TaaaacLogo";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Globe,
  Store,
  Users,
  Settings,
  Gift,
  Award,
  Share2,
  Star,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const baseNavLinks = [
  { href: "/dashboard", label: "Panoramica & KPI", icon: LayoutDashboard },
  { href: "/dashboard/prodotti", label: "Catalogo & Scorte", icon: Package },
  { href: "/dashboard/ordini", label: "Ordini & Spedizioni", icon: ShoppingBag },
  { href: "/dashboard/canali", label: "Canali & Marketplace", icon: Globe },
  { href: "/dashboard/cassa", label: "Cassa Veloce POS", icon: Store },
  { href: "/dashboard/clienti", label: "Clienti (CRM)", icon: Users },
];

const addonNavLinks = [
  {
    addonId: TAAAAC_ADDONS.LOYALTY_CARD,
    href: "/dashboard/fedelta",
    label: "Raccolta Punti",
    icon: Award,
    badge: "Fidelity",
  },
  {
    addonId: TAAAAC_ADDONS.MARKETING_1CLICK,
    href: "/dashboard/marketing",
    label: "Marketing 1-Click",
    icon: Share2,
    badge: "Promo",
  },
  {
    addonId: TAAAAC_ADDONS.GIFT_CARDS,
    href: "/dashboard/gift-cards",
    label: "Buoni Regalo",
    icon: Gift,
    badge: "Voucher",
  },
  {
    addonId: TAAAAC_ADDONS.GOOGLE_REVIEWS,
    href: "/dashboard/recensioni",
    label: "Recensioni Google",
    icon: Star,
    badge: "Rating",
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAddonActive, config } = useTenantConfig();

  const activeAddons = addonNavLinks.filter((item) => isAddonActive(item.addonId));

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0">
          <TaaaacLogo iconSize={20} textSize="text-base" showBadge={true} badgeText="Vendoly" />
        </Link>
        <div className="flex items-center gap-1.5">
          <NotificationBell placement="topbar" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col h-[100dvh] max-h-[100dvh] transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0 flex-1">
            <TaaaacLogo iconSize={22} textSize="text-base" showBadge={true} badgeText="Vendoly" />
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell placement="sidebar" />
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="px-3 py-2.5 mx-3 my-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center shrink-0 shadow-xs">
            🛍️
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {config?.nomeAttivita || "Vendoly Retail Store"}
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">Retail & Multi-Canale</p>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
            Gestione Negozio
          </p>
          {baseNavLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Add-ons Section */}
          {activeAddons.length > 0 && (
            <div className="pt-4 pb-1 px-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-1">
                <span>Moduli Attivi</span>
                <span className="text-emerald-400 font-extrabold text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded-full">
                  ⚡ Taaaac
                </span>
              </div>
              <div className="space-y-1 mt-1 -mx-3">
                {activeAddons.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-800 text-emerald-300">
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Footer Section */}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Configurazione
            </p>
            <Link
              href="/dashboard/impostazioni"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive("/dashboard/impostazioni")
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Impostazioni & Canali</span>
            </Link>
          </div>
        </nav>

        {/* Bottom Bar: Link Vetrina & Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white text-xs transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Vedi Vetrina Pubblica
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <div className="text-[10px] text-slate-400/60 text-center font-mono">
            Vendoly Core · Taaaac Engine
          </div>
        </div>
      </aside>
    </>
  );
}
