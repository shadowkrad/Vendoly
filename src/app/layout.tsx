import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getTenantConfig } from "@/lib/taaaac-core";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig();
  const favicon = tenant.theme.faviconUrl || "/favicon.ico";

  return {
    title: `${tenant.theme.brandName} - Cassa Touch POS & Vendite | Taaaac`,
    description: `Modulo gestionale cassa POS, fidelizzazione clienti e vendite integrato nell'ecosistema Taaaac. Licenza: ${tenant.licenseStatus}`,
    icons: {
      icon: favicon,
      apple: tenant.theme.faviconUrl || "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Vendoly",
    },
  };
}

export const viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantConfig();
  const favicon = tenant.theme.faviconUrl || "/favicon.ico";

  // Iniezione dinamica dei colori del brand ricevuti da Taaaac Core
  const dynamicCss = `
    :root {
      --brand-primary: ${tenant.theme.primaryColor || "#0f172a"};
      --brand-accent: ${tenant.theme.accentColor || "#059669"};
    }
  `;

  return (
    <html lang="it" className={inter.variable}>
      <head>
        <link rel="icon" href={favicon} sizes="any" />
        <link rel="apple-touch-icon" href={favicon} />
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
