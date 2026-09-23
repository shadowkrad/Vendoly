import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-actions";
import { MockProduct, MOCK_PRODUCTS } from "@/lib/mock-store";
import {
  generateChannelListing,
  type ProductForListing,
} from "@/lib/channel-manager";

/**
 * Mappa la condizione Vendoly al formato Subito Impresa+.
 */
function mapConditionToSubito(condition: string): string {
  switch (condition) {
    case "NUOVO":
      return "new";
    case "COME_NUOVO":
    case "USATO_COME_NUOVO":
      return "as_new";
    case "OTTIMO":
    case "OTTIME_CONDIZIONI":
      return "good";
    case "BUONO":
      return "acceptable";
    default:
      return "new";
  }
}

/**
 * Esegue l'escape XML di caratteri speciali.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Parsa il campo images (JSON array string) in un array di URL.
 */
function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Converte un MockProduct nella struttura ProductForListing richiesta da generateChannelListing.
 */
function toProductForListing(product: MockProduct): ProductForListing {
  return {
    id: product.id,
    name: product.title,
    sku: product.sku || product.id,
    description: product.description,
    price: product.price,
    condition: product.condition,
    subitoPrice: product.price,
    category: { name: product.category },
    brandName: product.brand || undefined,
  };
}

/**
 * Genera un singolo <ad> XML per il feed Subito Impresa+.
 */
function buildAdXml(product: MockProduct): string {
  const listing = generateChannelListing(
    toProductForListing(product),
    "SUBITO"
  );
  const images = parseImages(product.images);

  let imagesXml = "";
  if (images.length > 0) {
    imagesXml = `\n      <images>${images.map((img) => `\n        <image>${escapeXml(img)}</image>`).join("")}\n      </images>`;
  }

  return `    <ad>
      <id>${escapeXml(product.sku || product.id)}</id>
      <title>${escapeXml(listing.title)}</title>
      <description>${escapeXml(listing.formattedText)}</description>
      <price>${product.price.toFixed(2)}</price>
      <currency>EUR</currency>
      <category>${escapeXml(listing.recommendedCategory)}</category>
      <condition>${mapConditionToSubito(product.condition)}</condition>${imagesXml}
      <availability>available</availability>
    </ad>`;
}

/**
 * GET /api/feeds/subito
 *
 * Genera un feed XML per Subito Impresa+ con descrizioni ottimizzate
 * tramite il channel manager di Vendoly.
 */
export async function GET() {
  let products: MockProduct[];

  try {
    products = await getStoreProducts();
  } catch {
    console.warn("⚠️ Feed Subito: fallback a prodotti mock");
    products = MOCK_PRODUCTS;
  }

  const feedProducts = products.filter(
    (p) => p.syncSubito === true && p.stock > 0
  );

  const adsXml = feedProducts.map((p) => buildAdXml(p)).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ads>
${adsXml}
</ads>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=1800",
    },
  });
}
