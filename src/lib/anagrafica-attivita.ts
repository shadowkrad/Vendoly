/**
 * Fonte unica dei dati dell'attività (Vendoly).
 *
 * - Nome, indirizzo, telefono, email, descrizione e ORARI del negozio si modificano SOLO in
 *   Impostazioni > Negozio. Vetrina, piè di pagina e invio a Google / Facebook / Instagram li leggono da lì.
 * - Colori, logo e foto si modificano SOLO nello Studio Aspetto.
 * Lo Studio mostra questi dati in sola lettura e decide soltanto cosa far vedere (interruttori).
 */
import { prisma, ensureDatabase } from "@/lib/db";
import { parseShowcaseConfig, ShowcaseConfig } from "@/lib/showcase-defaults";
import type { OmnichannelDayHours, OmnichannelSpecialClosure } from "@/lib/omnichannel-client";

export type ModalitaOrari = "NEGOZIO" | "ASSISTENZA" | "NESSUNO";

/** Gli orari sono facoltativi: negozio fisico, semplice orario di risposta dell'assistenza, oppure nessuno (solo e-commerce). */
export function modalitaOrari(cache: any | null): ModalitaOrari {
  const m = String(cache?.orariModalita || "NEGOZIO").toUpperCase();
  return m === "ASSISTENZA" || m === "NESSUNO" ? m : "NEGOZIO";
}

export const ORARI_FERIALI_DEFAULT = "09:30 – 13:00 / 15:30 – 19:30";
export const ORARI_SABATO_DEFAULT = "09:30 – 19:30 (Continuato)";
export const ORARI_DOMENICA_DEFAULT = "Chiuso";

/** Trasforma un testo tipo "09:30 – 13:00 / 15:30 – 19:30" nelle fasce di apertura ("Chiuso" = nessuna fascia). */
export function leggiFasce(testo: string | null | undefined): Array<{ open: string; close: string }> {
  if (!testo || /chiuso/i.test(testo)) return [];
  const fasce: Array<{ open: string; close: string }> = [];
  for (const parte of testo.split("/")) {
    const m = parte.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);
    if (m) {
      fasce.push({
        open: m[1].replace(".", ":").padStart(5, "0"),
        close: m[2].replace(".", ":").padStart(5, "0"),
      });
    }
  }
  return fasce;
}

/** Orari ufficiali nel formato di Google Maps / Facebook / Instagram (giorni di chiusura inclusi). */
export function orariUfficialiPerCanali(cache: any | null): OmnichannelDayHours[] {
  const feriali = leggiFasce(cache?.orariFeriali ?? ORARI_FERIALI_DEFAULT);
  const sabato = leggiFasce(cache?.orariSabato ?? ORARI_SABATO_DEFAULT);
  const domenica = leggiFasce(cache?.orariDomenica ?? ORARI_DOMENICA_DEFAULT);
  const giorno = (dayOfWeek: OmnichannelDayHours["dayOfWeek"], slots: typeof feriali): OmnichannelDayHours => ({
    dayOfWeek,
    isOpen: slots.length > 0,
    slots,
  });
  return [
    giorno("MONDAY", feriali),
    giorno("TUESDAY", feriali),
    giorno("WEDNESDAY", feriali),
    giorno("THURSDAY", feriali),
    giorno("FRIDAY", feriali),
    giorno("SATURDAY", sabato),
    giorno("SUNDAY", domenica),
  ];
}

/** Prossime chiusure straordinarie dal calendario eccezioni. */
export async function chiusureFuture(): Promise<OmnichannelSpecialClosure[]> {
  try {
    await ensureDatabase();
    const oggi = new Date().toISOString().slice(0, 10);
    const righe = await prisma.eccezioneCalendario.findMany({ where: { tipo: "CHIUSURA", data: { gte: oggi } } });
    return righe.map((e: any) => ({
      startDate: e.data,
      endDate: e.data,
      reason: e.titolo || "Chiusura Programmata",
      isClosedAllDay: true,
    }));
  } catch {
    return [];
  }
}

/** Porta nella vetrina i dati dell'attività, sovrascrivendo qualunque copia vecchia salvata nello Studio. */
export function applicaAnagrafica(showcase: ShowcaseConfig, cache: any | null): ShowcaseConfig {
  if (!cache) return showcase;
  const ci: any = { ...(showcase.contactInfo || {}) };
  if (cache.indirizzo?.trim()) ci.address = cache.indirizzo.trim();
  if (cache.phone?.trim()) {
    ci.phone = cache.phone.trim();
    ci.whatsapp = cache.phone.trim();
  }
  if (cache.contactEmail?.trim()) ci.email = cache.contactEmail.trim();
  ci.hoursWeekday = cache.orariFeriali?.trim() || ORARI_FERIALI_DEFAULT;
  ci.hoursSaturday = cache.orariSabato?.trim() || ORARI_SABATO_DEFAULT;
  ci.hoursSunday = cache.orariDomenica?.trim() || ORARI_DOMENICA_DEFAULT;
  ci.hoursMode = modalitaOrari(cache);
  showcase.contactInfo = ci;
  if (cache.brandName?.trim()) showcase.brandName = cache.brandName.trim();
  return showcase;
}

/** Vetrina completa e coerente: Studio + dati del negozio. */
export async function caricaVetrinaUnificata(): Promise<{ showcase: ShowcaseConfig; cache: any | null }> {
  await ensureDatabase();
  const cache = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const showcase = applicaAnagrafica(parseShowcaseConfig((cache as any)?.showcaseConfig), cache);
  return { showcase, cache };
}

/** Riscrive la vetrina salvata con i dati del negozio allineati (per chi legge direttamente il JSON salvato). */
export async function riallineaVetrinaSalvata(descrizione?: string): Promise<void> {
  const { showcase, cache } = await caricaVetrinaUnificata();
  if (!cache) return;
  if (descrizione !== undefined && descrizione.trim()) {
    showcase.about = { ...showcase.about, description: descrizione.trim() };
  }
  await prisma.tenantLocalCache.update({
    where: { id: "singleton" },
    data: { showcaseConfig: JSON.stringify(showcase) },
  });
}
