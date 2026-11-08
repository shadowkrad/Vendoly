import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitPromise: Promise<void> | undefined;
};

function createPrismaClient(): PrismaClient {
  const log: ("warn" | "error")[] = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  // Sulla demo (ramo cliente-demo, Vercel) c'e' prisma/demo.db con clienti, punti e buoni di prova:
  // si copia in una zona scrivibile e si usa quella. Senza demo.db o fuori da Vercel non cambia nulla.
  if (process.env.VERCEL) {
    const demoPath = path.join(process.cwd(), "prisma", "demo.db");
    if (fs.existsSync(demoPath)) {
      const tmpDbPath = path.join("/tmp", "vendoly.db");
      try {
        const copiare =
          !fs.existsSync(tmpDbPath) ||
          fs.statSync(demoPath).mtimeMs > fs.statSync(tmpDbPath).mtimeMs ||
          fs.statSync(demoPath).size !== fs.statSync(tmpDbPath).size;
        if (copiare) fs.copyFileSync(demoPath, tmpDbPath);
        const url = `file:${tmpDbPath}`;
        process.env.DATABASE_URL = url;
        return new PrismaClient({ datasources: { db: { url } }, log });
      } catch (err) {
        console.warn("Avviso copia database demo in /tmp su Vercel:", err);
      }
    }
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

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
      const rispettaCol = Array.isArray(info) && info.some((col) => col.name.toLowerCase() === "rispettafestivitanazionali");
      if (!rispettaCol) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "TenantLocalCache" ADD COLUMN "rispettaFestivitaNazionali" BOOLEAN DEFAULT 1;`);
      }
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "EccezioneCalendario" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "data" TEXT NOT NULL,
          "titolo" TEXT NOT NULL,
          "tipo" TEXT NOT NULL DEFAULT 'CHIUSURA',
          "isAperto" BOOLEAN NOT NULL DEFAULT 0,
          "orarioApertura" TEXT,
          "orarioChiusura" TEXT,
          "pausaInizio" TEXT,
          "pausaFine" TEXT,
          "note" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "EccezioneCalendario_data_key" ON "EccezioneCalendario"("data");
      `);
      const addColumnIfNotExists = async (table: string, column: string, definition: string) => {
        try {
          const info = (await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}");`)) as Array<{ name: string }>;
          const exists = Array.isArray(info) && info.some((col) => col.name.toLowerCase() === column.toLowerCase());
          if (!exists) {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};`);
          }
        } catch {
          // Ignora se la tabella non esiste ancora o la colonna e' presente
        }
      };
      // Orari facoltativi (1.1.2): negozio fisico, orario assistenza oppure nessun orario
      await addColumnIfNotExists("TenantLocalCache", "orariModalita", "TEXT NOT NULL DEFAULT 'NEGOZIO'");
      // Fidelity e buoni (1.1.2): colonne e tabelle nel database dell'attivita'
      await addColumnIfNotExists("Customer", "marketingConsent", "BOOLEAN NOT NULL DEFAULT 0");
      await addColumnIfNotExists("Customer", "birthDate", "DATETIME");
      await addColumnIfNotExists("Customer", "loyaltyToken", "TEXT");

      // Fidelity e buoni (1.1.2): tabelle nel database dell'attivita'
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MovimentoPunti" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "clienteId" TEXT NOT NULL,
          "punti" INTEGER NOT NULL,
          "tipo" TEXT NOT NULL DEFAULT 'ACCREDITO',
          "origine" TEXT,
          "descrizione" TEXT,
          "importo" REAL,
          "appuntamentoId" TEXT,
          "premioId" TEXT,
          "saldoDopo" INTEGER,
          "operatore" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MovimentoPunti_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GiftCard" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "codice" TEXT NOT NULL,
          "importoIniziale" REAL NOT NULL,
          "saldoResiduo" REAL NOT NULL,
          "acquirenteNome" TEXT NOT NULL,
          "acquirenteEmail" TEXT,
          "acquirenteTelefono" TEXT,
          "beneficiarioNome" TEXT NOT NULL,
          "beneficiarioMessaggio" TEXT,
          "dataScadenza" DATETIME,
          "stato" TEXT NOT NULL DEFAULT 'ATTIVA',
          "motivo" TEXT NOT NULL DEFAULT 'REGALO',
          "tipoValore" TEXT NOT NULL DEFAULT 'IMPORTO',
          "percentuale" REAL,
          "descrizioneServizio" TEXT,
          "clienteId" TEXT,
          "spesaMinima" REAL,
          "usoParziale" BOOLEAN NOT NULL DEFAULT 1,
          "note" TEXT,
          "tokenPubblico" TEXT,
          "creatoDa" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MovimentoGiftCard" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "giftCardId" TEXT NOT NULL,
          "importo" REAL NOT NULL,
          "tipo" TEXT,
          "saldoDopo" REAL,
          "operatore" TEXT,
          "note" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MovimentoGiftCard_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      const indici = [
        `CREATE UNIQUE INDEX IF NOT EXISTS "Customer_loyaltyToken_key" ON "Customer"("loyaltyToken")`,
        `CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoPunti_clienteId_idx" ON "MovimentoPunti"("clienteId")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoPunti_appuntamentoId_idx" ON "MovimentoPunti"("appuntamentoId")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_codice_key" ON "GiftCard"("codice")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_tokenPubblico_key" ON "GiftCard"("tokenPubblico")`,
        `CREATE INDEX IF NOT EXISTS "GiftCard_stato_idx" ON "GiftCard"("stato")`,
        `CREATE INDEX IF NOT EXISTS "GiftCard_clienteId_idx" ON "GiftCard"("clienteId")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoGiftCard_giftCardId_idx" ON "MovimentoGiftCard"("giftCardId")`,
      ];
      for (const sql of indici) {
        await prisma.$executeRawUnsafe(sql).catch(() => {});
      }

    } catch (err) {
      // Ignora se la tabella non esiste ancora o la colonna è già stata creata
    }
  })();

  return globalForPrisma.dbInitPromise;
}

// Avvio inizializzazione automatica asincrona
ensureDatabase().catch(() => {});
