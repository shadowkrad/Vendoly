import QRCode from "qrcode";
import { prisma, ensureDatabase } from "@/lib/db";
import {
  caricaVetrinaUnificata,
  ORARI_FERIALI_DEFAULT,
  ORARI_SABATO_DEFAULT,
  ORARI_DOMENICA_DEFAULT,
} from "@/lib/anagrafica-attivita";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  OrarioGiornoCarta,
  normalizzaCartaGraficaConfig,
} from "@/lib/carta-grafica-types";

export async function caricaCartaGrafica(origineUrl?: string): Promise<{
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
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

  const orariGiornalieri: OrarioGiornoCarta[] = [
    { giorno: "LUNEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "MARTEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "MERCOLEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "GIOVEDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "VENERDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "SABATO", orario: sabato, chiuso: /chiuso/i.test(sabato) },
    { giorno: "DOMENICA", orario: domenica, chiuso: /chiuso/i.test(domenica) },
  ];

  const orariRaggruppati: OrarioGiornoCarta[] = [
    { giorno: "LUNEDÌ - VENERDÌ", orario: feriali, chiuso: /chiuso/i.test(feriali) },
    { giorno: "SABATO", orario: sabato, chiuso: /chiuso/i.test(sabato) },
    { giorno: "DOMENICA", orario: domenica, chiuso: /chiuso/i.test(domenica) },
  ];

  const sitoUrl = (origineUrl || "https://vendoly.taaaac.eu").trim();
  let qrVetrinaDataUrl = "";
  try {
    qrVetrinaDataUrl = await QRCode.toDataURL(sitoUrl, { margin: 1, width: 280, errorCorrectionLevel: "M" });
  } catch {}

  const attivita: DatiAttivitaCarta = {
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
    orariGiornalieri,
    orariRaggruppati,
  };

  return { config, attivita };
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

  if (cache) {
    await prisma.tenantLocalCache.update({
      where: { id: "singleton" },
      data: { showcaseConfig: JSON.stringify(rawJson) },
    });
  }

  return configNormalizzata;
}
