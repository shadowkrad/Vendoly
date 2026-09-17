import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inizio seed del database Vendoly...");

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

  // 2. Pulizia tabelle operative (se presenti)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();

  // 3. Creazione Categorie
  const catAbbigliamento = await prisma.category.create({
    data: {
      name: "Abbigliamento",
      color: "#3b82f6",
      icon: "Shirt",
    },
  });

  const catAccessori = await prisma.category.create({
    data: {
      name: "Accessori",
      color: "#8b5cf6",
      icon: "Watch",
    },
  });

  const catScarpe = await prisma.category.create({
    data: {
      name: "Scarpe",
      color: "#f59e0b",
      icon: "Footprints",
    },
  });

  const catCosmetica = await prisma.category.create({
    data: {
      name: "Cosmetica & Cura",
      color: "#ec4899",
      icon: "Sparkles",
    },
  });

  const catHiTech = await prisma.category.create({
    data: {
      name: "Hi-Tech",
      color: "#10b981",
      icon: "Smartphone",
    },
  });

  // 4. Creazione Prodotti
  const p1 = await prisma.product.create({
    data: {
      name: "T-Shirt Cotone Bio",
      sku: "TSH-001",
      barcode: "8001234567890",
      description: "100% Cotone organico pettinato, vestibilità regular",
      price: 29.9,
      costPrice: 9.5,
      vatRate: 22.0,
      stockQuantity: 45,
      categoryId: catAbbigliamento.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Felpa Minimal Zip",
      sku: "FLP-002",
      barcode: "8001234567891",
      description: "Felpa garzata con zip intera e tasche a filo",
      price: 69.0,
      costPrice: 24.0,
      vatRate: 22.0,
      stockQuantity: 22,
      categoryId: catAbbigliamento.id,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Zaino Urbano Waterproof",
      sku: "ZAI-003",
      barcode: "8001234567892",
      description: "Scomparto per laptop 15'' e finitura impermeabile",
      price: 89.0,
      costPrice: 32.0,
      vatRate: 22.0,
      stockQuantity: 14,
      categoryId: catAccessori.id,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: "Occhiali da Sole Polarizzati",
      sku: "OCCH-004",
      barcode: "8001234567893",
      description: "Montatura ultra-leggera in acetato, protezione UV400",
      price: 55.0,
      costPrice: 18.0,
      vatRate: 22.0,
      stockQuantity: 18,
      categoryId: catAccessori.id,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: "Sneakers Classic White",
      sku: "SNK-005",
      barcode: "8001234567894",
      description: "Pelle naturale con soletta anatomica memory foam",
      price: 95.0,
      costPrice: 38.0,
      vatRate: 22.0,
      stockQuantity: 12,
      categoryId: catScarpe.id,
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: "Profumo Essenza Legnosa 50ml",
      sku: "PRF-006",
      barcode: "8001234567895",
      description: "Note di cedro, ambra grigia e bergamotto calabrese",
      price: 74.5,
      costPrice: 26.0,
      vatRate: 22.0,
      stockQuantity: 9,
      categoryId: catCosmetica.id,
    },
  });

  const p7 = await prisma.product.create({
    data: {
      name: "Cuffie Wireless ANC",
      sku: "CUF-007",
      barcode: "8001234567896",
      description: "Cancellazione attiva del rumore e 35h di autonomia",
      price: 129.0,
      costPrice: 58.0,
      vatRate: 22.0,
      stockQuantity: 8,
      categoryId: catHiTech.id,
    },
  });

  const p8 = await prisma.product.create({
    data: {
      name: "Powerbank MagSafe 10.000mAh",
      sku: "POW-008",
      barcode: "8001234567897",
      description: "Ricarica wireless rapida 15W con aggancio magnetico",
      price: 39.9,
      costPrice: 14.5,
      vatRate: 22.0,
      stockQuantity: 25,
      categoryId: catHiTech.id,
    },
  });

  // 5. Creazione Clienti con Fidelity Card
  const c1 = await prisma.customer.create({
    data: {
      firstName: "Marco",
      lastName: "Rossi",
      phone: "+39 333 1234567",
      email: "marco.rossi@email.it",
      taxCode: "RSSMRC85M01F205Z",
      fidelityCardNumber: "FID-88219",
      fidelityPoints: 240,
      tier: "GOLD",
      notes: "Cliente affezionato, preferisce pagamenti elettronici",
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      firstName: "Laura",
      lastName: "Bianchi",
      phone: "+39 340 9876543",
      email: "laura.bianchi@email.it",
      fidelityCardNumber: "FID-44120",
      fidelityPoints: 115,
      tier: "SILVER",
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      firstName: "Alessandro",
      lastName: "Moretti",
      phone: "+39 349 1122334",
      email: "a.moretti@email.it",
      fidelityCardNumber: "FID-10992",
      fidelityPoints: 650,
      tier: "VIP",
      notes: "Sconto 10% riservato VIP",
    },
  });

  // 6. Creazione Vendite dimostrative per la prima schermata
  const sale1 = await prisma.sale.create({
    data: {
      saleNumber: "SCT-2026-0001",
      subtotal: 98.9,
      taxAmount: 17.83,
      discountAmount: 0.0,
      totalAmount: 98.9,
      paymentMethod: "POS_CARTA",
      status: "COMPLETED",
      cashierName: "Cassa 1 - Operatore Demo",
      customerId: c1.id,
      pointsEarned: 10,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            unitPrice: p1.price,
            quantity: 1,
            vatRate: 22.0,
            subtotal: 29.9,
          },
          {
            productId: p2.id,
            productName: p2.name,
            unitPrice: p2.price,
            quantity: 1,
            vatRate: 22.0,
            subtotal: 69.0,
          },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      saleNumber: "SCT-2026-0002",
      subtotal: 129.0,
      taxAmount: 23.26,
      discountAmount: 0.0,
      totalAmount: 129.0,
      paymentMethod: "CONTANTI",
      status: "COMPLETED",
      cashierName: "Cassa 1 - Operatore Demo",
      customerId: c2.id,
      pointsEarned: 15,
      items: {
        create: [
          {
            productId: p7.id,
            productName: p7.name,
            unitPrice: p7.price,
            quantity: 1,
            vatRate: 22.0,
            subtotal: 129.0,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completato con successo!");
  console.log(`- Prodotti creati: 8`);
  console.log(`- Categorie create: 5`);
  console.log(`- Clienti Fidelity creati: 3`);
  console.log(`- Vendite registrate: 2`);
}

main()
  .catch((e) => {
    console.error("❌ Errore durante il seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
