import { prisma } from "./db";
import { TenantConfigResponse, TaaaacModuleKey } from "@/types/taaaac";

const FALLBACK_CONFIG: TenantConfigResponse = {
  domain: process.env.TAAAAC_TENANT_DOMAIN || "vendoly-demo.taaaac.eu",
  licenseStatus: "ATTIVO",
  licenseExpiresAt: "2027-12-31T23:59:59Z",
  enabledModules: [
    "WHATSAPP_REMINDERS",
    "LOYALTY_CARD",
    "VENDOLY_CHANNEL_MANAGER",
    "ONLINE_CATALOG",
  ],
  theme: {
    brandName: "Vendoly Retail Store",
    primaryColor: "#0f172a",
    accentColor: "#059669",
    logoUrl: null,
  },
  contact: {
    email: "support@vendoly.taaaac.eu",
    phone: "+39 02 8901 5678",
  },
};

/**
 * Recupera la configurazione del tenant interrogando Taaaac Core (https://taaaac.eu)
 * con fallback trasparente sulla cache SQLite locale e modalità demo/resilienza offline.
 */
export async function getTenantConfig(): Promise<TenantConfigResponse> {
  const coreUrl = process.env.TAAAAC_CORE_URL || "https://taaaac.eu";
  const domain = process.env.TAAAAC_TENANT_DOMAIN || "vendoly-demo.taaaac.eu";
  const token = process.env.TAAAAC_TENANT_TOKEN || "demo-token-vendoly";

  try {
    const endpoint = `${coreUrl}/api/public/tenant-config?domain=${encodeURIComponent(
      domain
    )}&token=${encodeURIComponent(token)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Cache per 5 minuti
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      // Se la risposta segue lo schema Taaaac Core { success: true, tenant: { ... } }
      const tenantData = data.tenant || data;

      const normalized: TenantConfigResponse = {
        domain: tenantData.sottodominio ? `${tenantData.sottodominio}.taaaac.eu` : domain,
        licenseStatus: (tenantData.stato as any) || "ATTIVO",
        licenseExpiresAt: tenantData.dataScadenza || undefined,
        enabledModules: Array.isArray(tenantData.moduliAttivi)
          ? tenantData.moduliAttivi
          : FALLBACK_CONFIG.enabledModules,
        theme: {
          brandName: tenantData.nomeAttivita || FALLBACK_CONFIG.theme.brandName,
          primaryColor: tenantData.primaryColor || FALLBACK_CONFIG.theme.primaryColor,
          accentColor: tenantData.accentColor || FALLBACK_CONFIG.theme.accentColor,
          logoUrl: tenantData.logoUrl || null,
        },
        contact: {
          email: tenantData.contactEmail || FALLBACK_CONFIG.contact?.email,
          phone: tenantData.phone || FALLBACK_CONFIG.contact?.phone,
        },
      };

      // Aggiorna cache SQLite asincronamente
      await cacheTenantLocally(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn(
      "⚠️ Taaaac Core non raggiungibile o offline, utilizzo fallback/cache SQLite locale:",
      (err as Error).message
    );
  }

  // Fallback: Prova a leggere dalla cache SQLite
  try {
    const cached = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (cached) {
      let modules: TaaaacModuleKey[] = [];
      try {
        modules = JSON.parse(cached.enabledModules);
      } catch {
        modules = FALLBACK_CONFIG.enabledModules;
      }

      return {
        domain: cached.domain,
        licenseStatus: cached.licenseStatus as any,
        enabledModules: modules,
        theme: {
          brandName: cached.brandName,
          primaryColor: cached.primaryColor,
          accentColor: cached.accentColor,
          logoUrl: cached.logoUrl,
        },
        contact: {
          email: cached.contactEmail || undefined,
          phone: cached.phone || undefined,
        },
      };
    }
  } catch (dbErr) {
    console.error("Errore lettura cache SQLite:", dbErr);
  }

  return FALLBACK_CONFIG;
}

async function cacheTenantLocally(config: TenantConfigResponse) {
  try {
    await prisma.tenantLocalCache.upsert({
      where: { id: "singleton" },
      update: {
        domain: config.domain,
        licenseStatus: config.licenseStatus,
        enabledModules: JSON.stringify(config.enabledModules),
        brandName: config.theme.brandName,
        logoUrl: config.theme.logoUrl,
        primaryColor: config.theme.primaryColor,
        accentColor: config.theme.accentColor,
        contactEmail: config.contact?.email,
        phone: config.contact?.phone,
        lastSyncedAt: new Date(),
      },
      create: {
        id: "singleton",
        domain: config.domain,
        licenseStatus: config.licenseStatus,
        enabledModules: JSON.stringify(config.enabledModules),
        brandName: config.theme.brandName,
        logoUrl: config.theme.logoUrl,
        primaryColor: config.theme.primaryColor,
        accentColor: config.theme.accentColor,
        contactEmail: config.contact?.email,
        phone: config.contact?.phone,
        lastSyncedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("Impossibile salvare cache tenant su SQLite:", e);
  }
}
