import React from "react";
import { getCustomers } from "@/lib/customer-actions";
import { getTenantConfig } from "@/lib/taaaac-core";
import CustomersClient from "@/components/dashboard/CustomersClient";

export const dynamic = "force-dynamic";

export default async function ClientiPage() {
  const [customers, tenantConfig] = await Promise.all([
    getCustomers(),
    getTenantConfig(),
  ]);

  return (
    <div className="space-y-6">
      <CustomersClient
        initialCustomers={customers}
        storeName={tenantConfig?.theme?.brandName || "Vendoly Store"}
      />
    </div>
  );
}
