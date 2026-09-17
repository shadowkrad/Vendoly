import { getTenantConfig } from "@/lib/taaaac-core";
import { prisma } from "@/lib/db";
import PosDashboard from "@/components/PosDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Carica la configurazione del tenant da Taaaac Core (con fallback SQLite)
  const tenantConfig = await getTenantConfig();

  // Carica i dati iniziali dal database SQLite per un rendering server-side istantaneo
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
  });

  const recentSales = await prisma.sale.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: true,
    },
  });

  // Calcolo KPI base
  const totalRevenue = recentSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPoints = recentSales.reduce((sum, s) => sum + s.pointsEarned, 0);

  return (
    <PosDashboard
      tenantConfig={tenantConfig}
      initialCategories={categories}
      initialProducts={products}
      initialCustomers={customers}
      initialSales={recentSales}
      initialStats={{
        revenue: totalRevenue,
        salesCount: recentSales.length,
        averageTicket: recentSales.length > 0 ? totalRevenue / recentSales.length : 0,
        totalPoints,
      }}
    />
  );
}
