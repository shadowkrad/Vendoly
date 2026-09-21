import React from "react";
import { fetchTenantConfig } from "@/lib/taaaac-client";
import { TenantConfigProvider } from "@/components/providers/TenantConfigProvider";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantConfig = await fetchTenantConfig();

  return (
    <TenantConfigProvider config={tenantConfig}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
        {/* Sidebar unificata */}
        <DashboardSidebar />

        {/* Contenuto Principale con margine sinistro su desktop */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-64">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </TenantConfigProvider>
  );
}
