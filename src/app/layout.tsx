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
      icon: [
        { url: "/api/pwa-icon?size=192", sizes: "192x192", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/api/pwa-icon?size=180", sizes: "180x180", type: "image/png" }],
    },
    manifest: '/manifest.webmanifest',
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
        <link rel="icon" href="/api/pwa-icon?size=192" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/api/pwa-icon?size=180" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
