import { PrismaClient } from "@prisma/client";
import { MOCK_PRODUCTS, MOCK_ORDERS } from "../src/lib/mock-store";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inizio seed del database Vendoly (E-Commerce & Multi-Canale)...");

  // 1. Inizializzazione Cache Tenant Taaaac
  await prisma.tenantLocalCache.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      domain: "vendoly-demo.taaaac.eu",
      licenseStatus: "ATTIVO",
      enabledModules: JSON.stringify([
        "WHATSAPP_REMINDERS",
        "LOYALTY_CARD",
        "VENDOLY_CHANNEL_MANAGER",
        "ONLINE_CATALOG",
        "ADVANCED_ANALYTICS",
      ]),
      brandName: "Vendoly Store Milano",
      primaryColor: "#0f172a",
      accentColor: "#059669",
      contactEmail: "milano@vendoly.taaaac.eu",
      phone: "+39 02 8901 5678",
      lastSyncedAt: new Date(),
    },
  });

  // 2. Pulizia tabelle operative
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // 3. Creazione Prodotti da MOCK_PRODUCTS
  for (const p of MOCK_PRODUCTS) {
    await prisma.product.create({
      data: {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        category: p.category,
        images: p.images,
        sku: p.sku,
        condition: p.condition,
        isActive: p.isActive,
        syncFacebook: p.syncFacebook,
        syncSubito: p.syncSubito,
        syncEbay: p.syncEbay,
        syncVinted: p.syncVinted,
      },
    });
  }

  // 4. Creazione Ordini da MOCK_ORDERS
  for (const o of MOCK_ORDERS) {
    await prisma.order.create({
      data: {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        shippingAddress: o.shippingAddress,
        fulfillmentType: o.fulfillmentType,
        status: o.status,
        totalAmount: o.totalAmount,
        channel: o.channel,
        trackingCode: o.trackingCode,
        createdAt: new Date(o.createdAt),
        items: {
          create: o.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        },
      },
    });
  }

  console.log("✅ Seed completato con successo!");
  console.log(`- Prodotti creati: ${MOCK_PRODUCTS.length}`);
  console.log(`- Ordini registrati: ${MOCK_ORDERS.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
