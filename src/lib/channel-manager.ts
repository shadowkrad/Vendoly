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
}

/**
 * Generatore Quick Lister: produce annunci pronti da incollare e formattati su misura
 * per Subito.it, Facebook Marketplace, eBay e Vinted (Issue #2).
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

  switch (channel) {
    case "SUBITO": {
      const price = product.subitoPrice || product.price;
      const title = `${product.name} - ${conditionLabel} [${product.sku}]`;
      const formattedText = `
🏷️ ${product.name}

📌 CONDIZIONI: ${conditionLabel}
📦 CATEGORIA: ${categoryName}
🔖 CODICE / SKU: ${product.sku}
💰 PREZZO: € ${price.toFixed(2)} (Non trattabile)

📝 DESCRIZIONE:
${baseDesc}

📍 CONSEGNA & SPEDIZIONE:
- Ritiro a mano disponibile presso il punto vendita ${storeName}
- Spedizione sicura e tracciata con TuttoSubito (consegna 24/48h)

Massima serietà e disponibilità per ulteriori foto o informazioni.
      `.trim();

      return {
        channel: "SUBITO",
        channelName: "Subito.it",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Spedizione TuttoSubito o Ritiro a mano",
        tags: ["subito", "affare", categoryName.toLowerCase(), product.sku],
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

${baseDesc}

✅ Garanzia di originalità e scontrino fiscale al banco.
📍 Posizione: Negozio fisico / Ritiro immediato
🚚 Spedizione in tutta Italia con corriere espresso.

👉 Scrivici in privato o commenta per bloccare il pezzo prima che finisca!
#${categoryName.replace(/\s+/g, "")} #Vendoly #${product.sku} #Affari
      `.trim();

      return {
        channel: "FACEBOOK",
        channelName: "Facebook Marketplace",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Ritiro locale consigliato / Spedizione express",
        tags: ["marketplace", "local", categoryName.toLowerCase()],
      };
    }

    case "EBAY": {
      const price = product.ebayPrice || product.price * 1.05; // 5% buffer per commissioni
      const title = `${product.name} Condizione: ${conditionLabel} SKU: ${product.sku}`;
      const formattedText = `
══════════════════════════════════════════════
  ${product.name.toUpperCase()}
══════════════════════════════════════════════

• Codice Prodotto / SKU: ${product.sku}
• Condizioni dell'oggetto: ${conditionLabel}
• Reparto / Categoria: ${categoryName}
• Venditore professionale: ${storeName}

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
        tags: ["ebay", "professional", product.sku],
      };
    }

    case "VINTED": {
      const price = product.vintedPrice || product.price;
      const title = `${product.name} (${conditionLabel})`;
      const formattedText = `
✨ ${product.name}
Stato: ${conditionLabel}
Prezzo: € ${price.toFixed(2)}

${baseDesc}

📦 Spedizione rapida con imballo accurato tramite i punti di ritiro Vinted (InPost / BRT / UPS).
📸 Tutte le foto sono reali del prodotto presente in negozio.
Disponibile per sconti su set! 🛍️
      `.trim();

      return {
        channel: "VINTED",
        channelName: "Vinted",
        title,
        price,
        formattedText,
        recommendedCategory: categoryName,
        shippingNotes: "Pacco medio - InPost / Locker",
        tags: ["vinted", "outfit", categoryName.toLowerCase()],
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
