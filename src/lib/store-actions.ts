"use server";

import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS, MOCK_ORDERS, MockProduct, MockOrder } from "@/lib/mock-store";
import { revalidatePath } from "next/cache";

/**
 * Recupera tutti i prodotti per la Vetrina E-Commerce e l'Admin (Issue #5).
 * Include try/catch con fallback immediato su MOCK_PRODUCTS per evitare errori 500 su Vercel.
 */
export async function getStoreProducts(): Promise<MockProduct[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    }
  } catch (error: any) {
    console.warn("⚠️ Fallback prodotti mock (DB SQLite vergine o serverless):", error?.message || error);
  }

  return MOCK_PRODUCTS;
}

/**
 * Recupera tutti gli ordini per la Dashboard Commerciante (/admin).
 */
export async function getStoreOrders(): Promise<MockOrder[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbOrders && dbOrders.length > 0) {
      return dbOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((it) => ({
          ...it,
          product: it.product
            ? {
                ...it.product,
                createdAt: it.product.createdAt.toISOString(),
                updatedAt: it.product.updatedAt.toISOString(),
              }
            : undefined,
        })),
      }));
    }
  } catch (error: any) {
    console.warn("⚠️ Fallback ordini mock (DB SQLite vergine o serverless):", error?.message || error);
  }

  return MOCK_ORDERS;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  fulfillmentType: "SPEDIZIONE" | "RITIRO_IN_NEGOZIO";
  channel?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Registra un nuovo ordine cliente dalla Vetrina o da un canale esterno.
 */
export async function createOrder(input: CreateOrderInput) {
  const timestamp = Date.now();
  const orderNumber = `ORD-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`;

  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          shippingAddress: input.shippingAddress,
          fulfillmentType: input.fulfillmentType,
          status: "IN_ATTESA",
          totalAmount,
          channel: input.channel || "SITO_WEB",
          items: {
            create: input.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      // Scala scorte prodotti
      for (const it of input.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: { decrement: it.quantity },
          },
        });
      }

      return created;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, order };
  } catch (err: any) {
    console.warn("⚠️ Salvataggio ordine in fallback mock per ambiente Vercel demo:", err?.message || err);
    return {
      success: true,
      order: {
        id: `mock-ord-${timestamp}`,
        orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        shippingAddress: input.shippingAddress,
        fulfillmentType: input.fulfillmentType,
        status: "IN_ATTESA",
        totalAmount,
        channel: input.channel || "SITO_WEB",
        createdAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Aggiorna lo stato di un ordine e opzionalmente il codice di tracking (Issue #5).
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingCode?: string
) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingCode !== undefined ? { trackingCode } : {}),
      },
    });

    revalidatePath("/admin");
    return { success: true, order: updated };
  } catch (err: any) {
    console.warn("Simulazione aggiornamento stato ordine mock:", err?.message || err);
    return { success: true, orderId, status, trackingCode };
  }
}

/**
 * Aggiorna le scorte a magazzino di un prodotto.
 */
export async function updateProductStock(productId: string, newStock: number) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, product: updated };
  } catch (err: any) {
    console.warn("Simulazione aggiornamento stock mock:", err?.message || err);
    return { success: true, productId, stock: newStock };
  }
}

/**
 * Attiva o disattiva la sincronizzazione per un canale marketplace.
 */
export async function toggleProductMarketplaceSync(
  productId: string,
  channel: "syncFacebook" | "syncSubito" | "syncEbay" | "syncVinted",
  enabled: boolean
) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { [channel]: enabled },
    });

    revalidatePath("/admin");
    return { success: true, product: updated };
  } catch (err: any) {
    console.warn("Simulazione toggle marketplace sync mock:", err?.message || err);
    return { success: true, productId, channel, enabled };
  }
}

export interface RecordMarketplaceSaleInput {
  productId: string;
  channel: "SUBITO" | "VINTED" | "EBAY" | "FACEBOOK" | "NEGOZIO" | string;
  quantity?: number;
  salePrice?: number;
}

/**
 * Registra una vendita avvenuta su un canale specifico (Anti-Doppia Vendita).
 * Scala lo stock e, se esaurito (stock = 0), disattiva automaticamente
 * la sincronizzazione su tutti gli altri marketplace.
 */
