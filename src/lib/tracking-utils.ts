/**
 * Utility per il riconoscimento automatico dei corrieri e la generazione
 * di link di tracciamento universale (ParcelsApp, 17Track e portali ufficiali).
 */

export interface CarrierInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  iconBg: string;
  officialTrackingUrl?: (code: string) => string;
}

export const SUPPORTED_CARRIERS: Record<string, CarrierInfo> = {
  GLS: {
    id: "GLS",
    name: "GLS Express",
    shortName: "GLS",
    color: "blue",
    iconBg: "bg-blue-600",
    officialTrackingUrl: (c) => `https://www.gls-italy.com/?option=com_gls&view=track_trace&mode=search&numero_spedizione=${c}`,
  },
  BRT: {
    id: "BRT",
    name: "BRT Bartolini / DPD",
    shortName: "BRT",
    color: "red",
    iconBg: "bg-red-600",
    officialTrackingUrl: (c) => `https://www.brt.it/it/tracking?n_spediz=${c}`,
  },
  POSTE: {
    id: "POSTE",
    name: "Poste Italiane / SDA",
    shortName: "Poste/SDA",
    color: "amber",
    iconBg: "bg-amber-500",
    officialTrackingUrl: (c) => `https://www.poste.it/cerca/index.html#/risultati-ricerca-spedizioni/${c}`,
  },
  INPOST: {
    id: "INPOST",
    name: "InPost Locker & Point",
    shortName: "InPost",
    color: "yellow",
    iconBg: "bg-yellow-500",
    officialTrackingUrl: (c) => `https://inpost.it/trova-il-tuo-pacco?number=${c}`,
  },
  DHL: {
    id: "DHL",
    name: "DHL Express",
    shortName: "DHL",
    color: "amber",
    iconBg: "bg-amber-600",
    officialTrackingUrl: (c) => `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${c}`,
  },
  UPS: {
    id: "UPS",
    name: "UPS",
    shortName: "UPS",
    color: "amber",
    iconBg: "bg-amber-900",
    officialTrackingUrl: (c) => `https://www.ups.com/track?tracknum=${c}`,
  },
  SUBITO: {
    id: "SUBITO",
    name: "TuttoSubito Spedizioni",
    shortName: "TuttoSubito",
    color: "emerald",
    iconBg: "bg-emerald-600",
  },
  VINTED: {
    id: "VINTED",
    name: "Vinted Spedizioni",
    shortName: "Vinted",
    color: "cyan",
    iconBg: "bg-cyan-600",
  },
  GENERIC: {
    id: "GENERIC",
    name: "Corriere Espresso",
    shortName: "Corriere",
    color: "slate",
    iconBg: "bg-slate-700",
  },
};

/**
 * Autodetect del corriere in base al formato del codice di tracciamento
 */
export function detectCarrier(rawTrackingCode: string): CarrierInfo {
  if (!rawTrackingCode) return SUPPORTED_CARRIERS.GENERIC;
  const code = rawTrackingCode.trim().toUpperCase();

  // Prefissi espliciti
  if (code.startsWith("GLS-") || code.startsWith("GLS")) return SUPPORTED_CARRIERS.GLS;
  if (code.startsWith("BRT-") || code.startsWith("BRT")) return SUPPORTED_CARRIERS.BRT;
  if (code.startsWith("POSTE-") || code.startsWith("SDA-") || code.startsWith("SDA")) return SUPPORTED_CARRIERS.POSTE;
  if (code.startsWith("INPOST-") || code.startsWith("INPOST")) return SUPPORTED_CARRIERS.INPOST;
  if (code.startsWith("DHL-") || code.startsWith("DHL")) return SUPPORTED_CARRIERS.DHL;
  if (code.startsWith("UPS-") || code.startsWith("1Z")) return SUPPORTED_CARRIERS.UPS;
  if (code.startsWith("SUBITO-") || code.startsWith("SUBITO")) return SUPPORTED_CARRIERS.SUBITO;
  if (code.startsWith("VINTED-") || code.startsWith("VINTED")) return SUPPORTED_CARRIERS.VINTED;

  // Pattern euristici
  // UPS: Inizia tipicamente per "1Z"
  if (/^1Z[0-9A-Z]{16}$/i.test(code)) return SUPPORTED_CARRIERS.UPS;

  // InPost: 24 cifre numeriche
  if (/^\d{24}$/.test(code)) return SUPPORTED_CARRIERS.INPOST;

  // Poste Italiane / SDA: 13 caratteri alfanumerici terminanti con IT (es. 2 lettere + 9 cifre + IT)
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(code) || /^\d{12,14}$/.test(code)) return SUPPORTED_CARRIERS.POSTE;

  // BRT: Spesso 12 cifre numeriche
  if (/^\d{12}$/.test(code)) return SUPPORTED_CARRIERS.BRT;

  // Se finisce con IT o sembra GLS
  if (code.endsWith("IT") && code.length >= 9) return SUPPORTED_CARRIERS.GLS;

  return SUPPORTED_CARRIERS.GENERIC;
}

/**
 * Pulisce il codice rimuovendo prefissi interni tipo "GLS-" o spazi
 */
export function cleanTrackingCode(rawCode: string): string {
  if (!rawCode) return "";
  return rawCode
    .replace(/^(GLS|BRT|POSTE|SDA|INPOST|DHL|UPS|SUBITO|VINTED)[-_:\s]*/i, "")
    .trim();
}

/**
 * Genera il link di tracciamento universale ParcelsApp (https://parcelsapp.com/it/tracking/...)
 */
export function getParcelsAppUrl(trackingCode: string): string {
  const clean = cleanTrackingCode(trackingCode) || trackingCode.trim();
  return `https://parcelsapp.com/it/tracking/${encodeURIComponent(clean)}`;
}

/**
 * Genera il link 17Track alternativo
 */
export function get17TrackUrl(trackingCode: string): string {
  const clean = cleanTrackingCode(trackingCode) || trackingCode.trim();
  return `https://t.17track.net/it#nums=${encodeURIComponent(clean)}`;
}

/**
 * Genera il messaggio WhatsApp di notifica spedizione con link universale ParcelsApp
 */
export function buildWhatsAppTrackingMessage({
  customerName,
  orderNumber,
  storeName,
  trackingCode,
  carrierName,
}: {
  customerName: string;
  orderNumber: string;
  storeName: string;
  trackingCode: string;
  carrierName?: string;
}): string {
  const parcelsLink = getParcelsAppUrl(trackingCode);
  const carrierText = carrierName ? ` tramite ${carrierName}` : "";

  return `📦 Ciao ${customerName}! Il tuo ordine #${orderNumber} presso ${storeName} è stato affidato al corriere${carrierText}.\n\n🚚 Codice spedizione: ${trackingCode}\n\n🔍 Puoi seguire il pacco in tempo reale con il tracking universale qui:\n${parcelsLink}\n\nGrazie per aver scelto il nostro negozio! Rimaniamo a disposizione per qualsiasi informazione.`;
}
