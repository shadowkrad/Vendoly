import { isDemoEnvironment } from "@/lib/auth";

/** Ambiente demo: li' le email non partono davvero (si simulano). `host` e' quello della richiesta, se c'e'. */
export function eAmbienteDemo(host?: string | null): boolean {
  return isDemoEnvironment(host) || process.env.VERCEL === "1";
}
