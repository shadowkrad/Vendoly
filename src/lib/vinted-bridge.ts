/**
 * Vendoly Vinted Bridge Engine
 * Gestisce la logica di preparazione dati, calcolo pacchi, download foto
 * e condivisione mobile per la pubblicazione su Vinted (Opzione 2 e Vendoly Assistant).
 */

export interface VintedProductInput {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  category?: string;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  weight?: number | null; // in grammi
  condition?: string | null;
  conditionNotes?: string | null;
  images?: string | string[]; // JSON string o array
  tags?: string | string[] | null;
}

export type VintedParcelSize = "PICCOLO" | "MEDIO" | "GRANDE";

export interface VintedParcelInfo {
  size: VintedParcelSize;
  label: string;
  weightRange: string;
  description: string;
  examples: string;
}

/**
 * Calcola il formato del pacco di spedizione Vinted in base al peso o alla categoria.
 */
export function calculateVintedParcelSize(
  weight?: number | null,
  category?: string
): VintedParcelInfo {
  // Se è specificato il peso in grammi
  if (weight && weight > 0) {
    if (weight <= 500) {
      return {
        size: "PICCOLO",
        label: "Pacco Piccolo",
        weightRange: "Fino a 500g",
        description: "Ideale per capi leggeri e accessori.",
        examples: "T-shirt, top, canotte, intimo, foulard, gioielli",
      };
    }
    if (weight <= 1000) {
      return {
        size: "MEDIO",
        label: "Pacco Medio",
        weightRange: "Fino a 1.000g (1 kg)",
        description: "Il formato più comune per abbigliamento.",
        examples: "Maglioni, camicie, pantaloni, felpe, gonne, sneakers",
      };
    }
    return {
      size: "GRANDE",
      label: "Pacco Grande",
      weightRange: "Fino a 2.000g (2 kg)",
      description: "Ideale per capi pesanti o voluminosi.",
      examples: "Cappotti, giubbotti, stivali, borse grandi, completi",
    };
  }

  // Euristica basata sul nome della categoria
  const cat = (category || "").toLowerCase();
  if (
    cat.includes("accessori") ||
    cat.includes("gioielli") ||
    cat.includes("t-shirt") ||
    cat.includes("top") ||
    cat.includes("intimo")
  ) {
    return {
      size: "PICCOLO",
      label: "Pacco Piccolo",
      weightRange: "Fino a 500g",
      description: "Ideale per capi leggeri e accessori.",
      examples: "T-shirt, top, canotte, intimo, foulard, gioielli",
    };
  }

  if (
    cat.includes("giacc") ||
    cat.includes("cappott") ||
    cat.includes("giubbot") ||
    cat.includes("stival") ||
    cat.includes("lotti")
  ) {
    return {
      size: "GRANDE",
      label: "Pacco Grande",
      weightRange: "Fino a 2.000g (2 kg)",
      description: "Ideale per capi pesanti o voluminosi.",
      examples: "Cappotti, giubbotti, stivali, borse grandi, completi",
    };
  }

  // Default: Pacco Medio
  return {
    size: "MEDIO",
    label: "Pacco Medio",
    weightRange: "Fino a 1.000g (1 kg)",
    description: "Il formato più comune per abbigliamento.",
    examples: "Maglioni, camicie, pantaloni, felpe, gonne, sneakers",
  };
}

/**
 * Converte le condizioni interne di Vendoly nella tassonomia Vinted.
 */
export function mapConditionToVinted(condition?: string | null): {
  id: string;
  label: string;
  description: string;
} {
  switch ((condition || "").toUpperCase()) {
    case "NUOVO":
      return {
        id: "NEW_WITH_TAGS",
        label: "Nuovo con cartellino",
        description: "Articolo mai indossato, con etichette originali integre.",
      };
    case "COME_NUOVO":
      return {
        id: "NEW_WITHOUT_TAGS",
        label: "Nuovo senza cartellino",
        description: "Articolo nuovo, mai indossato, senza etichette o confezione.",
      };
    case "OTTIMO":
      return {
        id: "VERY_GOOD",
        label: "Ottime condizioni",
        description: "Poco indossato, senza difetti o segni evidenti di usura.",
      };
    case "BUONO":
    default:
      return {
        id: "GOOD",
        label: "Buone condizioni",
        description: "Indossato con piccoli segni di utilizzo indicati nella descrizione.",
      };
  }
}

/**
 * Estrae un array pulito di URL immagini da formato JSON o stringa.
 */
export function parseProductImages(imagesRaw?: string | string[]): string[] {
  if (!imagesRaw) return [];
  if (Array.isArray(imagesRaw)) return imagesRaw;
  try {
    const parsed = JSON.parse(imagesRaw);
    return Array.isArray(parsed) ? parsed : [imagesRaw];
  } catch {
    return [imagesRaw];
  }
}

/**
 * Genera il payload completo ottimizzato per Vinted.
 */
