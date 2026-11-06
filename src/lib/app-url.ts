/** Indirizzo pubblico del sito per i link nelle email (senza richiesta HTTP, es. dagli automatismi). */
export function appUrl(): string {
  const dichiarato = process.env.NEXT_PUBLIC_APP_URL;
  if (dichiarato) return dichiarato.replace(/\/$/, "");
  const dominio = process.env.TAAAAC_TENANT_DOMAIN;
  if (dominio) return `https://${dominio}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Indirizzo pubblico ricavato da una richiesta (usa l'host inoltrato dal proxy). */
export function appUrlDaRichiesta(req: Request): string {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  if (!host) return appUrl();
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
