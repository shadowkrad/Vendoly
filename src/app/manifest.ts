import { MetadataRoute } from "next";
import { prisma, ensureDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let brandName = "Vendoly";
  let themeColor = "#059669";

  try {
    await ensureDatabase();
    const cache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });
    if (cache?.brandName) {
      brandName = cache.brandName;
    }
    if (cache?.accentColor) {
      themeColor = cache.accentColor;
    }
  } catch (err) {
    console.error("[PWA Manifest Vendoly] Fallback su default:", err);
  }

  return {
    name: `${brandName} — Cassa POS & Store`,
    short_name: brandName,
    description: `Modulo cassa POS, catalogo e vendite per ${brandName}, parte dell'ecosistema Taaaac.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: themeColor,
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
