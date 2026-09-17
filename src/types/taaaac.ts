export type LicenseStatus = "ATTIVO" | "SOSPESO" | "IN_SCADENZA";

export type TaaaacModuleKey =
  | "WHATSAPP_REMINDERS"
  | "LOYALTY_CARD"
  | "VENDOLY_CHANNEL_MANAGER"
  | "ONLINE_CATALOG"
  | "ECOMMERCE_SYNC"
  | "ADVANCED_ANALYTICS"
  | "MULTI_CASHIER";

export interface TenantThemeConfig {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  brandName: string;
}

export interface TenantConfigResponse {
  domain: string;
  licenseStatus: LicenseStatus;
  licenseExpiresAt?: string;
  enabledModules: TaaaacModuleKey[];
  theme: TenantThemeConfig;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface ModuleMetadata {
  key: TaaaacModuleKey;
  name: string;
  description: string;
  iconName: string;
  enabled: boolean;
}