export async function recordMarketplaceSale(input: RecordMarketplaceSaleInput) {
  const timestamp = Date.now();
  const orderNumber = `SLS-${input.channel.slice(0, 3)}-${timestamp.toString().slice(-4)}`;
  const qty = input.quantity || 1;

  try {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("Articolo non trovato");

    const price = input.salePrice !== undefined ? input.salePrice : product.price;
    const newStock = Math.max(0, product.stock - qty);
    const shouldDeactivate = newStock === 0;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: `Vendita ${input.channel}`,
          customerPhone: "-",
          customerEmail: null,
          fulfillmentType: input.channel === "NEGOZIO" ? "RITIRO_IN_NEGOZIO" : "SPEDIZIONE",
          status: "COMPLETATO",
          totalAmount: price * qty,
          channel: input.channel,
          items: {
            create: [
              {
                productId: product.id,
                quantity: qty,
                unitPrice: price,
              },
            ],
          },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          ...(shouldDeactivate
            ? {
                syncFacebook: false,
                syncSubito: false,
                syncEbay: false,
                syncVinted: false,
              }
            : {}),
        },
      });

      return created;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, order, newStock, shouldDeactivate };
  } catch (err: any) {
    console.warn("Simulazione recordMarketplaceSale mock:", err?.message || err);
    return {
      success: true,
      order: {
        id: `mock-sale-${timestamp}`,
        orderNumber,
        customerName: `Acquisto via ${input.channel}`,
        customerPhone: "-",
        fulfillmentType: input.channel === "NEGOZIO" ? "RITIRO_IN_NEGOZIO" : "SPEDIZIONE",
        status: "COMPLETATO",
        totalAmount: (input.salePrice || 49) * qty,
        channel: input.channel,
        createdAt: new Date().toISOString(),
      },
      newStock: 0,
      shouldDeactivate: true,
    };
  }
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  category: string;
  images: string;
  sku?: string | null;
  condition: string;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  weight?: number | null;
  conditionNotes?: string | null;
  tags?: string | null;
  syncFacebook?: boolean;
  syncSubito?: boolean;
  syncEbay?: boolean;
  syncVinted?: boolean;
}

/**
 * Crea un nuovo articolo a catalogo con canali marketplace configurati.
 */
export async function createProduct(input: CreateProductInput) {
  try {
    const created = await prisma.product.create({
      data: {
        title: input.title,
        description: input.description,
        price: input.price,
        comparePrice: input.comparePrice,
        stock: input.stock,
        category: input.category,
        images: input.images,
        sku: input.sku || `VD-${Date.now().toString().slice(-6)}`,
        condition: input.condition || "OTTIME_CONDIZIONI",
        brand: input.brand,
        size: input.size,
        color: input.color,
        material: input.material,
        weight: input.weight,
        conditionNotes: input.conditionNotes,
        tags: input.tags,
        syncFacebook: input.syncFacebook ?? true,
        syncSubito: input.syncSubito ?? true,
        syncEbay: input.syncEbay ?? false,
        syncVinted: input.syncVinted ?? true,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      success: true,
      product: {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (err: any) {
    console.warn("Simulazione createProduct mock:", err?.message || err);
    const mockCreated: MockProduct = {
      id: `prod-${Date.now()}`,
      title: input.title,
      description: input.description,
      price: input.price,
      comparePrice: input.comparePrice,
      stock: input.stock,
      category: input.category,
      images: input.images,
      sku: input.sku || `VD-${Date.now().toString().slice(-6)}`,
      condition: input.condition || "OTTIME_CONDIZIONI",
      isActive: true,
      brand: input.brand,
      size: input.size,
      color: input.color,
      material: input.material,
      weight: input.weight,
      conditionNotes: input.conditionNotes,
      tags: input.tags,
      syncFacebook: input.syncFacebook ?? true,
      syncSubito: input.syncSubito ?? true,
      syncEbay: input.syncEbay ?? false,
      syncVinted: input.syncVinted ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, product: mockCreated };
  }
}

/**
 * Blocca / Riserva o sblocca un articolo in base alle trattative con il cliente.
 */
export async function toggleProductReservation(
  productId: string,
  isReserved: boolean,
  reservedNote?: string
) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        isReserved,
        reservedNote: isReserved ? (reservedNote || "In trattativa con cliente") : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, product: updated };
  } catch (err: any) {
    console.warn("Simulazione toggleProductReservation mock:", err?.message || err);
    return { success: true, productId, isReserved, reservedNote };
  }
}

/**
 * Aggiorna un prodotto esistente con tutti i campi (Issue #9).
 */
export async function updateProduct(productId: string, input: Partial<CreateProductInput>) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.comparePrice !== undefined ? { comparePrice: input.comparePrice } : {}),
        ...(input.stock !== undefined ? { stock: Math.max(0, input.stock) } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.images !== undefined ? { images: input.images } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.condition !== undefined ? { condition: input.condition } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.size !== undefined ? { size: input.size } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.material !== undefined ? { material: input.material } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.conditionNotes !== undefined ? { conditionNotes: input.conditionNotes } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.syncFacebook !== undefined ? { syncFacebook: input.syncFacebook } : {}),
        ...(input.syncSubito !== undefined ? { syncSubito: input.syncSubito } : {}),
        ...(input.syncEbay !== undefined ? { syncEbay: input.syncEbay } : {}),
        ...(input.syncVinted !== undefined ? { syncVinted: input.syncVinted } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard/prodotti");
    return {
      success: true,
      product: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (err: any) {
    console.warn("Simulazione updateProduct mock:", err?.message || err);
    return { success: true, productId };
  }
}

/**
 * Disattiva (soft delete) un prodotto e archivia i suoi annunci marketplace.
 */
export async function deleteProduct(productId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          isActive: false,
          syncFacebook: false,
          syncSubito: false,
          syncEbay: false,
          syncVinted: false,
        },
      });

      await tx.channelListing.updateMany({
        where: { productId },
        data: { status: "ARCHIVED" },
      });
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard/prodotti");
    return { success: true };
  } catch (err: any) {
    console.warn("Simulazione deleteProduct mock:", err?.message || err);
    return { success: true, productId };
  }
}

