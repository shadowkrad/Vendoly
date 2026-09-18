import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "vendoly_admin_session";
const DEFAULT_PIN = process.env.ADMIN_PIN || "1234";

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

export { ADMIN_COOKIE_NAME };
