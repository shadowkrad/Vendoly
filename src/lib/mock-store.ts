export interface MockProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  category: string;
  images: string; // JSON array string
  sku?: string | null;
  condition: string;
  isActive: boolean;
  syncFacebook: boolean;
  syncSubito: boolean;
  syncEbay: boolean;
  syncVinted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  fulfillmentType: string;
  status: string;
  totalAmount: number;
  channel: string;
  trackingCode?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: MockProduct;
  }>;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod-1",
    title: "Giacca Vintage Denim Oversize 90s",
    description: "Autentica giacca di jeans lavaggio chiaro, taglio comodo anni '90. Bottoni metallici originali e cuciture a contrasto rinforzate. Pezzo unico da collezione.",
    price: 65.0,
    comparePrice: 89.0,
    stock: 4,
    category: "Abbigliamento Vintage",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80",
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=800&q=80"
    ]),
    sku: "VD-DNM-090",
    condition: "OTTIME_CONDIZIONI",
    isActive: true,
    syncFacebook: true,
    syncSubito: true,
    syncEbay: false,
    syncVinted: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    title: "Sneakers Streetwear Minimal White & Suede",
    description: "Sneakers realizzate artigianalmente in vera pelle bovina e inserti scamosciati. Suola ergonomica antiscivolo e soletta estraibile antibatterica.",
    price: 110.0,
    comparePrice: 140.0,
    stock: 8,
    category: "Scarpe & Sneakers",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80"
    ]),
    sku: "VD-SNK-102",
    condition: "NUOVO",
    isActive: true,
    syncFacebook: true,
    syncSubito: false,
    syncEbay: true,
    syncVinted: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    title: "Zaino Tecnico Idrorepellente per Laptop 16''",
    description: "Zaino urbano con scomparto imbottito per notebook, tasca antifurto posteriore, passante per trolley e tessuto impermeabile Cordura.",
    price: 79.9,
    comparePrice: 99.0,
    stock: 12,
    category: "Accessori",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"
    ]),
    sku: "VD-ZAI-304",
    condition: "NUOVO",
    isActive: true,
    syncFacebook: true,
    syncSubito: true,
    syncEbay: true,
    syncVinted: false,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    title: "Occhiali da Sole Tartarugati Polarizzati UV400",
    description: "Montatura classica in acetato con finitura tartaruga lucida. Lenti polarizzate categoria 3 per una visione nitida e protezione totale dai raggi UV.",
    price: 49.0,
    comparePrice: 69.0,
    stock: 6,
    category: "Accessori",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"
    ]),
    sku: "VD-OCCH-405",
    condition: "NUOVO",
    isActive: true,
    syncFacebook: false,
    syncSubito: true,
    syncEbay: true,
    syncVinted: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    title: "Cuffie Wireless Hi-Fi Noise Cancelling Active",
    description: "Suono immersivo ad alta fedeltà con cancellazione attiva del rumore (ANC) fino a 35dB. Fino a 40 ore di riproduzione continua e ricarica rapida Type-C.",
    price: 139.0,
    comparePrice: 179.0,
    stock: 3,
    category: "Elettronica & Audio",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
    ]),
    sku: "VD-CUF-506",
    condition: "USATO_COME_NUOVO",
    isActive: true,
    syncFacebook: true,
    syncSubito: true,
    syncEbay: true,
    syncVinted: false,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    title: "Felpa Hoodie Cotone Organico Spazzolato",
    description: "100% Cotone biologico pettinato da 380 g/m². Taglio rilassato unisex, cappuccio a doppio strato e tasca a marsupio.",
    price: 54.0,
    comparePrice: null,
    stock: 15,
    category: "Abbigliamento",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80"
    ]),
    sku: "VD-HOD-607",
    condition: "NUOVO",
    isActive: true,
    syncFacebook: false,
    syncSubito: false,
    syncEbay: false,
    syncVinted: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-7",
    title: "Orologio Cronografo Acciaio Quadrante Sunburst",
    description: "Cassa in acciaio inox 316L da 41mm, vetro zaffiro antigraffio e movimento al quarzo giapponese ad alta precisione. Impermeabile fino a 5 ATM.",
    price: 169.0,
    comparePrice: 220.0,
    stock: 2,
    category: "Orologi & Gioielli",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80"
    ]),
    sku: "VD-ORL-708",
    condition: "OTTIME_CONDIZIONI",
    isActive: true,
    syncFacebook: true,
    syncSubito: true,
    syncEbay: true,
    syncVinted: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-8",
    title: "Diffusore Essenziale Smart con Luce Notturna",
    description: "Diffusore a ultrasuoni da 400ml con nebulizzazione a freddo. Compatibile con app smartphone e timer programmabile.",
    price: 38.5,
    comparePrice: 48.0,
    stock: 7,
    category: "Casa & Benessere",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
    ]),
    sku: "VD-DIF-809",
    condition: "NUOVO",
    isActive: true,
    syncFacebook: true,
    syncSubito: false,
    syncEbay: false,
    syncVinted: false,
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-2026-1001",
    customerName: "Matteo Villa",
    customerPhone: "+39 347 1122334",
    customerEmail: "matteo.villa@email.it",
    shippingAddress: "Via Torino 42, 20123 Milano (MI)",
    fulfillmentType: "SPEDIZIONE",
    status: "PAGATO",
    totalAmount: 110.0,
    channel: "SITO_WEB",
    trackingCode: "GLS-99482910IT",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      {
        id: "item-1",
        orderId: "ord-1",
        productId: "prod-2",
        quantity: 1,
        unitPrice: 110.0,
        product: MOCK_PRODUCTS[1],
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "ORD-2026-1002",
    customerName: "Giulia Colombo",
    customerPhone: "+39 333 5544332",
    customerEmail: "giulia.c@email.it",
    shippingAddress: "Ritiro in negozio - Corso Buenos Aires 15, Milano",
    fulfillmentType: "RITIRO_IN_NEGOZIO",
    status: "IN_ATTESA",
    totalAmount: 65.0,
    channel: "VINTED",
    trackingCode: null,
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    items: [
      {
        id: "item-2",
        orderId: "ord-2",
        productId: "prod-1",
        quantity: 1,
        unitPrice: 65.0,
        product: MOCK_PRODUCTS[0],
      },
    ],
  },
  {
    id: "ord-3",
    orderNumber: "ORD-2026-1003",
    customerName: "Marco Bellini",
    customerPhone: "+39 340 7788990",
    customerEmail: "marco.b@email.it",
    shippingAddress: "Via Roma 88, 10121 Torino (TO)",
    fulfillmentType: "SPEDIZIONE",
    status: "SPEDITO",
    totalAmount: 139.0,
    channel: "SUBITO",
    trackingCode: "BRT-448201993IT",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: "item-3",
        orderId: "ord-3",
        productId: "prod-5",
        quantity: 1,
        unitPrice: 139.0,
        product: MOCK_PRODUCTS[4],
      },
    ],
  },
];
