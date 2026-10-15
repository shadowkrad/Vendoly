/**
 * Taaaac Suite — Omnichannel & Review Booster Client Helper per Vendoly.
 * Comunica con il micro-servizio centralizzato Taaaac Core per la sincronizzazione
 * di orari/ferie su Google Maps e Meta, e per l'invio del Review Booster via email.
 */

export interface OmnichannelWeeklySlot {
  open: string;
  close: string;
}

export interface OmnichannelDayHours {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  isOpen: boolean;
  slots: OmnichannelWeeklySlot[];
}

export interface OmnichannelSpecialClosure {
  startDate: string;
  endDate: string;
  reason?: string;
  isClosedAllDay: boolean;
}

export interface SyncChannelsResult {
  ok: boolean;
  summary?: string;
  channels?: any;
  error?: string;
}

export interface OmnichannelStatusResult {
  ok: boolean;
  channels?: {
    google?: { enabled: boolean; status: string; lastSyncAt?: string | null };
    meta?: { enabled: boolean; status: string; lastSyncAt?: string | null };
    whatsapp?: { enabled: boolean; displayNumber?: string | null };
    reviewBooster?: { enabled: boolean; totalSent: number; googleUrl?: string | null };
  };
  lastOmnichannelSyncAt?: string | null;
  error?: string;
}

function getCoreUrls(): string[] {
  return [
    process.env.TAAAAC_INTERNAL_URL || "http://taaaac-core:3000",
    process.env.TAAAAC_CORE_URL || "https://taaaac.eu",
  ];
}

function getTargetDomain(): string {
  if (process.env.TAAAAC_TENANT_DOMAIN) {
    return process.env.TAAAAC_TENANT_DOMAIN;
  }
  if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.includes("taaaac.eu")) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
  }
  return "vendoly.taaaac.eu";
}

/**
 * Invia orari ordinari e speciali a Taaaac Core per sincronizzazione all'unisono
 */
export async function syncOmnichannelChannels(params: {
  weeklyHours: OmnichannelDayHours[];
  specialClosures?: OmnichannelSpecialClosure[];
}): Promise<SyncChannelsResult> {
  const coreUrls = getCoreUrls();
  const tenantDomain = getTargetDomain();
  let lastError = "Impossibile contattare Taaaac Core Sync Hub";

  for (const baseUrl of coreUrls) {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/internal/sync/channels`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
        },
        body: JSON.stringify({
          tenantDomain,
          weeklyHours: params.weeklyHours,
          specialClosures: params.specialClosures || [],
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return { ok: true, summary: data.summary, channels: data.channels };
      } else {
        lastError = data.error || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Errore di connessione Core";
    }
  }

  // Fallback dev
  if (process.env.NODE_ENV === "development") {
    console.warn("[Vendoly Sync Dev] Fallback simulazione sinc canali");
    return {
      ok: true,
      summary: "Sincronizzazione canali completata con successo (Simulazione Locale)",
      channels: {
        google: { ok: true, message: "Google Maps aggiornato (Dev)" },
        meta: { ok: true, message: "Facebook & Instagram aggiornati (Dev)" },
        whatsapp: { ok: true, message: "WhatsApp aggiornato (Dev)" },
        localShowcase: { ok: true, message: "Vetrina locale aggiornata" },
      },
    };
  }

  return { ok: false, error: lastError };
}

/**
 * Recupera lo stato di connessione dei canali dal Core
 */
export async function fetchOmnichannelStatus(): Promise<OmnichannelStatusResult> {
  const coreUrls = getCoreUrls();
  const tenantDomain = getTargetDomain();

  for (const baseUrl of coreUrls) {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/internal/sync/status?domain=${encodeURIComponent(tenantDomain)}`;
      const res = await fetch(endpoint, {
        headers: {
          "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return {
          ok: true,
          channels: data.channels,
          lastOmnichannelSyncAt: data.lastOmnichannelSyncAt,
        };
      }
    } catch {}
  }

  return {
    ok: true,
    channels: {
      google: { enabled: false, status: "NON_COLLEGATO" },
      meta: { enabled: false, status: "NON_COLLEGATO" },
      whatsapp: { enabled: true, displayNumber: "+39 02 1234567" },
      reviewBooster: { enabled: true, totalSent: 0 },
    },
  };
}

/**
 * Scatena l'invio dell'email Google Review Booster al completamento dell'ordine
 */
export async function triggerGoogleReviewBooster(params: {
  clientEmail: string;
  clientName: string;
  serviceName?: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const coreUrls = getCoreUrls();
  const tenantDomain = getTargetDomain();

  for (const baseUrl of coreUrls) {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/internal/review-booster/trigger`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
        },
        body: JSON.stringify({
          tenantDomain,
          clientEmail: params.clientEmail,
          clientName: params.clientName,
          serviceName: params.serviceName,
        }),
        signal: AbortSignal.timeout(6000),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return { ok: true, message: data.message };
      }
    } catch (err: any) {
      console.error("[Vendoly Review Booster Core Connect Error]:", err.message);
    }
  }

  return { ok: false, error: "Impossibile contattare Core per Review Booster" };
}
