import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts, getStoreOrders } from "@/lib/store-actions";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tenantConfig = await getTenantConfig();
  const products = await getStoreProducts();
  const orders = await getStoreOrders();

  return (
    <AdminDashboard
      initialProducts={products}
      initialOrders={orders}
      tenantConfig={tenantConfig}
    />
  );
}
