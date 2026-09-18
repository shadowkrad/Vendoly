import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts, getStoreOrders } from "@/lib/store-actions";
import { isAdminAuthenticated } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import { AdminPinLogin } from "@/components/admin/AdminPinLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const tenantConfig = await getTenantConfig();
  const isAuth = await isAdminAuthenticated();

  // Se non autenticato, richiede inserimento PIN a 4 cifre (Issue #5)
  if (!isAuth) {
    return <AdminPinLogin brandName={tenantConfig.theme.brandName} />;
  }

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
