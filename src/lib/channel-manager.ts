export type SalesChannel = "SUBITO" | "FACEBOOK" | "EBAY" | "VINTED";

export interface ChannelListingItem {
  id: string;
  productId: string;
  channel: SalesChannel;
  status: "DRAFT" | "ACTIVE" | "SOLD" | "ARCHIVED";
  externalUrl?: string | null;
  externalId?: string | null;
  listedPrice: number;
  listedAt?: string | null;
  soldAt?: string | null;
}

export interface GeneratedListingContent {
  channel: SalesChannel;
  channelName: string;
  title: string;
  price: number;
  formattedText: string;
  recommendedCategory: string;
  shippingNotes: string;
  tags: string[];
}

export interface ProductForListing {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  condition?: string | null;
  subitoPrice?: number | null;
  ebayPrice?: number | null;
  vintedPrice?: number | null;
  marketplacePrice?: number | null;
  category?: { name: string } | null;
  brandName?: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  weight?: number | null;
  conditionNotes?: string | null;
  tags?: string[] | null;
}

export const CHANNEL_FEES = {
  SUBITO: { percent: 3, fixedFee: 0, shippingCost: 5.9, label: "~3% TuttoSubito", color: "amber" },
  VINTED: { percent: 0, fixedFee: 0, shippingCost: 0, label: "Gratis (buyer paga)", color: "cyan" },
  EBAY: { percent: 13, fixedFee: 0.35, shippingCost: 6.9, label: "~13% + €0.35", color: "blue" },
  FACEBOOK: { percent: 0, fixedFee: 0, shippingCost: 0, label: "Gratis (ritiro locale)", color: "indigo" },
  NEGOZIO: { percent: 0, fixedFee: 0, shippingCost: 0, label: "Nessuna commissione", color: "emerald" },
} as const;

export function calculateNetProfit(
  price: number,
  channel: SalesChannel | "NEGOZIO"
): {
  grossPrice: number;
  commission: number;
  shippingCost: number;
  netProfit: number;
} {
  const feeConfig = CHANNEL_FEES[channel];
  const commission = Number(((price * feeConfig.percent) / 100 + feeConfig.fixedFee).toFixed(2));
  const shippingCost = feeConfig.shippingCost;
  const netProfit = Number(Math.max(0, price - commission - (channel === "SUBITO" || channel === "EBAY" ? 0 : 0)).toFixed(2));

  return {
    grossPrice: price,
    commission,
    shippingCost,
    netProfit: Number((price - commission).toFixed(2)),
  };
}

/**
 * Generatore Quick Lister: produce annunci pronti da incollare e formattati su misura
 * per Subito.it, Facebook Marketplace, eBay e Vinted (Issue #2 & #6).
 */
