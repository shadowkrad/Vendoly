/**
 * Normalizza un numero di telefono rimuovendo spazi, trattini, caratteri speciali
 * e il prefisso internazionale italiano (+39 / 0039 / 39).
 * Esempio: "+39 334 305 7786" -> "3343057786"
 * Esempio: "334 305 7786"     -> "3343057786"
 * Esempio: "00393343057786"   -> "3343057786"
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+39")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("0039")) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  cleaned = cleaned.replace(/\D/g, "");

  // Se ha 12 cifre e inizia con 39 (prefisso italiano inserito senza +)
  if (cleaned.length === 12 && cleaned.startsWith("39")) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Genera tutte le varianti di ricerca possibili per trovare un cliente
 * nel database anche se memorizzato con formati precedenti (con +39, spazi, ecc.).
 */
export function getPhoneSearchConditions(rawPhone?: string | null): any[] {
  if (!rawPhone) return [];
  const normalized = normalizePhone(rawPhone);
  const trimmed = rawPhone.trim();
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const last9 = normalized.length >= 9 ? normalized.slice(-9) : digitsOnly.slice(-9);

  const conditions: any[] = [];
  const added = new Set<string>();

  const addCondition = (val: string) => {
    if (val && val.length >= 6 && !added.has(val)) {
      added.add(val);
      conditions.push({ phone: val });
    }
  };

  addCondition(normalized);
  addCondition(digitsOnly);
  addCondition(trimmed);
  addCondition(`+39 ${normalized}`);
  addCondition(`+39${normalized}`);
  addCondition(`0039${normalized}`);
  addCondition(`39${normalized}`);

  if (last9 && last9.length >= 8) {
    conditions.push({ phone: { contains: last9 } });
  }

  return conditions;
}

/**
 * Formatta un numero di telefono per la visualizzazione all'utente
 * Esempio: "3343057786" -> "+39 334 305 7786"
 */
export function formatPhoneDisplay(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  const norm = normalizePhone(rawPhone);
  if (norm.length === 10) {
    return `+39 ${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6)}`;
  }
  return rawPhone.trim();
}

export type TipoTelefono = "CELLULARE" | "FISSO" | "ESTERO" | "NON_VALIDO";

/**
 * Classifica un numero: CELLULARE (3xx), FISSO (0xx, es. 0575), ESTERO (prefisso internazionale non italiano)
 * oppure NON_VALIDO (vuoto, troppo corto, anonimizzato). Un fisso e' ammesso come recapito ma non riceve
 * SMS / WhatsApp / Telegram.
 */
export function classificaTelefono(rawPhone?: string | null): TipoTelefono {
  if (!rawPhone) return "NON_VALIDO";
  const raw = rawPhone.trim();
  const internazionale = /^(\+|00)/.test(raw) && !/^(\+39|0039)/.test(raw);
  let norm = normalizePhone(raw);
  // Fisso scritto con il prefisso italiano senza "+" (es. 39057512345)
  if (!internazionale && norm.length >= 11 && /^39[03]/.test(norm)) norm = norm.slice(2);
  if (norm.length < 6) return "NON_VALIDO";
  if (internazionale) return "ESTERO";
  if (/^3\d{8,9}$/.test(norm)) return "CELLULARE";
  if (/^0\d{5,10}$/.test(norm)) return "FISSO";
  return "NON_VALIDO";
}

/** Solo i cellulari (e i numeri esteri) possono ricevere messaggi digitali. */
export function puoRicevereMessaggi(rawPhone?: string | null): boolean {
  const t = classificaTelefono(rawPhone);
  return t === "CELLULARE" || t === "ESTERO";
}

export const ETICHETTA_TELEFONO: Record<TipoTelefono, string> = {
  CELLULARE: "Cellulare",
  FISSO: "Telefono fisso",
  ESTERO: "Numero estero",
  NON_VALIDO: "Da verificare",
};

/** Data di nascita valida: non nel futuro e non anteriore al 1900. Restituisce la data oppure null. */
export function parseDataNascita(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now()) return null;
  if (d.getUTCFullYear() < 1900) return null;
  return d;
}
