/**
 * Tipi e valori predefiniti per il motore grafico unificato di Buoni (Gift Card)
 * e Biglietti da Visita (Solo Fronte o Fronte/Retro) basato sul tema dell'attività.
 */

export type PresetCartaGrafica =
  | "BOTANICO_LUXURY"
  | "CLASSICO_ORO"
  | "HERITAGE_VINTAGE"
  | "MODERNO_MINIMAL"
  | "SFONDO_LIBERO";

export type FormatoBiglietto = "FRONTE_RETRO" | "SOLO_FRONTE";

export type CombinazioneColori =
  | "SCURO_CHIARO"
  | "CHIARO_SCURO"
  | "TUTTO_SCURO"
  | "TUTTO_CHIARO";

export type ContenutoRetro = "ORARI" | "ORARI_QR" | "APPUNTAMENTI_QR";

export type ModalitaOrariRetro = "GIORNALIERO" | "RAGGRUPPATO";

/**
 * Testi diversi da Impostazioni, usati SOLO su biglietti e buoni quando il titolare lo sceglie.
 * Una voce assente = si usa il dato di Impostazioni (sempre aggiornato).
 */
export interface DatiPersonalizzati {
  nome?: string;
  slogan?: string;
  indirizzo?: string;
  citta?: string;
  telefono?: string;
  email?: string;
  /** 7 righe, da Lunedì a Domenica. */
  orari?: Array<{ giorno: string; orario: string }>;
}

export interface CartaGraficaConfig {
  personalizzati: DatiPersonalizzati;
  preset: PresetCartaGrafica;
  formatoBiglietto: FormatoBiglietto;
  combinazioneColori: CombinazioneColori;
  coloreScuro: string;
  coloreChiaro: string;
  coloreDettaglio: string;
  // Sfondi personalizzati caricabili dall'utente
  sfondoFronteUrl: string | null;
  sfondoRetroUrl: string | null;
  sfondoBuonoUrl: string | null;
  usaSfondoFronteSuBuono: boolean;
  veloOpacitaFronte: number; // 0..85
  veloOpacitaRetro: number; // 0..85
  sfondoFit: "cover" | "contain";
  nascondiTestiFronte: boolean;
  nascondiTestiRetro: boolean;
  // Testi fronte biglietto
  sottotitoloBrand: string; // es. "ESTETICA"
  firmaBrand: string; // es. "di Maria Rossi"
  sovratitoloSede: string; // es. "Presso"
  nomeSedeOspite: string; // es. "Centro Benessere Aurora"
  mostraQrFronte: boolean;
  mostraOrariCompattiFronte: boolean;
  // Configurazione retro biglietto
  contenutoRetro: ContenutoRetro;
  modalitaOrariRetro: ModalitaOrariRetro;
  includiDomenica: boolean;
  titoloRetro: string; // es. "ORARI"
}

export interface OrarioGiornoCarta {
  giorno: string;
  orario: string;
  chiuso: boolean;
}

export interface DatiAttivitaCarta {
  nome: string;
  slogan: string;
  indirizzo: string;
  citta: string;
  telefono: string;
  email: string;
  sitoUrl: string;
  qrVetrinaDataUrl: string;
  logoUrl: string | null;
  logoHeroUrl: string | null;
  colorePrimario: string;
  coloreSecondario: string;
  orariGiornalieri: OrarioGiornoCarta[];
  orariRaggruppati: OrarioGiornoCarta[];
}

export const PRESET_CARTA_LABELS: Array<{
  id: PresetCartaGrafica;
  nome: string;
  descrizione: string;
}> = [
  {
    id: "BOTANICO_LUXURY",
    nome: "Botanico & Luxury",
    descrizione: "Rami d'ulivo negli angoli, stelline ✦ e filetti dorati",
  },
  {
    id: "CLASSICO_ORO",
    nome: "Classico Elegante",
    descrizione: "Doppia cornice imperiale, losanga centrale e carattere editoriale",
  },
  {
    id: "HERITAGE_VINTAGE",
    nome: "Heritage & Artigianale",
    descrizione: "Filetti retrò, angoli con borchie e stile bottega / barber / bistrot",
  },
  {
    id: "MODERNO_MINIMAL",
    nome: "Moderno & Minimal",
    descrizione: "Geometrie pulite, linea d'accento laterale e massima essenzialità",
  },
  {
    id: "SFONDO_LIBERO",
    nome: "Sfondo Personalizzato Puro",
    descrizione: "Senza ornamenti agli angoli per dare pieno risalto al tuo sfondo caricato",
  },
];