export function generateChannelListing(
  product: ProductForListing,
  channel: SalesChannel,
  storeName: string = "Vendoly Boutique"
): GeneratedListingContent {
  const conditionLabel = getConditionLabel(product.condition || "NUOVO");
  const baseDesc =
    product.description ||
    `${product.name} originale, di alta qualità e garantito.`;
  const categoryName = product.category?.name || "Generale";
  const brand = product.brandName ? `Brand: ${product.brandName}` : "";
  const size = product.size ? `Taglia: ${product.size}` : "";
  const color = product.color ? `Colore: ${product.color}` : "";
  const material = product.material ? `Materiale: ${product.material}` : "";
  const defectNote = product.conditionNotes ? `\n⚠️ Note usura/difetti: ${product.conditionNotes}` : "";
  const extraTags = (product.tags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");

  switch (channel) {
    case "SUBITO": {
      const price = product.subitoPrice || product.price;
      const title = `${product.name} - ${conditionLabel} [${product.sku}]`;
      const formattedText = `
🏷️ ${product.name}

📌 CONDIZIONI: ${conditionLabel}
📦 CATEGORIA: ${categoryName}
${brand ? `🏷️ BRAND: ${product.brandName}\n` : ""}${size ? `📐 TAGLIA: ${product.size}\n` : ""}${color ? `🎨 COLORE: ${product.color}\n` : ""}${material ? `🧵 MATERIALE: ${product.material}\n` : ""}🔖 CODICE / SKU: ${product.sku}
💰 PREZZO: € ${price.toFixed(2)} (Non trattabile)
${defectNote}

📝 DESCRIZIONE:
${baseDesc}

📍 CONSEGNA & SPEDIZIONE:
- Ritiro a mano disponibile presso il punto vendita ${storeName}
- Spedizione sicura e tracciata con TuttoSubito (consegna 24/48h)

Massima serietà e disponibilità per ulteriori foto o informazioni.
${extraTags}
      `.trim();

      return {
        channel: "SUBITO",
        channelName: "Subito.it",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Spedizione TuttoSubito o Ritiro a mano",
        tags: ["subito", "affare", categoryName.toLowerCase(), product.sku, ...(product.tags || [])],
      };
    }

    case "FACEBOOK": {
      const price = product.marketplacePrice || product.price;
      const title = `🔥 ${product.name} - ${conditionLabel}`;
      const formattedText = `
✨ VENDITA PRESSO ${storeName.toUpperCase()} ✨

${product.name}
Prezzo: € ${price.toFixed(2)}
Stato: ${conditionLabel}
${product.brandName ? `Marca: ${product.brandName}\n` : ""}${product.size ? `Misura/Taglia: ${product.size}\n` : ""}${product.color ? `Colore: ${product.color}\n` : ""}
${baseDesc}
${defectNote}

✅ Garanzia di originalità e scontrino fiscale al banco.
📍 Posizione: Negozio fisico / Ritiro immediato
🚚 Spedizione in tutta Italia con corriere espresso.

👉 Scrivici in privato o commenta per bloccare il pezzo prima che finisca!
#${categoryName.replace(/\s+/g, "")} #Vendoly #${product.sku} #Affari ${extraTags}
      `.trim();

      return {
        channel: "FACEBOOK",
        channelName: "Facebook Marketplace",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Ritiro locale consigliato / Spedizione express",
        tags: ["marketplace", "local", categoryName.toLowerCase(), ...(product.tags || [])],
      };
    }

    case "EBAY": {
      const price = product.ebayPrice || product.price * 1.05; // 5% buffer per commissioni
      const title = `${product.name} Condizione: ${conditionLabel} SKU: ${product.sku}`.slice(0, 80);
      const formattedText = `
══════════════════════════════════════════════
  ${product.name.toUpperCase()}
══════════════════════════════════════════════

• Codice Prodotto / SKU: ${product.sku}
• Condizioni dell'oggetto: ${conditionLabel}
• Reparto / Categoria: ${categoryName}
${product.brandName ? `• Marca: ${product.brandName}\n` : ""}${product.size ? `• Taglia: ${product.size}\n` : ""}${product.color ? `• Colore: ${product.color}\n` : ""}${product.material ? `• Materiale: ${product.material}\n` : ""}• Venditore professionale: ${storeName}
${defectNote}

DESCRIZIONE DEL PRODOTTO:
${baseDesc}

DETTAGLI DI SPEDIZIONE & PAGAMENTI:
- Spedizione con Corriere Espresso Tracciabile (GLS / DHL / Poste)
- Spedizione entro 24h lavorative dal pagamento
- Imballaggio ultra protettivo
- Documento fiscale emesso all'ordine

DIRITTO DI RECESSO:
Diritto di recesso garantito 14 giorni secondo normativa europea.
      `.trim();

      return {
        channel: "EBAY",
        channelName: "eBay",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Corriere espresso tracciato 24/48h",
        tags: ["ebay", "professional", product.sku, ...(product.tags || [])],
      };
    }

    case "VINTED": {
      const price = product.vintedPrice || product.price;
      const title = `${product.name} (${conditionLabel})`;
      const formattedText = `
✨ ${product.name}
Stato: ${conditionLabel}
Prezzo: € ${price.toFixed(2)}
${product.brandName ? `Brand: ${product.brandName}\n` : ""}${product.size ? `Taglia: ${product.size}\n` : ""}${product.color ? `Colore: ${product.color}\n` : ""}${product.material ? `Materiale: ${product.material}\n` : ""}
${baseDesc}
${defectNote}

📦 Spedizione rapida con imballo accurato tramite i punti di ritiro Vinted (InPost / BRT / UPS).
📸 Tutte le foto sono reali del prodotto presente in negozio.
Disponibile per sconti su set! 🛍️
${extraTags}
      `.trim();

      return {
        channel: "VINTED",
        channelName: "Vinted",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Pacco medio - InPost / Locker",
        tags: ["vinted", "outfit", categoryName.toLowerCase(), ...(product.tags || [])],
      };
    }
  }
}

function getConditionLabel(condition: string): string {
  switch (condition) {
    case "NUOVO":
      return "Nuovo con etichetta/scatola";
    case "COME_NUOVO":
      return "Come nuovo (ottime condizioni)";
    case "OTTIMO":
      return "Usato in ottime condizioni";
    case "BUONO":
      return "Usato in buone condizioni";
    default:
      return "Nuovo";
  }
}

