import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Buoni di Schedly (tabella GiftCard, estesa): regalo, sconto, compensazione, gesto commerciale,
 * premio punti, compleanno, promozione. Valore in euro, in percentuale o un servizio in omaggio.
 * Scadenza facoltativa (dataScadenza vuota = senza scadenza). Vivono nel database dell'attivita'.
 */

export const MOTIVI = [
  "REGALO",
  "SCONTO",
  "COMPENSAZIONE",
  "GESTO_COMMERCIALE",
  "PREMIO_PUNTI",
  "COMPLEANNO",
  "PROMOZIONE",
] as const;
export type MotivoBuono = (typeof MOTIVI)[number];

export const ETICHETTA_MOTIVO: Record<MotivoBuono, string> = {
  REGALO: "Buono regalo",
  SCONTO: "Buono sconto",
  COMPENSAZIONE: "Compensazione (errore o disservizio)",
  GESTO_COMMERCIALE: "Gesto commerciale",
  PREMIO_PUNTI: "Premio punti",
  COMPLEANNO: "Buono compleanno",
  PROMOZIONE: "Promozione",
};

export type TipoValore = "IMPORTO" | "PERCENTUALE" | "SERVIZIO";

/** Codice corto da dettare o scrivere in cassa (31 simboli senza caratteri ambigui). */
export function generaCodiceBuono(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 10; i++) r += chars.charAt(randomInt(0, chars.length));
  return `BUO-${r.slice(0, 5)}-${r.slice(5)}`;
}

/** Link privato lungo, non indovinabile: per la pagina pubblica del buono (invio e stampa). */
export function generaTokenBuono(): string {
  return randomBytes(18).toString("base64url");
}

export interface EmissioneBuono {
  motivo: MotivoBuono;
  tipoValore: TipoValore;
  importo?: number | null; // euro (IMPORTO)
  percentuale?: number | null; // 1-100 (PERCENTUALE)
  descrizioneServizio?: string | null; // (SERVIZIO)
  mesiValidita?: number | null; // null = senza scadenza
  dataScadenza?: Date | null; // alternativa ai mesi
  clienteId?: string | null;
  spesaMinima?: number | null;
  usoParziale?: boolean;
  note?: string | null;
  // Buono regalo: chi lo compra e per chi
  acquirenteNome?: string | null;
  acquirenteEmail?: string | null;
  acquirenteTelefono?: string | null;
  beneficiarioNome?: string | null;
  beneficiarioMessaggio?: string | null;
  operatore?: string | null;
}

