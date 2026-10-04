import React from "react";
import { getStoreOrders } from "@/lib/store-actions";
import { getTenantConfig } from "@/lib/taaaac-core";
import OrdersDashboardClient from "@/components/dashboard/OrdersDashboardClient";

export const dynamic = "force-dynamic";

export default async function OrdiniPage() {
  const [orders, tenantConfig] = await Promise.all([
    getStoreOrders(),
    getTenantConfig(),
  ]);

  return (
    <div className="space-y-6">
      <OrdersDashboardClient
        initialOrders={orders}
        storeName={tenantConfig?.theme?.brandName || "Vendoly Store"}
        storePhone={tenantConfig?.contact?.phone || ""}
      />
    </div>
  );
}
