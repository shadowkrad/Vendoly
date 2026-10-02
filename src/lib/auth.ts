import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "vendoly_admin_session";
const DEFAULT_PIN =
  process.env.ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PASSWORD ||
  "1234";

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
}

export { ADMIN_COOKIE_NAME };
