import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-actions";
import { MockProduct, MOCK_PRODUCTS } from "@/lib/mock-store";
import {
  generateChannelListing,
  type ProductForListing,
} from "@/lib/channel-manager";

/**
 * Mappa la condizione Vendoly al formato eBay Inventory API.
 */
function mapConditionToEbay(
  condition: string
): "NEW" | "LIKE_NEW" | "VERY_GOOD" | "GOOD" {
  switch (condition) {
    case "NUOVO":
      return "NEW";
    case "COME_NUOVO":
    case "USATO_COME_NUOVO":
      return "LIKE_NEW";
    case "OTTIMO":
    case "OTTIME_CONDIZIONI":
      return "VERY_GOOD";
    case "BUONO":
      return "GOOD";
    default:
      return "NEW";
  }
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
    ebayPrice: product.price * 1.05,
    category: { name: product.category },
    brandName: product.brand || undefined,
  };
}

/**
 * Costruisce l'oggetto "aspects" per l'eBay Inventory API a partire dai campi del prodotto.
 */
function buildAspects(
  product: MockProduct
): Record<string, string[]> {
  const aspects: Record<string, string[]> = {};

  if (product.brand) {
    aspects["Brand"] = [product.brand];
  }
  if (product.color) {
    aspects["Color"] = [product.color];
  }
  if (product.size) {
    aspects["Size"] = [product.size];
  }
  if (product.material) {
    aspects["Material"] = [product.material];
  }

  // Aggiungi sempre la categoria come aspetto
  aspects["Category"] = [product.category];

  return aspects;
}

interface EbayInventoryItem {
  sku: string;
  product: {
    title: string;
    description: string;
    aspects: Record<string, string[]>;
    imageUrls: string[];
  };
  condition: "NEW" | "LIKE_NEW" | "VERY_GOOD" | "GOOD";
  availability: {
    shipToLocationAvailability: {
      quantity: number;
    };
  };
  offer: {
    pricingSummary: {
      price: {
        value: string;
        currency: string;
      };
    };
    listingDescription: string;
  };
}

/**
 * Converte un MockProduct in un oggetto eBay Inventory API.
 */
function buildEbayItem(product: MockProduct): EbayInventoryItem {
  const listing = generateChannelListing(
    toProductForListing(product),
    "EBAY"
  );
  const images = parseImages(product.images);

  return {
    sku: product.sku || product.id,
    product: {
      title: listing.title,
      description: product.description,
      aspects: buildAspects(product),
      imageUrls: images,
    },
    condition: mapConditionToEbay(product.condition),
    availability: {
      shipToLocationAvailability: {
        quantity: product.stock,
      },
    },
    offer: {
      pricingSummary: {
        price: {
          value: listing.price.toFixed(2),
          currency: "EUR",
        },
      },
      listingDescription: listing.formattedText,
    },
  };
}

/**
 * GET /api/feeds/ebay
 *
 * Genera un feed JSON nel formato dell'eBay Inventory API
 * con descrizioni ottimizzate tramite il channel manager di Vendoly.
 */
export async function GET() {
  let products: MockProduct[];

  try {
    products = await getStoreProducts();
  } catch {
    console.warn("⚠️ Feed eBay: fallback a prodotti mock");
    products = MOCK_PRODUCTS;
  }

  const feedProducts = products.filter(
    (p) => p.syncEbay === true && p.stock > 0
  );

  const items = feedProducts.map((p) => buildEbayItem(p));

  return NextResponse.json(
    {
      success: true,
      channel: "EBAY",
      totalItems: items.length,
      generatedAt: new Date().toISOString(),
      inventoryItems: items,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=900, s-maxage=1800",
      },
    }
  );
}