export function defaultCartaGraficaConfig(opts?: {
  defaultPreset?: PresetCartaGrafica;
  coloreScuro?: string;
  coloreChiaro?: string;
  coloreDettaglio?: string;
  sottotitoloBrand?: string;
}): CartaGraficaConfig {
  return {
    personalizzati: {},
    preset: opts?.defaultPreset || "BOTANICO_LUXURY",
    formatoBiglietto: "FRONTE_RETRO",
    combinazioneColori: "SCURO_CHIARO",
    coloreScuro: opts?.coloreScuro || "#3F4B2A",
    coloreChiaro: opts?.coloreChiaro || "#EAE0D0",
    coloreDettaglio: opts?.coloreDettaglio || "#C9A86A",
    sfondoFronteUrl: null,
    sfondoRetroUrl: null,
    sfondoBuonoUrl: null,
    usaSfondoFronteSuBuono: true,
    veloOpacitaFronte: 30,
    veloOpacitaRetro: 20,
    sfondoFit: "cover",
    nascondiTestiFronte: false,
    nascondiTestiRetro: false,
    sottotitoloBrand: opts?.sottotitoloBrand || "",
    firmaBrand: "",
    sovratitoloSede: "",
    nomeSedeOspite: "",
    mostraQrFronte: false,
    mostraOrariCompattiFronte: false,
    contenutoRetro: "ORARI",
    modalitaOrariRetro: "GIORNALIERO",
    includiDomenica: false,
    titoloRetro: "ORARI",
  };
}

export function normalizzaCartaGraficaConfig(
  raw: unknown,
  defaults?: Parameters<typeof defaultCartaGraficaConfig>[0]
): CartaGraficaConfig {
  const base = defaultCartaGraficaConfig(defaults);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, any>;
  return {
    personalizzati: normalizzaPersonalizzati(r.personalizzati),
    preset:
      r.preset === "BOTANICO_LUXURY" ||
      r.preset === "CLASSICO_ORO" ||
      r.preset === "HERITAGE_VINTAGE" ||
      r.preset === "MODERNO_MINIMAL" ||
      r.preset === "SFONDO_LIBERO"
        ? r.preset
        : base.preset,
    formatoBiglietto: r.formatoBiglietto === "SOLO_FRONTE" ? "SOLO_FRONTE" : "FRONTE_RETRO",
    combinazioneColori:
      r.combinazioneColori === "SCURO_CHIARO" ||
      r.combinazioneColori === "CHIARO_SCURO" ||
      r.combinazioneColori === "TUTTO_SCURO" ||
      r.combinazioneColori === "TUTTO_CHIARO"
        ? r.combinazioneColori
        : base.combinazioneColori,
    coloreScuro: typeof r.coloreScuro === "string" && r.coloreScuro.trim() ? r.coloreScuro.trim() : base.coloreScuro,
    coloreChiaro: typeof r.coloreChiaro === "string" && r.coloreChiaro.trim() ? r.coloreChiaro.trim() : base.coloreChiaro,
    coloreDettaglio:
      typeof r.coloreDettaglio === "string" && r.coloreDettaglio.trim() ? r.coloreDettaglio.trim() : base.coloreDettaglio,
    sfondoFronteUrl: typeof r.sfondoFronteUrl === "string" && r.sfondoFronteUrl.trim() ? r.sfondoFronteUrl : null,
    sfondoRetroUrl: typeof r.sfondoRetroUrl === "string" && r.sfondoRetroUrl.trim() ? r.sfondoRetroUrl : null,
    sfondoBuonoUrl: typeof r.sfondoBuonoUrl === "string" && r.sfondoBuonoUrl.trim() ? r.sfondoBuonoUrl : null,
    usaSfondoFronteSuBuono: r.usaSfondoFronteSuBuono !== undefined ? Boolean(r.usaSfondoFronteSuBuono) : base.usaSfondoFronteSuBuono,
    veloOpacitaFronte:
      typeof r.veloOpacitaFronte === "number" ? Math.max(0, Math.min(85, r.veloOpacitaFronte)) : base.veloOpacitaFronte,
    veloOpacitaRetro:
      typeof r.veloOpacitaRetro === "number" ? Math.max(0, Math.min(85, r.veloOpacitaRetro)) : base.veloOpacitaRetro,
    sfondoFit: r.sfondoFit === "contain" ? "contain" : "cover",
    nascondiTestiFronte: Boolean(r.nascondiTestiFronte),
    nascondiTestiRetro: Boolean(r.nascondiTestiRetro),
    sottotitoloBrand: typeof r.sottotitoloBrand === "string" ? r.sottotitoloBrand : base.sottotitoloBrand,
    firmaBrand: typeof r.firmaBrand === "string" ? r.firmaBrand : base.firmaBrand,
    sovratitoloSede: typeof r.sovratitoloSede === "string" ? r.sovratitoloSede : base.sovratitoloSede,
    nomeSedeOspite: typeof r.nomeSedeOspite === "string" ? r.nomeSedeOspite : base.nomeSedeOspite,
    mostraQrFronte: Boolean(r.mostraQrFronte),
    mostraOrariCompattiFronte: Boolean(r.mostraOrariCompattiFronte),
    contenutoRetro:
      r.contenutoRetro === "ORARI" || r.contenutoRetro === "ORARI_QR" || r.contenutoRetro === "APPUNTAMENTI_QR"
        ? r.contenutoRetro
        : base.contenutoRetro,
    modalitaOrariRetro: r.modalitaOrariRetro === "RAGGRUPPATO" ? "RAGGRUPPATO" : "GIORNALIERO",
    includiDomenica: Boolean(r.includiDomenica),
    titoloRetro: typeof r.titoloRetro === "string" && r.titoloRetro.trim() ? r.titoloRetro : base.titoloRetro,
  };
}

