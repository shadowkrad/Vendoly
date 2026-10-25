/**
 * Engine Festività Nazionali Italiane & Risoluzione Calendario Speciale per Vendoly
 * Gestisce festività fisse, festività mobili (Pasqua e Lunedì dell'Angelo) e risoluzione a 3 livelli:
 * 1. Eccezione esplicita negozio (EccezioneCalendario)
 * 2. Festività nazionale italiana (se abilitata)
 * 3. Orari standard negozio fisico (feriali, sabato, domenica)
 */

import { prisma } from "@/lib/db";

export function calcolaPasqua(anno: number): { giorno: number; mese: number } {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return { giorno, mese };
}

export function getElencoFestivitaAnno(anno: number): Array<{ data: string; nome: string }> {
  const pad = (n: number) => String(n).padStart(2, "0");

  const { giorno: pG, mese: pM } = calcolaPasqua(anno);
  const pasquaDate = new Date(Date.UTC(anno, pM - 1, pG));
  const pasquettaDate = new Date(pasquaDate);
  pasquettaDate.setUTCDate(pasquettaDate.getUTCDate() + 1);

  const pasquaStr = `${anno}-${pad(pM)}-${pad(pG)}`;
  const pasquettaStr = `${anno}-${pad(pasquettaDate.getUTCMonth() + 1)}-${pad(pasquettaDate.getUTCDate())}`;

  return [
    { data: `${anno}-01-01`, nome: "Capodanno" },
    { data: `${anno}-01-06`, nome: "Epifania / Befana" },
    { data: pasquaStr, nome: "Pasqua" },
    { data: pasquettaStr, nome: "Lunedì dell'Angelo (Pasquetta)" },
    { data: `${anno}-04-25`, nome: "Festa della Liberazione" },
    { data: `${anno}-05-01`, nome: "Festa dei Lavoratori" },
    { data: `${anno}-06-02`, nome: "Festa della Repubblica" },
    { data: `${anno}-08-15`, nome: "Ferragosto (Assunzione)" },
    { data: `${anno}-11-01`, nome: "Tutti i Santi (Ognissanti)" },
    { data: `${anno}-12-08`, nome: "Immacolata Concezione" },
    { data: `${anno}-12-25`, nome: "Natale" },
    { data: `${anno}-12-26`, nome: "Santo Stefano" },
  ];
}