/** `tx`: se si e' gia' dentro una transazione (es. premio punti) il buono nasce nella stessa operazione. */
export async function emettiBuono(input: EmissioneBuono, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  if (!MOTIVI.includes(input.motivo)) throw new Error("Motivo non valido");

  let importo = 0;
  let percentuale: number | null = null;
  let descrizioneServizio: string | null = null;
  if (input.tipoValore === "IMPORTO") {
    importo = Number(input.importo);
    if (!Number.isFinite(importo) || importo <= 0) throw new Error("L'importo deve essere maggiore di zero");
    importo = Math.round(importo * 100) / 100;
  } else if (input.tipoValore === "PERCENTUALE") {
    percentuale = Number(input.percentuale);
    if (!Number.isFinite(percentuale) || percentuale <= 0 || percentuale > 100) {
      throw new Error("La percentuale deve essere tra 1 e 100");
    }
  } else if (input.tipoValore === "SERVIZIO") {
    descrizioneServizio = (input.descrizioneServizio || "").trim();
    if (!descrizioneServizio) throw new Error("Indica il servizio in omaggio");
  } else {
    throw new Error("Tipo di valore non valido");
  }

  let cliente: { id: string; nome: string; cognome: string; email: string | null; telefono: string } | null = null;
  if (input.clienteId) {
    const c = await db.customer.findUnique({
      where: { id: input.clienteId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    if (!c) throw new Error("Cliente non trovato");
    cliente = { id: c.id, nome: c.firstName, cognome: c.lastName ?? "", email: c.email, telefono: c.phone };
  }

  let dataScadenza: Date | null = null;
  if (input.dataScadenza) {
    dataScadenza = input.dataScadenza;
  } else if (input.mesiValidita && input.mesiValidita > 0) {
    dataScadenza = new Date();
    dataScadenza.setMonth(dataScadenza.getMonth() + input.mesiValidita);
  }
  if (dataScadenza) dataScadenza.setHours(23, 59, 59, 0);

  let codice = generaCodiceBuono();
  for (let i = 0; i < 5 && (await db.giftCard.findUnique({ where: { codice } })); i++) {
    codice = generaCodiceBuono();
  }

  const nomeCliente = cliente ? `${cliente.nome} ${cliente.cognome}`.trim() : "";
  const partenza = input.tipoValore === "IMPORTO" ? importo : 0;

  const crea = async (t: Prisma.TransactionClient) => {
    const buono = await t.giftCard.create({
      data: {
        codice,
        tokenPubblico: generaTokenBuono(),
        motivo: input.motivo,
        tipoValore: input.tipoValore,
        importoIniziale: partenza,
        saldoResiduo: partenza,
        percentuale,
        descrizioneServizio,
        clienteId: cliente?.id ?? null,
        spesaMinima: input.spesaMinima && input.spesaMinima > 0 ? input.spesaMinima : null,
        // Percentuale e servizio si usano in un'unica volta
        usoParziale: input.tipoValore === "IMPORTO" ? input.usoParziale !== false : false,
        note: input.note?.trim() || null,
        creatoDa: input.operatore ?? null,
        acquirenteNome: input.acquirenteNome?.trim() || (input.motivo === "REGALO" ? "" : "Attività"),
        acquirenteEmail: input.acquirenteEmail || null,
        acquirenteTelefono: input.acquirenteTelefono || null,
        beneficiarioNome: input.beneficiarioNome?.trim() || nomeCliente,
        beneficiarioMessaggio: input.beneficiarioMessaggio?.trim() || null,
        dataScadenza,
        stato: "ATTIVA",
      },
    });
    await t.movimentoGiftCard.create({
      data: {
        giftCardId: buono.id,
        tipo: "EMISSIONE",
        importo: partenza,
        saldoDopo: partenza,
        operatore: input.operatore ?? null,
        note: `Emesso: ${ETICHETTA_MOTIVO[input.motivo]}`,
      },
    });
    return buono;
  };
  return tx ? crea(tx) : prisma.$transaction(crea);
}

/** Stato reale: un buono ATTIVA con data scadenza passata e' SCADUTA. */
export function statoEffettivo(b: { stato: string; dataScadenza: Date | null }): string {
  if (b.stato === "ATTIVA" && b.dataScadenza && b.dataScadenza.getTime() < Date.now()) return "SCADUTA";
  return b.stato;
}

export function descriviValore(b: {
  tipoValore: string;
  importoIniziale: number;
  saldoResiduo: number;
  percentuale: number | null;
  descrizioneServizio: string | null;
}): string {
  if (b.tipoValore === "PERCENTUALE") return `${b.percentuale}% di sconto`;
  if (b.tipoValore === "SERVIZIO") return b.descrizioneServizio || "Servizio in omaggio";
  return `${b.importoIniziale.toFixed(2)} €`;
}

export interface EsitoUso {
  sconto: number; // euro che il buono toglie dal conto (0 per un servizio)
  nuovoSaldo: number;
  conclude: boolean; // il buono risulta usato del tutto
}

/**
 * Calcola cosa succede usando il buono. Non scrive nulla. Lancia un Error con messaggio leggibile se non utilizzabile.
 *  - IMPORTO: scala `importoDaScalare` (se non indicato, il piu' basso tra saldo e spesa); se non e' a uso parziale si usa tutto.
 *  - PERCENTUALE: serve la spesa; sconto = spesa x percentuale; uso unico.
 *  - SERVIZIO: uso unico, nessun importo.
 */
export function calcolaUso(
  b: {
    stato: string;
    dataScadenza: Date | null;
    tipoValore: string;
    saldoResiduo: number;
    percentuale: number | null;
    spesaMinima: number | null;
    usoParziale: boolean;
  },
  opz: { importoSpesa?: number | null; importoDaScalare?: number | null }
): EsitoUso {
  const stato = statoEffettivo(b);
  if (stato === "SCADUTA") throw new Error("Questo buono è scaduto e non può più essere utilizzato");
  if (stato === "ANNULLATA") throw new Error("Questo buono è stato annullato");
  if (stato === "RISCATTATA") throw new Error("Questo buono è già stato utilizzato");

  const spesa = opz.importoSpesa != null && Number.isFinite(opz.importoSpesa) ? Number(opz.importoSpesa) : null;
  if (b.spesaMinima && (spesa == null || spesa < b.spesaMinima)) {
    throw new Error(`Buono valido per una spesa minima di ${b.spesaMinima.toFixed(2)} € (indica la spesa del cliente)`);
  }

  if (b.tipoValore === "SERVIZIO") return { sconto: 0, nuovoSaldo: 0, conclude: true };

  if (b.tipoValore === "PERCENTUALE") {
    if (spesa == null || spesa <= 0) throw new Error("Per un buono percentuale indica la spesa del cliente");
    const sconto = Math.round(spesa * (b.percentuale || 0)) / 100;
    return { sconto, nuovoSaldo: 0, conclude: true };
  }

  // IMPORTO
  let sconto: number;
  if (opz.importoDaScalare != null) {
    sconto = Math.round(Number(opz.importoDaScalare) * 100) / 100;
  } else {
    sconto = spesa != null && spesa > 0 ? Math.min(spesa, b.saldoResiduo) : b.saldoResiduo;
  }
  if (!Number.isFinite(sconto) || sconto <= 0) throw new Error("Indica un importo da scalare maggiore di zero");
  if (sconto > b.saldoResiduo + 0.001) {
    throw new Error(`Importo superiore al credito residuo: il buono ha ${b.saldoResiduo.toFixed(2)} €`);
  }
  if (spesa != null && sconto > spesa + 0.001) throw new Error("Lo sconto non può superare la spesa del cliente");
  if (!b.usoParziale) {
    // Uso unico: il buono si consuma per intero, anche se la spesa e' piu' bassa
    return { sconto: spesa != null ? Math.min(spesa, b.saldoResiduo) : b.saldoResiduo, nuovoSaldo: 0, conclude: true };
  }
  const nuovoSaldo = Math.max(0, Math.round((b.saldoResiduo - sconto) * 100) / 100);
  return { sconto, nuovoSaldo, conclude: nuovoSaldo === 0 };
}

export async function trovaBuonoPerCodice(codice: string) {
  // Accetta il codice corto oppure il link pubblico del buono (.../buono/<token>)
  const token = /\/buono\//i.test(codice) ? codice.trim().split(/\/buono\//i)[1]?.split(/[?#/]/)[0] : null;
  if (token) return prisma.giftCard.findUnique({ where: { tokenPubblico: token } });
  return prisma.giftCard.findUnique({ where: { codice: codice.trim().toUpperCase().replace(/\s+/g, "") } });
}

export async function usaBuono(
  buonoId: string,
  opz: { importoSpesa?: number | null; importoDaScalare?: number | null; note?: string | null; operatore?: string | null }
) {
  return prisma.$transaction(async (tx) => {
    const b = await tx.giftCard.findUnique({ where: { id: buonoId } });
    if (!b) throw new Error("Buono non trovato");
    const esito = calcolaUso(b, opz);
    const importoMov = b.tipoValore === "IMPORTO" ? (b.usoParziale ? esito.sconto : b.saldoResiduo) : esito.sconto;
    const aggiornato = await tx.giftCard.update({
      where: { id: b.id },
      data: { saldoResiduo: esito.nuovoSaldo, stato: esito.conclude ? "RISCATTATA" : "ATTIVA" },
    });
    const movimento = await tx.movimentoGiftCard.create({
      data: {
        giftCardId: b.id,
        tipo: "USO",
        importo: importoMov,
        saldoDopo: esito.nuovoSaldo,
        operatore: opz.operatore ?? null,
        note:
          opz.note?.trim() ||
          (b.tipoValore === "SERVIZIO"
            ? `Servizio in omaggio: ${b.descrizioneServizio}`
            : `Sconto di ${esito.sconto.toFixed(2)} € in cassa`),
      },
    });
    return { buono: aggiornato, movimento, sconto: esito.sconto };
  });
}

export async function annullaBuono(buonoId: string, motivo: string | null, operatore: string | null) {
  return prisma.$transaction(async (tx) => {
    const b = await tx.giftCard.findUnique({ where: { id: buonoId } });
    if (!b) throw new Error("Buono non trovato");
    if (b.stato === "ANNULLATA") throw new Error("Il buono è già annullato");
    if (b.stato === "RISCATTATA") throw new Error("Il buono è già stato utilizzato: non si può annullare");
    const aggiornato = await tx.giftCard.update({ where: { id: b.id }, data: { stato: "ANNULLATA" } });
    await tx.movimentoGiftCard.create({
      data: {
        giftCardId: b.id,
        tipo: "ANNULLO",
        importo: b.saldoResiduo,
        saldoDopo: b.saldoResiduo,
        operatore,
        note: motivo?.trim() || "Buono annullato",
      },
    });
    return aggiornato;
  });
}
