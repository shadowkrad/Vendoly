import { prisma } from "@/lib/db";
import { emettiBuono } from "@/lib/buoni";
import { templateEmailBuono } from "@/lib/buoni-invio";
import { sendNotificationMail } from "@/lib/taaaac-mailer";
import { appUrl } from "@/lib/app-url";
import { eAmbienteDemo } from "@/lib/demo";

/**
 * Buono compleanno automatico. Le regole le sceglie l'esercente in Impostazioni (dentro `fidelityRules.compleanno`).
 * Si puo' lanciare quante volte si vuole: per ogni cliente e per ogni anno il buono nasce una volta sola.
 */
export interface RegoleCompleanno {
  enabled: boolean;
  tipoValore: "IMPORTO" | "PERCENTUALE" | "SERVIZIO";
  importo: number;
  percentuale: number;
  servizio: string;
  giorniAnticipo: number; // il buono nasce fino a N giorni prima del compleanno
  validitaGiorni: number; // validita' a partire dal giorno del compleanno (0 = senza scadenza)
  spesaMinima: number;
  inviaEmail: boolean;
}

export const REGOLE_COMPLEANNO_DEFAULT: RegoleCompleanno = {
  enabled: false,
  tipoValore: "PERCENTUALE",
  importo: 10,
  percentuale: 20,
  servizio: "",
  giorniAnticipo: 7,
  validitaGiorni: 30,
  spesaMinima: 0,
  inviaEmail: true,
};

export async function leggiRegoleCompleanno(): Promise<RegoleCompleanno> {
  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" }, select: { fidelityRules: true } });
  let c: any = {};
  try {
    c = (imp?.fidelityRules ? JSON.parse(imp.fidelityRules) : {}).compleanno || {};
  } catch {
    c = {};
  }
  const d = REGOLE_COMPLEANNO_DEFAULT;
  const num = (v: any, def: number, min = 0) => (Number.isFinite(Number(v)) && Number(v) >= min ? Number(v) : def);
  return {
    enabled: Boolean(c.enabled),
    tipoValore: ["IMPORTO", "PERCENTUALE", "SERVIZIO"].includes(c.tipoValore) ? c.tipoValore : d.tipoValore,
    importo: num(c.importo, d.importo),
    percentuale: num(c.percentuale, d.percentuale),
    servizio: typeof c.servizio === "string" ? c.servizio : d.servizio,
    giorniAnticipo: Math.min(60, Math.floor(num(c.giorniAnticipo, d.giorniAnticipo))),
    validitaGiorni: Math.floor(num(c.validitaGiorni, d.validitaGiorni)),
    spesaMinima: num(c.spesaMinima, d.spesaMinima),
    inviaEmail: c.inviaEmail === undefined ? d.inviaEmail : Boolean(c.inviaEmail),
  };
}

/** Prossimo compleanno (oggi compreso) alle 00:00 locali. Il 29 febbraio negli anni non bisestili cade il 1 marzo. */
export function prossimoCompleanno(nascita: Date, oggi: Date): Date {
  const mese = nascita.getUTCMonth();
  const giorno = nascita.getUTCDate();
  const inizioOggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  let c = new Date(oggi.getFullYear(), mese, giorno);
  if (c < inizioOggi) c = new Date(oggi.getFullYear() + 1, mese, giorno);
  return c;
}

export interface EsitoCompleanni {
  attivo: boolean;
  creati: number;
  inviati: number;
  senzaEmail: number;
  clienti: string[];
}

export async function eseguiBuoniCompleanno(opz?: { oggi?: Date; host?: string | null }): Promise<EsitoCompleanni> {
  const regole = await leggiRegoleCompleanno();
  const esito: EsitoCompleanni = { attivo: regole.enabled, creati: 0, inviati: 0, senzaEmail: 0, clienti: [] };
  if (!regole.enabled) return esito;
  if (regole.tipoValore === "SERVIZIO" && !regole.servizio.trim()) return esito;

  const oggi = opz?.oggi ?? new Date();
  const limite = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + regole.giorniAnticipo);
  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const demo = eAmbienteDemo(opz?.host);

  const righe = await prisma.customer.findMany({
    where: { birthDate: { not: null }, phone: { not: "CANCELLATO" } },
    select: { id: true, firstName: true, lastName: true, email: true, birthDate: true, marketingConsent: true },
  });
  const clienti = righe.map((r) => ({
    id: r.id,
    nome: r.firstName,
    cognome: r.lastName ?? "",
    email: r.email,
    dataNascita: r.birthDate,
    consensoMarketing: r.marketingConsent,
  }));

  for (const c of clienti) {
    const compleanno = prossimoCompleanno(c.dataNascita!, oggi);
    if (compleanno > limite) continue;

    // Un solo buono per cliente e per anno: lo riconosce dalla nota
    const marcatore = `Buono compleanno ${compleanno.getFullYear()}`;
    const gia = await prisma.giftCard.count({
      where: { clienteId: c.id, motivo: "COMPLEANNO", note: { contains: marcatore } },
    });
    if (gia > 0) continue;

    const scadenza = regole.validitaGiorni > 0 ? new Date(compleanno.getTime() + regole.validitaGiorni * 86400000) : null;
    const buono = await emettiBuono({
      motivo: "COMPLEANNO",
      tipoValore: regole.tipoValore,
      importo: regole.tipoValore === "IMPORTO" ? regole.importo : null,
      percentuale: regole.tipoValore === "PERCENTUALE" ? regole.percentuale : null,
      descrizioneServizio: regole.tipoValore === "SERVIZIO" ? regole.servizio : null,
      dataScadenza: scadenza,
      spesaMinima: regole.spesaMinima > 0 ? regole.spesaMinima : null,
      usoParziale: false,
      clienteId: c.id,
      note: `${marcatore} (automatico)`,
      operatore: "Automatico",
    });
    esito.creati++;
    esito.clienti.push(`${c.nome} ${c.cognome}`.trim());

    // Email solo a chi ha dato il consenso marketing e ha un indirizzo vero
    const emailValida = c.email && !c.email.endsWith(".schedly.local") && !c.email.endsWith(".invalid");
    if (!regole.inviaEmail) continue;
    if (!emailValida || !c.consensoMarketing || !buono.tokenPubblico) {
      esito.senzaEmail++;
      continue;
    }
    const { subject, html } = templateEmailBuono({
      nomeSalone: imp?.brandName || "Il tuo salone",
      nomeDestinatario: c.nome,
      buono,
      link: `${appUrl()}/buono/${buono.tokenPubblico}`,
      colore: imp?.accentColor || "#d97706",
    });
    let inviata = false;
    let nota = "";
    if (demo) {
      inviata = true;
      nota = `Email simulata (demo) a ${c.email}`;
    } else {
      const r = await sendNotificationMail({ to: c.email!, subject, html, senderName: imp?.brandName || undefined });
      inviata = r.success;
      nota = `Inviato per email a ${c.email}`;
    }
    if (inviata) {
      esito.inviati++;
      await prisma.movimentoGiftCard.create({
        data: { giftCardId: buono.id, tipo: "INVIO", importo: 0, saldoDopo: buono.saldoResiduo, operatore: "Automatico", note: nota },
      });
    } else {
      esito.senzaEmail++;
    }
  }
  return esito;
}
