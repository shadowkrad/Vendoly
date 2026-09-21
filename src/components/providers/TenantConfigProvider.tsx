"use client";

import React, { createContext, useContext, useEffect } from "react";
import { TenantConfig, isAddonActive } from "@/lib/taaaac-client";

interface TenantContextValue {
  config: TenantConfig | null;
  isAddonActive: (addonId: string) => boolean;
}

const TenantConfigContext = createContext<TenantContextValue>({
  config: null,
  isAddonActive: () => false,
});

export function TenantConfigProvider({
  config,
  children,
}: {
  config: TenantConfig | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (config?.theme?.primaryColor) {
      document.documentElement.style.setProperty("--primary-tenant", config.theme.primaryColor);
    }
    if (config?.theme?.accentColor) {
      document.documentElement.style.setProperty("--accent-tenant", config.theme.accentColor);
    }
  }, [config]);

  const value: TenantContextValue = {
    config,
    isAddonActive: (addonId: string) => isAddonActive(config, addonId),
  };

  return (
    <TenantConfigContext.Provider value={value}>
      {children}
    </TenantConfigContext.Provider>
  );
}

export function useTenantConfig() {
  return useContext(TenantConfigContext);
}
