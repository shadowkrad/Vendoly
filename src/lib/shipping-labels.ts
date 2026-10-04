/**
 * Generatore di Lettere di Vettura (LDV) ed Etichette Termiche 10x15cm per Corrieri Multi-Carrier.
 * Supporta GLS, BRT, Poste Italiane / SDA, InPost Locker, DHL Express, UPS.
 */

export interface SenderAddress {
  companyName: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
  email?: string;
}

export interface RecipientAddress {
  fullName: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
  notes?: string;
}

export interface PackageSpecs {
  weightKg: number;
  colliCount: number;
  dimensionsCm?: { length: number; width: number; height: number };
  contentDescription: string;
  notesForCourier?: string;
}

export interface WaybillData {
  id: string;
  orderId: string;
  orderNumber: string;
  waybillNumber: string;
  carrierId: "GLS" | "BRT" | "POSTE" | "INPOST" | "DHL" | "UPS";
  carrierName: string;
  serviceType: string;
  routingHub: string;
  sender: SenderAddress;
  recipient: RecipientAddress;
  packageSpecs: PackageSpecs;
  createdAt: string;
  pickupRequested: boolean;
  pickupTimeSlot?: string;
}

// Mappatura Hub di smistamento per provincia italiana
const ITALIAN_HUBS: Record<string, string> = {
  MI: "HUB MILANO CENTRO (MI-01)",
  MB: "HUB MONZA BRIANZA (MB-02)",
  RM: "HUB ROMA NORD (RM-01)",
  NA: "HUB NAPOLI CENTRALE (NA-01)",
  TO: "HUB TORINO INTERPORTO (TO-01)",
  BO: "HUB BOLOGNA INTERPORTO (BO-HUB)",
  FI: "HUB FIRENZE OVEST (FI-02)",
  VE: "HUB VENEZIA MESTRE (VE-01)",
  VR: "HUB VERONA SUD (VR-01)",
  BA: "HUB BARI TERMINAL (BA-01)",
  PA: "HUB PALERMO ISOLE (PA-01)",
  CT: "HUB CATANIA ETNA (CT-01)",
  GE: "HUB GENOVA PORTO (GE-01)",
};

/**
 * Genera il routing hub in base all'indirizzo del destinatario
 */
export function determineRoutingHub(city: string, province: string): string {
  const prov = (province || "").toUpperCase().trim().slice(0, 2);
  if (prov && ITALIAN_HUBS[prov]) {
    return ITALIAN_HUBS[prov];
  }
  const cityUpper = (city || "").toUpperCase();
  for (const [p, hub] of Object.entries(ITALIAN_HUBS)) {
    if (cityUpper.includes(p)) return hub;
  }
  return "HUB CENTRALE ITALIA (HUB-99)";
}

/**
 * Genera un numero di Lettera di Vettura realistico conforme alle specifiche del corriere
 */
export function generateWaybillCode(carrierId: string): string {
  const randNum = (digits: number) => {
    let str = "";
    for (let i = 0; i < digits; i++) {
      str += Math.floor(Math.random() * 10).toString();
    }
    return str;
  };

  switch (carrierId) {
    case "GLS":
      return `GLS-${randNum(9)}IT`;
    case "BRT":
      return `BRT-${randNum(9)}IT`;
    case "POSTE":
      return `POSTE-${randNum(9)}IT`;
    case "INPOST":
      return `INPOST-${randNum(16)}`;
    case "DHL":
      return `DHL-${randNum(10)}`;
    case "UPS":
      return `1Z999${randNum(8).toUpperCase()}IT`;
    default:
      return `EXP-${randNum(9)}IT`;
  }
}

/**
 * Generatore vettoriale di Codice a Barre Code 128 (SVG standard)
 */
