import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "vendoly_admin_session";
const MAINTENANCE_COOKIE_NAME = "vendoly_maintenance_session";

const DEFAULT_PIN =
  process.env.ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PASSWORD ||
  "1234";

export interface MaintenanceSessionData {
  isMaintenance: boolean;
  adminNome: string;
  adminEmail: string;
  motivo: string;
  sessionId: string;
  startedAt?: string;
}

/**
 * Verifica se l'utente possiede una sessione di amministrazione valida (Issue #5)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  return session?.value === "authenticated_admin";
}

/**
 * Valida il PIN fornito rispetto alla configurazione o al default 1234
 */
export function verifyAdminPin(inputPin: string): boolean {
  return inputPin.trim() === DEFAULT_PIN.trim();
}

/**
 * Imposta il cookie di sessione amministratore (validità 30 giorni)
 */
export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "authenticated_admin", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
    path: "/",
  });
}

/**
 * Elimina la sessione amministratore corrente
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(MAINTENANCE_COOKIE_NAME);
}

/**
 * Valida un token di manutenzione temporaneo con Taaaac Core via API interna sicura
 */
export async function verifyMaintenanceTokenWithCore(token: string): Promise<any | null> {
  const coreApiUrl =
    process.env.TAAAAC_CORE_API_URL?.trim() ||
    process.env.TAAAAC_CORE_URL?.trim() ||
    "https://taaaac.eu";

  try {
    const res = await fetch(`${coreApiUrl}/api/internal/maintenance/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid && data.session) {
        return data.session;
      }
    } else {
      console.warn(`[MaintenanceAuth] Risposta non 200 da Taaaac Core: status ${res.status}`);
    }
  } catch (err: any) {
    console.error("[MaintenanceAuth] Errore verifica token con Taaaac Core:", err?.message || err);
  }
  return null;
}

/**
 * Recupera i metadati della sessione di manutenzione attiva dal cookie
 */
export async function getMaintenanceSession(): Promise<MaintenanceSessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(MAINTENANCE_COOKIE_NAME);
  if (!session?.value) return null;
  try {
    return JSON.parse(session.value) as MaintenanceSessionData;
  } catch {
    return null;
  }
}

/**
 * Imposta il cookie di tracciamento manutenzione attiva
 */
export async function setMaintenanceSession(data: MaintenanceSessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MAINTENANCE_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 ore max
    path: "/",
  });
}

/**
 * Rimuove il cookie di manutenzione attiva
 */
export async function clearMaintenanceSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MAINTENANCE_COOKIE_NAME);
}

export { ADMIN_COOKIE_NAME, MAINTENANCE_COOKIE_NAME };

