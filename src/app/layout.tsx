import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getTenantConfig } from "@/lib/taaaac-core";
import { getPwaIconVersion, pwaIconUrl } from "@/lib/pwa-icon-version";
import { headers } from "next/headers";
import FloatingWhatsAppWidget from "@/components/public/FloatingWhatsAppWidget";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, v] = await Promise.all([
    getTenantConfig(),
    getPwaIconVersion(),
  ]);
  const brand = tenant.theme.brandName || "Punto Vendita";

  return {
    title: {
      default: brand,
      template: `%s | ${brand}`,
    },
    description: `Catalogo prodotti e cassa punto vendita per ${brand}`,
    icons: {
      icon: [
        { url: pwaIconUrl(32, v), sizes: "32x32", type: "image/png" },
        { url: pwaIconUrl(192, v), sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: pwaIconUrl(180, v), sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
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
  const [tenant, v] = await Promise.all([
    getTenantConfig(),
    getPwaIconVersion(),
  ]);

  const hasWhatsAppModule =
    Array.isArray(tenant.enabledModules) &&
    tenant.enabledModules.some((m) => String(m).toUpperCase().includes("WHATSAPP"));

  const waPhone = tenant.contact?.phone || "+39 02 8901 5678";

  // Iniezione dinamica dei colori del brand ricevuti da Taaaac Core
  const dynamicCss = `
    :root {
      --brand-primary: ${tenant.theme.primaryColor || "#0f172a"};
      --brand-accent: ${tenant.theme.accentColor || "#059669"};
    }
  `;

  // La tessera del cliente ha icona (logo) e manifest propri, impostati dalla sua pagina
  const eTessera = ((await headers()).get("x-pathname") || "").startsWith("/tessera/");

  return (
    <html lang="it" className={inter.variable}>
      <head>
        {!eTessera && (
          <>
            <link rel="icon" type="image/png" sizes="32x32" href={pwaIconUrl(32, v)} />
            <link rel="icon" type="image/png" sizes="192x192" href={pwaIconUrl(192, v)} />
            <link rel="apple-touch-icon" sizes="180x180" href={pwaIconUrl(180, v)} />
            <link rel="manifest" href="/manifest.webmanifest" />
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
        {hasWhatsAppModule && (
          <FloatingWhatsAppWidget
            phone={waPhone}
            brandName={tenant.theme.brandName || "Vendoly Store"}
          />
        )}
      </body>
    </html>
  );
}