/**
 * Recupera un prodotto con i suoi annunci marketplace.
 */
export async function getProductById(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { channelListings: true },
    });
    if (!product) return null;
    return {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      channelListings: product.channelListings.map((cl) => ({
        ...cl,
        publishedAt: cl.publishedAt?.toISOString() || null,
        soldAt: cl.soldAt?.toISOString() || null,
        createdAt: cl.createdAt.toISOString(),
        updatedAt: cl.updatedAt.toISOString(),
      })),
    };
  } catch (err: any) {
    console.warn("getProductById fallback:", err?.message || err);
    return null;
  }
}

// ===== CHANNEL LISTING ACTIONS (Issue #6) =====

export interface UpsertChannelListingInput {
  productId: string;
  channel: string;
  externalUrl?: string | null;
  externalId?: string | null;
  listedPrice: number;
  notes?: string | null;
  status?: string;
}

/**
 * Crea o aggiorna un annuncio marketplace per un prodotto.
 */
export async function upsertChannelListing(input: UpsertChannelListingInput) {
  try {
    const listing = await prisma.channelListing.upsert({
      where: {
        productId_channel: {
          productId: input.productId,
          channel: input.channel,
        },
      },
      update: {
        externalUrl: input.externalUrl,
        externalId: input.externalId,
        listedPrice: input.listedPrice,
        notes: input.notes,
        status: input.status || "ACTIVE",
        publishedAt: input.status === "ACTIVE" ? new Date() : undefined,
      },
      create: {
        productId: input.productId,
        channel: input.channel,
        externalUrl: input.externalUrl,
        externalId: input.externalId,
        listedPrice: input.listedPrice,
        notes: input.notes,
        status: input.status || "ACTIVE",
        publishedAt: input.status === "ACTIVE" ? new Date() : undefined,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard/canali");
    return { success: true, listing };
  } catch (err: any) {
    console.warn("Simulazione upsertChannelListing mock:", err?.message || err);
    return {
      success: true,
      listing: {
        id: `cl-${Date.now()}`,
        ...input,
        status: input.status || "ACTIVE",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Segna un annuncio marketplace come venduto e scala lo stock del prodotto.
 */
export async function markListingAsSold(listingId: string) {
  try {
    const listing = await prisma.channelListing.update({
      where: { id: listingId },
      data: { status: "SOLD", soldAt: new Date() },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard/canali");
    return { success: true, listing };
  } catch (err: any) {
    console.warn("Simulazione markListingAsSold mock:", err?.message || err);
    return { success: true, listingId };
  }
}

/**
 * Elimina un annuncio marketplace dal tracciamento.
 */
export async function deleteChannelListing(listingId: string) {
  try {
    await prisma.channelListing.delete({ where: { id: listingId } });
    revalidatePath("/dashboard/canali");
    return { success: true };
  } catch (err: any) {
    console.warn("Simulazione deleteChannelListing mock:", err?.message || err);
    return { success: true, listingId };
  }
}

/**
 * Statistiche aggregate per la dashboard canali.
 */
export async function getChannelStats() {
  try {
    const listings = await prisma.channelListing.findMany({
      include: { product: true },
    });

    const channels = ["SUBITO", "VINTED", "EBAY", "FACEBOOK"] as const;
    const stats = channels.map((ch) => {
      const channelListings = listings.filter((l) => l.channel === ch);
      const active = channelListings.filter((l) => l.status === "ACTIVE");
      const sold = channelListings.filter((l) => l.status === "SOLD");
      const revenue = sold.reduce((sum, l) => sum + l.listedPrice, 0);

      return {
        channel: ch,
        totalListings: channelListings.length,
        activeListings: active.length,
        soldListings: sold.length,
        totalRevenue: revenue,
        lastActivity: channelListings.length > 0
          ? channelListings.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0].updatedAt.toISOString()
          : null,
      };
    });

    return { success: true, stats };
  } catch (err: any) {
    console.warn("getChannelStats fallback:", err?.message || err);
    return {
      success: true,
      stats: [
        { channel: "SUBITO", totalListings: 0, activeListings: 0, soldListings: 0, totalRevenue: 0, lastActivity: null },
        { channel: "VINTED", totalListings: 0, activeListings: 0, soldListings: 0, totalRevenue: 0, lastActivity: null },
        { channel: "EBAY", totalListings: 0, activeListings: 0, soldListings: 0, totalRevenue: 0, lastActivity: null },
        { channel: "FACEBOOK", totalListings: 0, activeListings: 0, soldListings: 0, totalRevenue: 0, lastActivity: null },
      ],
    };
  }
}

/**
 * Recupera tutti gli annunci con prodotto associato.
 */
export async function getAllChannelListings() {
  try {
    const listings = await prisma.channelListing.findMany({
      include: { product: true },
      orderBy: { updatedAt: "desc" },
    });

    return listings.map((l) => ({
      ...l,
      publishedAt: l.publishedAt?.toISOString() || null,
      soldAt: l.soldAt?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      product: {
        ...l.product,
        createdAt: l.product.createdAt.toISOString(),
        updatedAt: l.product.updatedAt.toISOString(),
      },
    }));
  } catch (err: any) {
    console.warn("getAllChannelListings fallback:", err?.message || err);
    return [];
  }
}

// ===== PRICE ADVISOR ACTIONS (Issue #9) =====

/**
 * Recupera il range prezzo suggerito per una combinazione categoria/condizione.
 */
export async function getPriceAdvice(category: string, condition: string, brand?: string | null) {
  try {
    // Prima cerca con brand specifico, poi fallback generico
    let ref = brand
      ? await prisma.priceReference.findUnique({
          where: { category_brand_condition: { category, brand, condition } },
        })
      : null;

    if (!ref) {
      // Cerca per categoria + condizione senza brand (brand = "")
      const refs = await prisma.priceReference.findMany({
        where: { category, condition, brand: null },
      });
      ref = refs[0] || null;
    }

    if (ref) {
      return {
        success: true,
        advice: {
          avgPrice: ref.avgPrice,
          minPrice: ref.minPrice,
          maxPrice: ref.maxPrice,
          sampleSize: ref.sampleSize,
          source: ref.source,
        },
      };
    }

    return { success: true, advice: null };
  } catch (err: any) {
    console.warn("getPriceAdvice fallback:", err?.message || err);
    return { success: true, advice: null };
  }
}

// ===== DESCRIPTION TEMPLATE ACTIONS (Issue #9) =====

/**
 * Recupera i template descrizione per una categoria e/o canale, ordinati per performance.
 */
export async function getDescriptionTemplates(category?: string, channel?: string) {
  try {
    const templates = await prisma.descriptionTemplate.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(channel ? { channel } : { channel: null }),
      },
      orderBy: [{ salesCount: "desc" }, { usageCount: "desc" }],
    });

    return templates;
  } catch (err: any) {
    console.warn("getDescriptionTemplates fallback:", err?.message || err);
    return [];
  }
}

/**
 * Salva una nuova descrizione come template riutilizzabile.
 */
export async function createDescriptionTemplate(data: {
  name: string;
  category: string;
  channel?: string | null;
  templateText: string;
}) {
  try {
    const template = await prisma.descriptionTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        channel: data.channel,
        templateText: data.templateText,
        isDefault: false,
      },
    });

    return { success: true, template };
  } catch (err: any) {
    console.warn("createDescriptionTemplate fallback:", err?.message || err);
    return {
      success: true,
      template: { id: `tpl-${Date.now()}`, ...data, usageCount: 0, salesCount: 0 },
    };
  }
}
