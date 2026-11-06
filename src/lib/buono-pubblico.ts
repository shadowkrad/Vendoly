import QRCode from "qrcode";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { ETICHETTA_MOTIVO, descriviValore, statoEffettivo } from "@/lib/buoni";

/** Indirizzo pubblico del sito, ricavato dalla richiesta (dietro proxy usa l'host inoltrato). */
export async function origineDaRichiesta(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "localhost:3000").split(",")[0].trim();
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Dati del buono per la pagina pubblica e per la stampa: si arriva SOLO con il link privato (token lungo).
 * Non espone dati di contatto di nessuno.
 */
export async function caricaBuonoPubblico(token: string) {
  if (!token || token.length < 16) return null;
  const b = await prisma.giftCard.findUnique({ where: { tokenPubblico: token } });
  if (!b) return null;
  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const origine = await origineDaRichiesta();
  const link = `${origine}/buono/${token}`;
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 360, errorCorrectionLevel: "M" });
  return {
    id: b.id,
    codice: b.codice,
    motivo: b.motivo,
    motivoEtichetta: ETICHETTA_MOTIVO[b.motivo as keyof typeof ETICHETTA_MOTIVO] || "Buono",
    tipoValore: b.tipoValore,
    valore: descriviValore(b),
    saldoResiduo: b.saldoResiduo,
    importoIniziale: b.importoIniziale,
    spesaMinima: b.spesaMinima,
    usoParziale: b.usoParziale,
    dataScadenza: b.dataScadenza,
    stato: statoEffettivo(b),
    destinatario: b.beneficiarioNome || null,
    messaggio: b.beneficiarioMessaggio || null,
    link,
    qr,
    brand: {
      nome: imp?.brandName || "",
      logoUrl: imp?.logoUrl || null,
      accento: imp?.accentColor || "#d97706",
      secondario: imp?.primaryColor || "#0f172a",
      indirizzo: imp?.indirizzo || "",
      telefono: imp?.phone || "",
    },
  };
}

export type BuonoPubblico = NonNullable<Awaited<ReturnType<typeof caricaBuonoPubblico>>>;

/** Frase con le condizioni d'uso, uguale a video, in stampa e nell'email. */
export function condizioniBuono(b: {
  tipoValore: string;
  spesaMinima: number | null;
  usoParziale: boolean;
  dataScadenza: Date | null;
}): string[] {
  const c: string[] = [];
  c.push(b.dataScadenza ? `Valido fino al ${b.dataScadenza.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.` : "Senza scadenza.");
  if (b.spesaMinima) c.push(`Valido per una spesa minima di ${b.spesaMinima.toFixed(2)} €.`);
  if (b.tipoValore === "IMPORTO") c.push(b.usoParziale ? "Utilizzabile anche in più volte fino a esaurimento del credito." : "Da utilizzare in un'unica volta.");
  else c.push("Da utilizzare in un'unica volta.");
  c.push("Non convertibile in denaro. Da presentare in cassa con questo codice.");
  return c;
}
