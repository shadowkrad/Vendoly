import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") || "192";

  try {
    await ensureDatabase();
    const cache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    const rawIcon = cache?.faviconUrl || cache?.logoUrl;

    if (rawIcon && typeof rawIcon === "string") {
      if (rawIcon.startsWith("data:")) {
        const parts = rawIcon.split(",");
        const meta = parts[0] || "";
        const base64Data = parts[1] || "";
        const mimeMatch = meta.match(/data:([^;]+)/);
        const contentType = mimeMatch ? mimeMatch[1] : "image/png";
        const buffer = Buffer.from(base64Data, "base64");

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }

      if (rawIcon.startsWith("http://") || rawIcon.startsWith("https://")) {
        return NextResponse.redirect(rawIcon, 307);
      }
    }
  } catch (err) {
    console.error("[PWA Icon Vendoly] Errore nel recupero icona tenant:", err);
  }

  // Fallback sull'icona nativa
  try {
    const fileName =
      size === "512"
        ? "icon-512.png"
        : size === "180"
        ? "apple-touch-icon.png"
        : "icon-192.png";

    const filePath = path.join(process.cwd(), "public", "icons", fileName);
    if (fs.existsSync(filePath)) {
      const buffer = await fs.promises.readFile(filePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    }
    const rootFilePath = path.join(process.cwd(), "public", fileName);
    if (fs.existsSync(rootFilePath)) {
      const buffer = await fs.promises.readFile(rootFilePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    }
  } catch (fallbackErr) {
    console.error("[PWA Icon Vendoly] Errore fallback icon:", fallbackErr);
  }

  return new NextResponse(null, { status: 404 });
}
