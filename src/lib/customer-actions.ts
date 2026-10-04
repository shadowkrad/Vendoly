"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  channel: string;
  createdAt: string;
}

export interface CustomerData {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  fiscalCode: string | null;
  clothingSize: string | null;
  shoeSize: string | null;
  preferredBrands: string | null;
  notes: string | null;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  totalSpent: number;
  orders: CustomerOrderSummary[];
}

export interface CustomerInput {
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  fiscalCode?: string | null;
  clothingSize?: string | null;
  shoeSize?: string | null;
  preferredBrands?: string | null;
  notes?: string | null;
  loyaltyPoints?: number;
}

function isDemoEnvironment(): boolean {
  if (process.env.IS_DEMO === "true" || process.env.NEXT_PUBLIC_IS_DEMO === "true") {
    return true;
  }
  if (process.env.IS_DEMO === "false" || process.env.NEXT_PUBLIC_IS_DEMO === "false") {
    return false;
  }
  return process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;
}

const MOCK_CUSTOMERS: CustomerData[] = [
  {
    id: "cust-1",
    firstName: "Matteo",
    lastName: "Villa",
    phone: "+39 347 1122334",
    email: "matteo.villa@email.it",
    address: "Via Torino 42, 20123 Milano (MI)",
    fiscalCode: "VLLMTT85M12F205X",
    clothingSize: "L / 50 IT",
    shoeSize: "43 EU",
    preferredBrands: "Nike, Carhartt WIP, Stüssy",
    notes: "Appassionato di felpe vintage e giacche workwear anni '90. Notificare su WhatsApp se arrivano capi Carhartt.",
    loyaltyPoints: 120,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ordersCount: 2,
    totalSpent: 219.0,
    orders: [
      {
        id: "ord-1",
        orderNumber: "ORD-2026-1001",
        totalAmount: 110.0,
        status: "PAGATO",
        channel: "EBAY",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "ord-1b",
        orderNumber: "ORD-2026-0940",
        totalAmount: 109.0,
        status: "COMPLETATO",
        channel: "CASSA",
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
    ],
  },
  {
    id: "cust-2",
    firstName: "Giulia",
    lastName: "Colombo",
    phone: "+39 333 5544332",
    email: "giulia.c@email.it",
    address: "Ritiro al Banco - Corso Buenos Aires 15, Milano",
    fiscalCode: null,
    clothingSize: "S / 40 IT",
    shoeSize: "38 EU",
    preferredBrands: "Ralph Lauren, Levi's 501, Vintage Trench",
    notes: "Preferisce ritiro di persona il sabato mattina. Cerca trench beige taglia S.",
    loyaltyPoints: 85,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    ordersCount: 1,
    totalSpent: 65.0,
    orders: [
      {
        id: "ord-2",
        orderNumber: "ORD-2026-1002",
        totalAmount: 65.0,
        status: "PRONTO_RITIRO",
        channel: "VINTED",
        createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
    ],
  },
  {
    id: "cust-3",
    firstName: "Marco",
    lastName: "Bellini",
    phone: "+39 340 7788990",
    email: "marco.b@email.it",
    address: "Via Roma 88, 10121 Torino (TO)",
    fiscalCode: "BLLMRC90A01L219K",
    clothingSize: "XL / 52 IT",
    shoeSize: "44 EU",
    preferredBrands: "Stone Island, Barbour, New Balance",
    notes: "Cliente storico collezionista, gradisce spedizioni rapide con BRT.",
    loyaltyPoints: 195,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ordersCount: 3,
    totalSpent: 384.0,
    orders: [
      {
        id: "ord-3",
        orderNumber: "ORD-2026-1003",
        totalAmount: 139.0,
        status: "SPEDITO",
        channel: "SUBITO",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    id: "cust-4",
    firstName: "Francesca",
    lastName: "Neri",
    phone: "+39 349 9876543",
    email: "francesca.n@email.it",
    address: "Via Garibaldi 12, 50123 Firenze (FI)",
    fiscalCode: null,
    clothingSize: "M / 42 IT",
    shoeSize: "39 EU",
    preferredBrands: "Seiko, Vintage Jewelry, Foulard Seta",
    notes: "Interessata a orologi vintage e accessori di lusso.",
    loyaltyPoints: 170,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    ordersCount: 1,
    totalSpent: 169.0,
    orders: [
      {
        id: "ord-4",
        orderNumber: "ORD-2026-1004",
        totalAmount: 169.0,
        status: "IN_ATTESA",
        channel: "FACEBOOK",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
];

/**
 * Recupera tutti i clienti con storico ordini e statistiche di spesa.
 */
export async function getCustomers(searchQuery?: string): Promise<CustomerData[]> {
  const isDemo = isDemoEnvironment();

  try {
    const dbCustomers = await prisma.customer.findMany({
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (dbCustomers) {
      if (dbCustomers.length > 0) {
        let mapped: CustomerData[] = dbCustomers.map((c) => {
          const totalSpent = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
          return {
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
            email: c.email,
            address: c.address,
            fiscalCode: c.fiscalCode,
            clothingSize: c.clothingSize,
            shoeSize: c.shoeSize,
            preferredBrands: c.preferredBrands,
            notes: c.notes,
            loyaltyPoints: c.loyaltyPoints,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            ordersCount: c.orders.length,
            totalSpent,
            orders: c.orders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              totalAmount: o.totalAmount,
              status: o.status,
              channel: o.channel,
              createdAt: o.createdAt.toISOString(),
            })),
          };
        });

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          mapped = mapped.filter(
            (c) =>
              c.firstName.toLowerCase().includes(q) ||
              (c.lastName && c.lastName.toLowerCase().includes(q)) ||
              c.phone.includes(q) ||
              (c.email && c.email.toLowerCase().includes(q)) ||
              (c.preferredBrands && c.preferredBrands.toLowerCase().includes(q)) ||
              (c.notes && c.notes.toLowerCase().includes(q))
          );
        }

        return mapped;
      }

      if (!isDemo) {
        return [];
      }
    }
  } catch (error: any) {
    if (!isDemo) {
      console.warn("⚠️ Errore lettura clienti da DB:", error?.message || error);
      return [];
    }
  }

  // Fallback demo
  let results = [...MOCK_CUSTOMERS];
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    results = results.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.preferredBrands && c.preferredBrands.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  return isDemo ? results : [];
}

/**
 * Crea un nuovo cliente nel database.
 */
export async function createCustomer(input: CustomerInput): Promise<{ success: boolean; customer?: CustomerData; error?: string }> {
  try {
    const created = await prisma.customer.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName ? input.lastName.trim() : null,
        phone: input.phone.trim(),
        email: input.email ? input.email.trim() : null,
        address: input.address ? input.address.trim() : null,
        fiscalCode: input.fiscalCode ? input.fiscalCode.trim().toUpperCase() : null,
        clothingSize: input.clothingSize ? input.clothingSize.trim() : null,
        shoeSize: input.shoeSize ? input.shoeSize.trim() : null,
        preferredBrands: input.preferredBrands ? input.preferredBrands.trim() : null,
        notes: input.notes ? input.notes.trim() : null,
        loyaltyPoints: input.loyaltyPoints ?? 0,
      },
    });

    revalidatePath("/dashboard/clienti");

    return {
      success: true,
      customer: {
        id: created.id,
        firstName: created.firstName,
        lastName: created.lastName,
        phone: created.phone,
        email: created.email,
        address: created.address,
        fiscalCode: created.fiscalCode,
        clothingSize: created.clothingSize,
        shoeSize: created.shoeSize,
        preferredBrands: created.preferredBrands,
        notes: created.notes,
        loyaltyPoints: created.loyaltyPoints,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        ordersCount: 0,
        totalSpent: 0,
        orders: [],
      },
    };
  } catch (error: any) {
    if (isDemoEnvironment()) {
      const mockNew: CustomerData = {
        id: `mock-cust-${Date.now()}`,
        firstName: input.firstName,
        lastName: input.lastName || null,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        fiscalCode: input.fiscalCode || null,
        clothingSize: input.clothingSize || null,
        shoeSize: input.shoeSize || null,
        preferredBrands: input.preferredBrands || null,
        notes: input.notes || null,
        loyaltyPoints: input.loyaltyPoints ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0,
        orders: [],
      };
      return { success: true, customer: mockNew };
    }
    return { success: false, error: error?.message || "Errore nella creazione del cliente" };
  }
}

/**
 * Aggiorna i dati anagrafici o le preferenze del cliente.
 */
export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>
): Promise<{ success: boolean; customer?: CustomerData; error?: string }> {
  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName ? input.lastName.trim() : null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email ? input.email.trim() : null } : {}),
        ...(input.address !== undefined ? { address: input.address ? input.address.trim() : null } : {}),
        ...(input.fiscalCode !== undefined ? { fiscalCode: input.fiscalCode ? input.fiscalCode.trim().toUpperCase() : null } : {}),
        ...(input.clothingSize !== undefined ? { clothingSize: input.clothingSize ? input.clothingSize.trim() : null } : {}),
        ...(input.shoeSize !== undefined ? { shoeSize: input.shoeSize ? input.shoeSize.trim() : null } : {}),
        ...(input.preferredBrands !== undefined ? { preferredBrands: input.preferredBrands ? input.preferredBrands.trim() : null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes ? input.notes.trim() : null } : {}),
        ...(input.loyaltyPoints !== undefined ? { loyaltyPoints: input.loyaltyPoints } : {}),
      },
      include: {
        orders: true,
      },
    });

    revalidatePath("/dashboard/clienti");

    const totalSpent = updated.orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      success: true,
      customer: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        fiscalCode: updated.fiscalCode,
        clothingSize: updated.clothingSize,
        shoeSize: updated.shoeSize,
        preferredBrands: updated.preferredBrands,
        notes: updated.notes,
        loyaltyPoints: updated.loyaltyPoints,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        ordersCount: updated.orders.length,
        totalSpent,
        orders: updated.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          status: o.status,
          channel: o.channel,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    if (isDemoEnvironment()) {
      return { success: true };
    }
    return { success: false, error: error?.message || "Errore nell'aggiornamento del cliente" };
  }
}

/**
 * Elimina un cliente dal database.
 */
export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.customer.delete({
      where: { id },
    });
    revalidatePath("/dashboard/clienti");
    return { success: true };
  } catch (error: any) {
    if (isDemoEnvironment()) {
      return { success: true };
    }
    return { success: false, error: error?.message || "Errore nella cancellazione del cliente" };
  }
}
