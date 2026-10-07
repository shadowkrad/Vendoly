import React from "react";
import { headers } from "next/headers";
import { fetchTenantConfig, resolveTenantDomain } from "@/lib/taaaac-client";
import { TenantConfigProvider } from "@/components/providers/TenantConfigProvider";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MaintenanceBanner from "@/components/dashboard/MaintenanceBanner";
import { isAdminAuthenticated, getMaintenanceSession } from "@/lib/auth";
import { AdminPinLogin } from "@/components/admin/AdminPinLogin";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("host");
  const tenantDomain = resolveTenantDomain(host);
  const tenantConfig = await fetchTenantConfig(tenantDomain);

  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return (
      <TenantConfigProvider config={tenantConfig}>
        <AdminPinLogin brandName={tenantConfig.nomeAttivita} />
      </TenantConfigProvider>
    );
  }

  const userMaintenance = await getMaintenanceSession();
  const activeMaintenance = tenantConfig?.activeMaintenance;

  const showMaintenance = Boolean(userMaintenance) || Boolean(activeMaintenance);
  const maintenanceData = userMaintenance
    ? {
        adminNome: userMaintenance.adminNome,
        adminEmail: userMaintenance.adminEmail,
        motivo: userMaintenance.motivo,
        sessionId: userMaintenance.sessionId,
        canExit: true,
      }
    : activeMaintenance
    ? {
        adminNome: activeMaintenance.adminNome,
        adminEmail: activeMaintenance.adminEmail,
        motivo: activeMaintenance.motivo,
        sessionId: activeMaintenance.id,
        canExit: false,
      }
    : null;

  return (
    <TenantConfigProvider config={tenantConfig}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {showMaintenance && maintenanceData && (
          <MaintenanceBanner
            adminNome={maintenanceData.adminNome}
            adminEmail={maintenanceData.adminEmail}
            motivo={maintenanceData.motivo}
            sessionId={maintenanceData.sessionId}
            canExit={maintenanceData.canExit}
          />
        )}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar unificata */}
          <DashboardSidebar />

          {/* Contenuto Principale con margine sinistro su desktop */}
          <div className="flex-1 flex flex-col min-w-0 md:pl-64">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </TenantConfigProvider>
  );
}