const CAMPI_TESTO_PERSONALIZZABILI = ["nome", "slogan", "indirizzo", "citta", "telefono", "email"] as const;

/** Tiene solo i campi noti, come testo breve; una voce vuota ("") significa "non stampare". */
export function normalizzaPersonalizzati(raw: unknown): DatiPersonalizzati {
  const out: DatiPersonalizzati = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, any>;
  for (const k of CAMPI_TESTO_PERSONALIZZABILI) {
    if (typeof r[k] === "string") out[k] = r[k].slice(0, 160);
  }
  if (Array.isArray(r.orari) && r.orari.length === 7) {
    out.orari = r.orari.map((x: any, i: number) => ({
      giorno: ["LUNEDÌ", "MARTEDÌ", "MERCOLEDÌ", "GIOVEDÌ", "VENERDÌ", "SABATO", "DOMENICA"][i],
      orario: typeof x?.orario === "string" ? x.orario.slice(0, 80) : "",
    }));
  }
  return out;
}

/** Dati effettivi stampati: quelli di Impostazioni, salvo le voci che il titolare ha scelto di cambiare. */
export function applicaPersonalizzati(base: DatiAttivitaCarta, p?: DatiPersonalizzati): DatiAttivitaCarta {
  if (!p) return base;
  const out: DatiAttivitaCarta = { ...base };
  for (const k of CAMPI_TESTO_PERSONALIZZABILI) {
    if (typeof p[k] === "string") out[k] = (p[k] as string).trim();
  }
  if (p.orari && p.orari.length === 7) {
    const giornalieri: OrarioGiornoCarta[] = p.orari.map((r) => {
      const testo = (r.orario || "").trim();
      const chiuso = !testo || /chiuso/i.test(testo);
      return { giorno: r.giorno, orario: chiuso ? "CHIUSO" : testo, chiuso };
    });
    const raggruppati: OrarioGiornoCarta[] = [];
    for (const g of giornalieri) {
      const ultimo = raggruppati[raggruppati.length - 1] as (OrarioGiornoCarta & { _da?: string }) | undefined;
      if (ultimo && ultimo.orario === g.orario) {
        ultimo.giorno = `${ultimo._da} - ${g.giorno}`;
      } else {
        raggruppati.push({ ...g, _da: g.giorno } as OrarioGiornoCarta & { _da?: string });
      }
    }
    out.orariGiornalieri = giornalieri;
    out.orariRaggruppati = raggruppati.map(({ giorno, orario, chiuso }) => ({ giorno, orario, chiuso }));
  }
  return out;
}

/** Calcola i colori effettivi di un lato (fronte o retro) in base alla combinazione scelta. */
export function paletteLato(config: CartaGraficaConfig, lato: "fronte" | "retro") {
  const isScuro =
    config.combinazioneColori === "TUTTO_SCURO"
      ? true
      : config.combinazioneColori === "TUTTO_CHIARO"
      ? false
      : config.combinazioneColori === "SCURO_CHIARO"
      ? lato === "fronte"
      : lato === "retro";

  return {
    isScuro,
    bg: isScuro ? config.coloreScuro : config.coloreChiaro,
    textPrimary: isScuro ? "#F5ECD7" : config.coloreScuro,
    textSecondary: isScuro ? "#E5D5B5" : config.coloreScuro,
    accent: config.coloreDettaglio,
    leafFill: isScuro ? "#788656" : config.coloreScuro,
    leafStroke: config.coloreDettaglio,
  };
}

/** Ricava le iniziali del brand per il monogramma automatico quando non c'è un logo caricato. */
export function inizialiBrand(nome: string): string {
  const pulito = (nome || "Attività").trim();
  const parole = pulito.split(/\s+/).filter(Boolean);
  if (parole.length >= 2) {
    if (parole[0].length <= 3 && parole[0] === parole[0].toUpperCase()) {
      return parole[0].slice(0, 2);
    }
    return (parole[0][0] + parole[1][0]).toUpperCase();
  }
  return pulito.slice(0, 2).toUpperCase();
}
