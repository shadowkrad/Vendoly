import { getTenantConfig } from "@/lib/taaaac-core";
import { prisma } from "@/lib/db";
import PosDashboard from "@/components/PosDashboard";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_CUSTOMERS,
  DEMO_SALES,
} from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Carica la configurazione del tenant da Taaaac Core (con fallback SQLite)
  const tenantConfig = await getTenantConfig();

  let categories: any[] = [];
  let products: any[] = [];
  let customers: any[] = [];
  let recentSales: any[] = [];

  try {
    // Carica i dati dal database SQLite
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    customers = await prisma.customer.findMany({
      orderBy: { lastName: "asc" },
    });

    recentSales = await prisma.sale.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: true,
      },
    });
  } catch (error: any) {
    console.warn(
      "⚠️ Errore lettura database Prisma SQLite (es. ambiente Vercel serverless):",
      error?.message || error
    );
  }

  // Se il database è vuoto o non accessibile, adotta i dati dimostrativi di fallback
  const finalCategories = categories.length > 0 ? categories : DEMO_CATEGORIES;
  const finalProducts = products.length > 0 ? products : DEMO_PRODUCTS;
  const finalCustomers = customers.length > 0 ? customers : DEMO_CUSTOMERS;
  const finalSales = recentSales.length > 0 ? recentSales : DEMO_SALES;

  // Calcolo KPI base
  const totalRevenue = finalSales.reduce(
    (sum: number, s: any) => sum + (s.totalAmount || 0),
    0
  );
  const totalPoints = finalSales.reduce(
    (sum: number, s: any) => sum + (s.pointsEarned || 0),
    0
  );

  return (
    <PosDashboard
      tenantConfig={tenantConfig}
      initialCategories={finalCategories}
      initialProducts={finalProducts}
      initialCustomers={finalCustomers}
      initialSales={finalSales}
      initialStats={{
        revenue: totalRevenue,
        salesCount: finalSales.length,
        averageTicket:
          finalSales.length > 0 ? totalRevenue / finalSales.length : 0,
        totalPoints,
      }}
    />
  );
}
