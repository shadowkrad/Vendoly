import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts, getStoreOrders } from "@/lib/store-actions";
import AdminDashboard from "@/components/AdminDashboard";
import BannerPreavvisoFestivita from "@/components/dashboard/BannerPreavvisoFestivita";
import { getProssimeFestivitaVendoly } from "@/lib/festivita-italiane";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const [tenantConfig, products, orders, prossimeFestivita] = await Promise.all([
    getTenantConfig(),
    getStoreProducts(),
    getStoreOrders(),
    getProssimeFestivitaVendoly(7),
  ]);

  return (
    <div className="space-y-6">
      <BannerPreavvisoFestivita festivita={prossimeFestivita} />
      <AdminDashboard
        initialProducts={products}
        initialOrders={orders}
        tenantConfig={tenantConfig}
      />
    </div>
  );
}