export function getFestivitaItaliana(dataInput: Date | string): {
  isFestivo: boolean;
  nome?: string;
} {
  try {
    let y: number, m: number, d: number;
    if (typeof dataInput === "string") {
      const parts = dataInput.slice(0, 10).split("-").map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return { isFestivo: false };
      [y, m, d] = parts;
    } else {
      y = dataInput.getFullYear();
      m = dataInput.getMonth() + 1;
      d = dataInput.getDate();
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const targetIso = `${y}-${pad(m)}-${pad(d)}`;

    const elenco = getElencoFestivitaAnno(y);
    const trovata = elenco.find((f) => f.data === targetIso);
    if (trovata) {
      return { isFestivo: true, nome: trovata.nome };
    }
    return { isFestivo: false };
  } catch {
    return { isFestivo: false };
  }
}

export interface RisoluzioneGiornoVendoly {
  data: string;
  isLavorativo: boolean;
  stato: "APERTO_STANDARD" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE" | "CHIUSO_STANDARD" | "CHIUSO_FESTIVITA" | "CHIUSO_FERIE";
  titolo: string;
  motivo?: string;
  oraInizio?: string;
  oraFine?: string;
  pausaInizio?: string | null;
  pausaFine?: string | null;
  orarioVisualizzato?: string;
  fonte: "ECCEZIONE" | "FESTIVITA_NAZIONALE" | "ORARIO_STANDARD";
}

export async function risolviStatoGiornoVendoly(
  dataStr: string
): Promise<RisoluzioneGiornoVendoly> {
  const cleanData = dataStr.slice(0, 10);
  const [y, m, d] = cleanData.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0 = Dom, 1 = Lun, 6 = Sab

  const cache = await prisma.tenantLocalCache.findUnique({
    where: { id: "singleton" },
  });
  const rispettaFestivita = (cache as any)?.rispettaFestivitaNazionali ?? true;

  // 1. Controlla EccezioneCalendario specifica per la data
  const eccezione = await prisma.eccezioneCalendario.findUnique({
    where: { data: cleanData },
  });

  if (eccezione) {
    if (eccezione.tipo === "CHIUSURA") {
      return {
        data: cleanData,
        isLavorativo: false,
        stato: "CHIUSO_FERIE",
        titolo: eccezione.titolo || "Chiusura Straordinaria",
        motivo: eccezione.note || `Chiusura speciale programmata: ${eccezione.titolo}`,
        orarioVisualizzato: "Chiuso",
        fonte: "ECCEZIONE",
      };
    }
    if (eccezione.tipo === "APERTURA_STRAORDINARIA" || eccezione.tipo === "ORARIO_SPECIALE") {
      const orarioVisualizzato = eccezione.orarioApertura && eccezione.orarioChiusura
        ? `${eccezione.orarioApertura} – ${eccezione.orarioChiusura}`
        : "Aperto (Orario speciale)";
      return {
        data: cleanData,
        isLavorativo: true,
        stato: eccezione.tipo,
        titolo: eccezione.titolo || "Apertura Straordinaria",
        motivo: `Apertura speciale: ${eccezione.titolo}`,
        oraInizio: eccezione.orarioApertura || "09:30",
        oraFine: eccezione.orarioChiusura || "19:30",
        pausaInizio: eccezione.pausaInizio,
        pausaFine: eccezione.pausaFine,
        orarioVisualizzato,
        fonte: "ECCEZIONE",
      };
    }
  }

  // 2. Controlla Festività Nazionale Italiana
  if (rispettaFestivita) {
    const fest = getFestivitaItaliana(cleanData);
    if (fest.isFestivo) {
      return {
        data: cleanData,
        isLavorativo: false,
        stato: "CHIUSO_FESTIVITA",
        titolo: fest.nome || "Festività Nazionale",
        motivo: `Chiuso per festività nazionale italiana (${fest.nome})`,
        orarioVisualizzato: "Chiuso per Festività",
        fonte: "FESTIVITA_NAZIONALE",
      };
    }
  }

  // 3. Orario Standard Negozio Vendoly
  if (dayOfWeek === 0) {
    // Domenica
    const domenicaTesto = cache?.orariDomenica || "Chiuso";
    const isChiuso = domenicaTesto.toLowerCase().includes("chiuso");
    return {
      data: cleanData,
      isLavorativo: !isChiuso,
      stato: isChiuso ? "CHIUSO_STANDARD" : "APERTO_STANDARD",
      titolo: isChiuso ? "Chiuso di Domenica" : "Aperto di Domenica",
      orarioVisualizzato: domenicaTesto,
      fonte: "ORARIO_STANDARD",
    };
  } else if (dayOfWeek === 6) {
    // Sabato
    const sabatoTesto = cache?.orariSabato || "09:30 – 19:30 (Continuato)";
    return {
      data: cleanData,
      isLavorativo: true,
      stato: "APERTO_STANDARD",
      titolo: "Aperto Sabato",
      orarioVisualizzato: sabatoTesto,
      fonte: "ORARIO_STANDARD",
    };
  } else {
    // Feriali Lunedì-Venerdì
    const ferialiTesto = cache?.orariFeriali || "09:30 – 13:00 / 15:30 – 19:30";
    return {
      data: cleanData,
      isLavorativo: true,
      stato: "APERTO_STANDARD",
      titolo: "Aperto",
      orarioVisualizzato: ferialiTesto,
      fonte: "ORARIO_STANDARD",
    };
  }
}

export interface PreavvisoFestivita {
  data: string; // YYYY-MM-DD
  nome: string;
  giorniMancanti: number;
  dataFormattata: string;
  isLavorativo: boolean;
  stato: "APERTO_STANDARD" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE" | "CHIUSO_STANDARD" | "CHIUSO_FESTIVITA" | "CHIUSO_FERIE";
  titolo: string;
  motivo?: string;
  orario?: string;
  haEccezione: boolean;
  tipoEccezione?: string | null;
}

export async function getProssimeFestivitaVendoly(
  giorniFinestra: number = 7,
  daData: Date = new Date()
): Promise<PreavvisoFestivita[]> {
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const risultati: PreavvisoFestivita[] = [];

    const cache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });
    const rispettaFestivita = (cache as any)?.rispettaFestivitaNazionali ?? true;

    const start = new Date(daData);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i <= giorniFinestra; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      const dateIso = `${y}-${pad(m)}-${pad(d)}`;

      const fest = rispettaFestivita ? getFestivitaItaliana(dateIso) : { isFestivo: false };
      const ecc = await prisma.eccezioneCalendario.findUnique({
        where: { data: dateIso },
      });

      if (!fest.isFestivo && !ecc) {
        continue;
      }

      const risoluzione = await risolviStatoGiornoVendoly(dateIso);

      const nomiGiorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
      const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
      const dataFormattata = `${nomiGiorni[current.getDay()]} ${d} ${mesi[m - 1]}`;

      risultati.push({
        data: dateIso,
        nome: ecc?.titolo || fest.nome || "Data Speciale",
        giorniMancanti: i,
        dataFormattata,
        isLavorativo: risoluzione.isLavorativo,
        stato: risoluzione.stato,
        titolo: risoluzione.titolo,
        motivo: risoluzione.motivo,
        orario: risoluzione.orarioVisualizzato,
        haEccezione: !!ecc,
        tipoEccezione: ecc?.tipo || null,
      });
    }

    return risultati;
  } catch (error) {
    console.error("Errore calcolo getProssimeFestivitaVendoly:", error);
    return [];
  }
}
