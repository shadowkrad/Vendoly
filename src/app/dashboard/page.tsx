import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts, getStoreOrders } from "@/lib/store-actions";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const tenantConfig = await getTenantConfig();
  const products = await getStoreProducts();
  const orders = await getStoreOrders();

  return (
    <div className="space-y-6">
      <AdminDashboard
        initialProducts={products}
        initialOrders={orders}
        tenantConfig={tenantConfig}
      />
    </div>
  );
}
