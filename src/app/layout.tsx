import FloatingWhatsAppWidget from "@/components/public/FloatingWhatsAppWidget";
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
  const brand = tenant.theme.brandName || "Punto Vendita";
  const favicon = tenant.theme.faviconUrl || "/favicon.ico";

  return {
    title: {
      default: brand,
      template: `%s | ${brand}`,
    },
    description: `Catalogo prodotti e cassa punto vendita per ${brand}`,
    icons: {
      icon: favicon,
      apple: tenant.theme.faviconUrl || "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: brand,
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
  const appleIcon = tenant.theme.faviconUrl || "/apple-touch-icon.png";

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
        <link rel="apple-touch-icon" sizes="180x180" href={appleIcon} />
        <link rel="manifest" href="/manifest.json" />
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      <FloatingWhatsAppWidget />
      </body>
    </html>
  );
}
