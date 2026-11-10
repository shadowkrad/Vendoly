import { MetadataRoute } from "next";
import { prisma, ensureDatabase } from "@/lib/db";
import { calcolaHashIcona, pwaIconUrl } from "@/lib/pwa-icon-version";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let brandName = "Vendoly";
  let themeColor = "#059669";
  let v = calcolaHashIcona(null, null);

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
    v = calcolaHashIcona(cache?.faviconUrl, cache?.logoUrl);
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
        src: pwaIconUrl(192, v),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(512, v),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(512, v, { maskable: true }),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
