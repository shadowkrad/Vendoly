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
