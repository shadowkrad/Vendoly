import crypto from "crypto";
import { prisma, ensureDatabase } from "@/lib/db";

export interface SorgentiIconaPwa {
  faviconUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  v: string;
}

/** Primi 8 caratteri SHA-1 di `faviconUrl|logoUrl` per invalidare la cache a ogni cambio icona/logo. */
export function calcolaHashIcona(faviconUrl?: string | null, logoUrl?: string | null): string {
  const raw = `${(faviconUrl || "").trim()}|${(logoUrl || "").trim()}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 8);
}

/** Primi 8 caratteri SHA-1 per l'icona della tessera fedeltà digitale (`/tessera/[token]/icona`). */
export function calcolaHashLogoTessera(
  logoUrl?: string | null,
  accento?: string | null,
  nome?: string | null
): string {
  const raw = `${(logoUrl || "").trim()}|${(accento || "").trim()}|${(nome || "").trim()}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 8);
}

/** Costruisce l'URL versionato verso `/api/pwa-icon`. */
export function pwaIconUrl(size: number, v: string, opts?: { maskable?: boolean }): string {
  const mask = opts?.maskable ? "&maskable=1" : "";
  const ver = v ? `&v=${encodeURIComponent(v)}` : "";
  return `/api/pwa-icon?size=${size}${mask}${ver}`;
}

/** Legge favicon, logo e colori del punto vendita da `TenantLocalCache` e calcola il codice versione `v`. */
export async function leggiSorgentiIconaPwa(): Promise<SorgentiIconaPwa> {
  let faviconUrl: string | null = null;
  let logoUrl: string | null = null;
  let primaryColor = "#0f172a";
  let accentColor = "#059669";

  try {
    await ensureDatabase();
    const cache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (cache) {
      if (cache.primaryColor?.trim()) primaryColor = cache.primaryColor.trim();
      if (cache.accentColor?.trim()) accentColor = cache.accentColor.trim();
      if (cache.faviconUrl?.trim()) faviconUrl = cache.faviconUrl.trim();
      if (cache.logoUrl?.trim()) logoUrl = cache.logoUrl.trim();
    }
  } catch {
    // fallback sicuro se DB non ancora pronto
  }

  return {
    faviconUrl,
    logoUrl,
    primaryColor,
    accentColor,
    v: calcolaHashIcona(faviconUrl, logoUrl),
  };
}

export async function getPwaIconVersion(): Promise<string> {
  const s = await leggiSorgentiIconaPwa();
  return s.v;
}
