import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitPromise: Promise<void> | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Assicura che le colonne e tabelle necessarie per la Vetrina Interattiva v1.0.4
 * esistano nel database SQLite locale senza crashare su Vercel o ambienti esistenti.
 */
export async function ensureDatabase(): Promise<void> {
  if (globalForPrisma.dbInitPromise) {
    return globalForPrisma.dbInitPromise;
  }

  globalForPrisma.dbInitPromise = (async () => {
    try {
      const info = (await prisma.$queryRawUnsafe(`PRAGMA table_info("TenantLocalCache");`)) as Array<{ name: string }>;
      const exists = Array.isArray(info) && info.some((col) => col.name.toLowerCase() === "showcaseconfig");
      if (!exists) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "TenantLocalCache" ADD COLUMN "showcaseConfig" TEXT DEFAULT '{}';`);
      }
    } catch (err) {
      // Ignora se la tabella non esiste ancora o la colonna è già stata creata
    }
  })();

  return globalForPrisma.dbInitPromise;
}

// Avvio inizializzazione automatica asincrona
ensureDatabase().catch(() => {});