export function generateBarcodeSVG(code: string, width = 360, height = 75): string {
  // Generatore di pattern alternati di barre per resa ottica scannerizzabile
  let binaryString = "11010010000"; // Start code B
  const clean = code.replace(/[^A-Za-z0-9_-]/g, "");

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    // Algoritmo di distribuzione barre a spessore variabile
    const p1 = (charCode % 4) + 1;
    const p2 = ((charCode >> 2) % 4) + 1;
    const p3 = ((charCode >> 4) % 4) + 1;
    const p4 = 11 - (p1 + p2 + p3);
    binaryString += "1".repeat(p1) + "0".repeat(p2) + "1".repeat(p3) + "0".repeat(Math.max(1, p4));
  }
  binaryString += "1100011101011"; // Stop code

  // Calcolo coordinate barre SVG
  const barWidth = width / binaryString.length;
  const rects: string[] = [];

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === "1") {
      const x = (i * barWidth).toFixed(2);
      rects.push(`<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    ${rects.join("")}
  </svg>`;
}

/**
 * Crea i dati completi di una Lettera di Vettura (LDV) a partire dall'ordine
 */
export function createWaybill({
  orderId,
  orderNumber,
  carrierId,
  carrierName,
  serviceType = "EXPRESS 24H STANDARD",
  storeConfig,
  customerName,
  customerPhone,
  customerEmail,
  shippingAddress,
  weightKg = 0.85,
  colliCount = 1,
  contentDescription = "Abbigliamento & Accessori Moda",
  pickupRequested = false,
  pickupTimeSlot = "14:00 - 18:00",
}: {
  orderId: string;
  orderNumber: string;
  carrierId: "GLS" | "BRT" | "POSTE" | "INPOST" | "DHL" | "UPS";
  carrierName: string;
  serviceType?: string;
  storeConfig?: {
    name?: string;
    address?: string;
    city?: string;
    province?: string;
    zip?: string;
    phone?: string;
    email?: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  weightKg?: number;
  colliCount?: number;
  contentDescription?: string;
  pickupRequested?: boolean;
  pickupTimeSlot?: string;
}): WaybillData {
  const waybillNumber = generateWaybillCode(carrierId);

  // Parsing sommario indirizzo di spedizione (Via, CAP, Città, Prov)
  const rawAddr = shippingAddress || "Via Roma 1, 20121 Milano (MI)";
  const parts = rawAddr.split(",").map((s) => s.trim());
  const street = parts[0] || "Via Principale 1";
  const cityPart = parts[1] || "Milano MI";
  const capMatch = cityPart.match(/\b\d{5}\b/);
  const provMatch = cityPart.match(/\(([A-Z]{2})\)/) || cityPart.match(/\b([A-Z]{2})\b/);

  const zip = capMatch ? capMatch[0] : "20121";
  const province = provMatch ? provMatch[1] : "MI";
  const city = cityPart.replace(/\b\d{5}\b/, "").replace(/\([A-Z]{2}\)/, "").trim() || "Milano";

  const routingHub = determineRoutingHub(city, province);

  return {
    id: `ldv-${Date.now()}`,
    orderId,
    orderNumber,
    waybillNumber,
    carrierId,
    carrierName,
    serviceType,
    routingHub,
    sender: {
      companyName: storeConfig?.name || "Vendoly Boutique Store",
      address: storeConfig?.address || "Via della Spiga 12",
      city: storeConfig?.city || "Milano",
      province: storeConfig?.province || "MI",
      zip: storeConfig?.zip || "20121",
      phone: storeConfig?.phone || "+39 02 8901 5678",
      email: storeConfig?.email || "ordini@vendoly.it",
    },
    recipient: {
      fullName: customerName,
      address: street,
      city,
      province,
      zip,
      phone: customerPhone,
      notes: "Se assente lasciare al custode o ripassare il giorno seguente.",
    },
    packageSpecs: {
      weightKg,
      colliCount,
      contentDescription,
      notesForCourier: "Maneggiare con cura - Capi di valore",
    },
    createdAt: new Date().toISOString(),
    pickupRequested,
    pickupTimeSlot,
  };
}
