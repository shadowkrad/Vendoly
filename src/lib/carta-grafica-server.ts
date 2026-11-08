import QRCode from "qrcode";
import { prisma, ensureDatabase } from "@/lib/db";
import {
  caricaVetrinaUnificata,
  ORARI_FERIALI_DEFAULT,
  ORARI_SABATO_DEFAULT,
  ORARI_DOMENICA_DEFAULT,
  modalitaOrari,
} from "@/lib/anagrafica-attivita";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  OrarioGiornoCarta,
  normalizzaCartaGraficaConfig,
  applicaPersonalizzati,
} from "@/lib/carta-grafica-types";

export async function caricaCartaGrafica(origineUrl?: string): Promise<{
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  /** Dati di Impostazioni, senza le voci cambiate solo per biglietti e buoni (serve all'editor). */
  ereditata: DatiAttivitaCarta;
}> {
  await ensureDatabase();
  const { showcase, cache } = await caricaVetrinaUnificata();

  let rawJson: Record<string, any> = {};
  try {
    if (cache?.showcaseConfig) {
      rawJson = typeof cache.showcaseConfig === "string" ? JSON.parse(cache.showcaseConfig) : cache.showcaseConfig;
    }
  } catch {
    rawJson = {};
  }

  const nome = (cache?.brandName || showcase.brandName || "Il Mio Negozio").trim();
  const colorePrimario = (cache?.primaryColor || "#0f172a").trim();
  const coloreAccento = (cache?.accentColor || "#C9A86A").trim();

  const config = normalizzaCartaGraficaConfig(rawJson?.cartaGrafica, {
    defaultPreset: "CLASSICO_ORO",
    coloreScuro: colorePrimario.startsWith("#") ? colorePrimario : "#0f172a",
    coloreChiaro: "#EAE0D0",
    coloreDettaglio: coloreAccento.startsWith("#") ? coloreAccento : "#C9A86A",
    sottotitoloBrand: "BOUTIQUE & STORE",
  });

  const feriali = (cache?.orariFeriali || ORARI_FERIALI_DEFAULT).trim();
  const sabato = (cache?.orariSabato || ORARI_SABATO_DEFAULT).trim();
  const domenica = (cache?.orariDomenica || ORARI_DOMENICA_DEFAULT).trim();

  // Orari facoltativi: se il negozio e' solo online (nessun orario) i biglietti e i buoni non li stampano
  const senzaOrari = modalitaOrari(cache) === "NESSUNO";
  const orariGiornalieriTutti: OrarioGiornoCarta[] = [
    { giorno: "LUNEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "MARTEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "MERCOLEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "GIOVEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "VENERDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "SABATO", orario: sabato, chiuso: /chiuso/i.test(sabato) },
    { giorno: "DOMENICA", orario: domenica, chiuso: /chiuso/i.test(domenica) },
  ];

  const orariRaggruppatiTutti: OrarioGiornoCarta[] = [
    { giorno: "LUNEDÌ - VENERDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "SABATO", orario: sabato, chiuso: /chiuso/i.test(sabato) },
    { giorno: "DOMENICA", orario: domenica, chiuso: /chiuso/i.test(domenica) },
  ];

  const sitoUrl = (origineUrl || "https://vendoly.taaaac.eu").trim();
  let qrVetrinaDataUrl = "";
  try {
    qrVetrinaDataUrl = await QRCode.toDataURL(sitoUrl, { margin: 1, width: 280, errorCorrectionLevel: "M" });
  } catch {}

  const ereditata: DatiAttivitaCarta = {
    nome,
    slogan: "",
    indirizzo: (cache?.indirizzo || (showcase as any)?.contactInfo?.address || "").trim(),
    citta: "",
    telefono: (cache?.phone || (showcase as any)?.contactInfo?.phone || "").trim(),
    email: (cache?.contactEmail || (showcase as any)?.contactInfo?.email || "").trim(),
    sitoUrl,
    qrVetrinaDataUrl,
    logoUrl: cache?.logoUrl || (showcase as any)?.logoUrl || null,
    logoHeroUrl: (showcase as any)?.hero?.logoUrl || null,
    colorePrimario,
    coloreSecondario: "#EAE0D0",
    orariGiornalieri: senzaOrari ? [] : orariGiornalieriTutti,
    orariRaggruppati: senzaOrari ? [] : orariRaggruppatiTutti,
  };

  return { config, attivita: applicaPersonalizzati(ereditata, config.personalizzati), ereditata };
}

export async function salvaCartaGrafica(nuovaConfig: unknown): Promise<CartaGraficaConfig> {
  await ensureDatabase();
  const cache = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  let rawJson: Record<string, any> = {};
  try {
    if (cache?.showcaseConfig) {
      rawJson = typeof cache.showcaseConfig === "string" ? JSON.parse(cache.showcaseConfig) : cache.showcaseConfig;
    }
  } catch {
    rawJson = {};
  }

  const configNormalizzata = normalizzaCartaGraficaConfig(nuovaConfig, {
    defaultPreset: "CLASSICO_ORO",
    coloreScuro: cache?.primaryColor || "#0f172a",
    coloreChiaro: "#EAE0D0",
    coloreDettaglio: cache?.accentColor || "#C9A86A",
    sottotitoloBrand: "BOUTIQUE & STORE",
  });

  rawJson.cartaGrafica = configNormalizzata;

  // Anche se le impostazioni non sono ancora state salvate (riga assente), la grafica deve salvarsi
  await prisma.tenantLocalCache.upsert({
    where: { id: "singleton" },
    update: { showcaseConfig: JSON.stringify(rawJson) },
    create: { id: "singleton", domain: "vendoly-demo.taaaac.eu", showcaseConfig: JSON.stringify(rawJson) },
  });

  return configNormalizzata;
}