export function generateVintedPayload(product: VintedProductInput) {
  const condition = mapConditionToVinted(product.condition);
  const parcel = calculateVintedParcelSize(product.weight, product.category);
  const images = parseProductImages(product.images);

  // Hashtag automatici di visibilità
  const catSlug = (product.category || "moda").toLowerCase().replace(/[^a-z0-9]/g, "");
  const brandSlug = (product.brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const baseTags = [`#${catSlug}`, "#secondhand", "#vinteditaly", "#outfit"];
  if (brandSlug) baseTags.unshift(`#${brandSlug}`);

  let parsedCustomTags: string[] = [];
  if (product.tags) {
    if (Array.isArray(product.tags)) {
      parsedCustomTags = product.tags.map((t) => (t.startsWith("#") ? t : `#${t}`));
    } else {
      try {
        const arr = JSON.parse(product.tags);
        if (Array.isArray(arr)) parsedCustomTags = arr.map((t) => (t.startsWith("#") ? t : `#${t}`));
      } catch {
        parsedCustomTags = product.tags.split(",").map((t) => `#${t.trim().replace(/^#/, "")}`);
      }
    }
  }

  const allTags = Array.from(new Set([...baseTags, ...parsedCustomTags])).join(" ");

  // Testo descrizione strutturato per Vinted
  const lines = [
    `✨ ${product.title}`,
    `Stato: ${condition.label}`,
    `Prezzo: € ${product.price.toFixed(2)}`,
    product.brand ? `Brand / Marca: ${product.brand}` : "",
    product.size ? `Taglia: ${product.size}` : "",
    product.color ? `Colore: ${product.color}` : "",
    product.material ? `Materiale: ${product.material}` : "",
    "",
    product.description || "Capo originale selezionato e garantito.",
    product.conditionNotes ? `\n⚠️ Dettagli d'usura/difetti: ${product.conditionNotes}` : "",
    "",
    `📦 Spedizione rapida con imballo accurato tramite i punti di ritiro Vinted (InPost / Locker / BRT).`,
    `📸 Tutte le foto sono reali del prodotto presente in negozio.`,
    `Disponibile per sconti su set! 🛍️`,
    "",
    allTags,
  ].filter((l) => l !== "");

  const formattedDescription = lines.join("\n");

  return {
    productId: product.id,
    sku: product.sku || product.id,
    title: `${product.title} (${condition.label})`,
    description: formattedDescription,
    price: product.price,
    brand: product.brand || "",
    size: product.size || "",
    color: product.color || "",
    conditionId: condition.id,
    conditionLabel: condition.label,
    parcelSize: parcel.size,
    parcelLabel: parcel.label,
    parcelInfo: parcel,
    images,
  };
}

/**
 * Rileva se il client sta navigando da un dispositivo mobile/tablet.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Converte un array di URL immagini in oggetti File JS tramite fetch().
 */
export async function fetchImagesAsFiles(
  imageUrls: string[],
  baseName: string = "prodotto"
): Promise<File[]> {
  const files: File[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const file = new File([blob], `${baseName}_foto_${i + 1}.${ext}`, {
        type: blob.type || "image/jpeg",
      });
      files.push(file);
    } catch (err) {
      console.warn(`[VintedBridge] Impossibile convertire immagine ${url}:`, err);
    }
  }
  return files;
}

/**
 * Scarica una lista di immagini in sequenza su desktop.
 */
export async function downloadPhotosBatch(
  imageUrls: string[],
  prefix: string = "vinted"
) {
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${prefix}_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      // Piccolo delay per evitare blocchi dei download multipli dal browser
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error("[VintedBridge] Errore download immagine:", url, err);
    }
  }
}

/**
 * Esegue il Quick-Bridge per inviare il prodotto a Vinted in base alla piattaforma.
 */
export async function executeVintedQuickBridge(
  product: VintedProductInput
): Promise<{
  success: boolean;
  mode: "mobile-share" | "desktop-download" | "extension-bridge";
  message: string;
}> {
  const payload = generateVintedPayload(product);

  // 1. Copia sempre la descrizione formattata negli appunti
  try {
    await navigator.clipboard.writeText(payload.description);
  } catch (e) {
    console.warn("[VintedBridge] Errore scrittura clipboard:", e);
  }

  // 2. Controlla se è installata l'estensione Vendoly Assistant su Chrome/Edge Desktop
  const isExtensionInstalled =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-vendoly-assistant") === "installed";

  if (isExtensionInstalled) {
    window.postMessage(
      {
        source: "vendoly-web",
        type: "START_VINTED_CROSSPOST",
        payload,
      },
      "*"
    );
    return {
      success: true,
      mode: "extension-bridge",
      message: "Prodotto inviato a Vendoly Assistant! La scheda Vinted si sta aprendo.",
    };
  }

  // 3. Caso Mobile PWA: Web Share API con File
  if (isMobileDevice() && navigator.share && payload.images.length > 0) {
    try {
      const files = await fetchImagesAsFiles(payload.images, payload.sku);
      if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          title: payload.title,
          text: payload.description,
          files,
        });
        return {
          success: true,
          mode: "mobile-share",
          message: "Condivisione mobile avviata: seleziona l'app Vinted dal menu!",
        };
      }
    } catch (err: any) {
      // Se l'utente annulla il menu di condivisione
      if (err.name === "AbortError") {
        return {
          success: true,
          mode: "mobile-share",
          message: "Condivisione annullata.",
        };
      }
      console.warn("[VintedBridge] Fallback share:", err);
    }
  }

  // 4. Caso Desktop Web senza estensione: scarica immagini e apre Vinted Web
  if (payload.images.length > 0) {
    await downloadPhotosBatch(payload.images, payload.sku);
  }
  window.open("https://www.vinted.it/items/new", "_blank");

  return {
    success: true,
    mode: "desktop-download",
    message: "Foto scaricate e pagina Vinted aperta! Trascina le foto e incolla la descrizione.",
  };
}
