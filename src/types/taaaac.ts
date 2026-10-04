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
  faviconUrl?: string | null;
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
    indirizzo?: string;
    ragioneSociale?: string;
    partitaIva?: string;
    titolare?: string;
    orariFeriali?: string;
    orariSabato?: string;
    orariDomenica?: string;
    politicaReso?: string;
    sogliaSpedizioneGratis?: number;
    costoSpedizioneStandard?: number;
    ritiroInSede?: boolean;
    messaggioScontrino?: string;
  };
}

export interface ModuleMetadata {
  key: TaaaacModuleKey;
  name: string;
  description: string;
  iconName: string;
  enabled: boolean;
}
