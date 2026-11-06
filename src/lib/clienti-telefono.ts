import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

export interface ClienteTrovato {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * Cerca un cliente con lo stesso numero, qualunque sia il formato in cui e' stato salvato
 * (es. "+39 333 1122334", "333-1122334", "3331122334", "0039 333 1122334").
 * Si confrontano solo le cifre, senza spazi, trattini, punti, parentesi e "+".
 */
export async function cercaClientePerTelefono(raw: string, escludiId?: string): Promise<ClienteTrovato | null> {
  const n = normalizePhone(raw);
  if (!n || n.length < 6) return null;
  const varianti = [n, `39${n}`, `0039${n}`];
  const segnaposto = varianti.map(() => "?").join(",");
  const righe = (await prisma.$queryRawUnsafe(
    `SELECT "id", "firstName", "lastName", "phone" FROM "Customer"
     WHERE "phone" != 'CANCELLATO'
       AND replace(replace(replace(replace(replace(replace("phone", ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') IN (${segnaposto})
       ${escludiId ? 'AND "id" != ?' : ""}
     LIMIT 1`,
    ...varianti,
    ...(escludiId ? [escludiId] : [])
  )) as ClienteTrovato[];
  return righe[0] ?? null;
}
