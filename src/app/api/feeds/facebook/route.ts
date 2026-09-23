import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-actions";
import { MockProduct, MOCK_PRODUCTS } from "@/lib/mock-store";

/**
 * Mappa la condizione Vendoly al valore Meta Commerce Catalog.
 */
function mapConditionToMeta(condition: string): string {
  switch (condition) {
    case "NUOVO":
      return "new";
    case "COME_NUOVO":
    case "USATO_COME_NUOVO":
      return "refurbished";
    case "OTTIMO":
    case "OTTIME_CONDIZIONI":
    case "BUONO":
      return "used";
    default:
      return "new";
  }
}

/**
 * Esegue l'escape XML di caratteri speciali per evitare feed corrotti.
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
 * Genera un singolo <item> XML per il feed Meta Commerce Catalog.
 */
function buildItemXml(product: MockProduct): string {
  const images = parseImages(product.images);
  const mainImage = images[0] || "";
  const additionalImages = images.slice(1);
  const link = `https://vendoly.taaaac.eu/prodotto/${product.sku}`;

  let itemXml = `    <item>
      <g:id>${escapeXml(product.sku || product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>`;

  for (const img of additionalImages) {
    itemXml += `\n      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`;
  }

  itemXml += `\n      <g:price>${product.price.toFixed(2)} EUR</g:price>`;

  if (product.comparePrice && product.comparePrice > product.price) {
    itemXml += `\n      <g:sale_price>${product.price.toFixed(2)} EUR</g:sale_price>`;
  }

  itemXml += `\n      <g:availability>in stock</g:availability>`;
  itemXml += `\n      <g:condition>${mapConditionToMeta(product.condition)}</g:condition>`;

  if (product.brand) {
    itemXml += `\n      <g:brand>${escapeXml(product.brand)}</g:brand>`;
  }
  if (product.color) {
    itemXml += `\n      <g:color>${escapeXml(product.color)}</g:color>`;
  }
  if (product.size) {
    itemXml += `\n      <g:size>${escapeXml(product.size)}</g:size>`;
  }
  if (product.material) {
    itemXml += `\n      <g:material>${escapeXml(product.material)}</g:material>`;
  }

  itemXml += `\n      <g:product_type>${escapeXml(product.category)}</g:product_type>`;
  itemXml += `\n    </item>`;

  return itemXml;
}

/**
 * GET /api/feeds/facebook
 *
 * Genera un feed XML RSS 2.0 conforme allo schema Meta Commerce Catalog
 * per la sincronizzazione automatica dei prodotti su Facebook / Instagram Shop.
 */
export async function GET() {
  let products: MockProduct[];

  try {
    products = await getStoreProducts();
  } catch {
    console.warn("⚠️ Feed Facebook: fallback a prodotti mock");
    products = MOCK_PRODUCTS;
  }

  const feedProducts = products.filter(
    (p) => p.syncFacebook === true && p.stock > 0
  );

  const itemsXml = feedProducts.map((p) => buildItemXml(p)).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Vendoly Boutique - Catalogo Facebook</title>
    <link>https://vendoly.taaaac.eu</link>
    <description>Feed prodotti Vendoly per Meta Commerce Catalog</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=1800",
    },
  });
}
