/**
 * Taaaac Core Client - Sincronizzazione Feature Flags & Configurazione Tenant per Vendoly
 */

export interface TenantTheme {
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  surfaceColor?: string;
}

export interface TenantConfig {
  id: string;
  nomeAttivita: string;
  sottodominio: string;
  modulo: string;
  piano: string;
  stato: string;
  dataScadenza: string | null;
  moduliAttivi: string[];
  tokenDisponibili: number;
  theme?: TenantTheme;
  customDomain?: string | null;
  customDomainStatus?: string | null;
}

export const TAAAAC_ADDONS = {
  LOYALTY_CARD: "LOYALTY_CARD",
  MARKETING_1CLICK: "MARKETING_1CLICK",
  GIFT_CARDS: "GIFT_CARDS",
  GOOGLE_REVIEWS: "GOOGLE_REVIEWS",
  WHATSAPP_REMINDERS: "WHATSAPP_REMINDERS",
  VENDOLY_CHANNEL_MANAGER: "VENDOLY_CHANNEL_MANAGER",
} as const;

export type TaaaacAddonId = keyof typeof TAAAAC_ADDONS;

const ALL_DEV_ADDONS = [
  TAAAAC_ADDONS.LOYALTY_CARD,
  TAAAAC_ADDONS.MARKETING_1CLICK,
  TAAAAC_ADDONS.GIFT_CARDS,
  TAAAAC_ADDONS.GOOGLE_REVIEWS,
  TAAAAC_ADDONS.VENDOLY_CHANNEL_MANAGER,
];

const DEFAULT_DEV_CONFIG: TenantConfig = {
  id: "dev-tenant",
  nomeAttivita: "Vendoly Store (Dev)",
  sottodominio: "vendoly",
  modulo: "vendoly",
  piano: "PRO",
  stato: "ATTIVO",
  dataScadenza: null,
  moduliAttivi: ALL_DEV_ADDONS,
  tokenDisponibili: 10,
  theme: {
    primaryColor: "#059669",
    accentColor: "#10b981",
    secondaryColor: "#047857",
    surfaceColor: "#f8fafc",
  },
};

export function resolveTenantDomain(hostHeader?: string | null): string {
  if (process.env.TAAAAC_TENANT_DOMAIN?.trim()) {
    return process.env.TAAAAC_TENANT_DOMAIN.trim();
  }

  if (hostHeader?.trim()) {
    const cleanHost = hostHeader.split(":")[0].trim().toLowerCase();
    if (cleanHost && !cleanHost.includes("localhost") && !cleanHost.includes("127.0.0.1")) {
      return cleanHost;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      const host = parsed.hostname.toLowerCase();
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        return host;
      }
    } catch {
      // ignore
    }
  }

  return "negozio-demo.taaaac.eu";
}

export async function fetchTenantConfig(domain?: string): Promise<TenantConfig> {
  const targetDomain = domain || resolveTenantDomain();
  const isLocalDev =
    process.env.NODE_ENV === "development" ||
    targetDomain.includes("localhost") ||
    targetDomain.includes("127.0.0.1");

  const coreApiUrl = process.env.TAAAAC_CORE_URL?.trim() || "https://taaaac.eu";

  try {
    const endpoint = `${coreApiUrl}/api/public/tenant-config?domain=${encodeURIComponent(targetDomain)}`;
    
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.tenant) {
        return data.tenant as TenantConfig;
      }
    }
  } catch (err: any) {
    console.warn(`[TaaaacClient] Vendoly fallback per (${coreApiUrl}):`, err?.message || err);
  }

  if (isLocalDev) {
    return DEFAULT_DEV_CONFIG;
  }

  return {
    id: "offline-tenant",
    nomeAttivita: "Vendoly Store",
    sottodominio: targetDomain.replace(/\.taaaac\.eu.*$/, ""),
    modulo: "vendoly",
    piano: "STANDARD",
    stato: "ATTIVO",
    dataScadenza: null,
    moduliAttivi: [],
    tokenDisponibili: 0,
  };
}

export function isAddonActive(config: TenantConfig | null | undefined, addonId: string): boolean {
  if (!config || !Array.isArray(config.moduliAttivi)) return false;
  return config.moduliAttivi.includes(addonId);
}
