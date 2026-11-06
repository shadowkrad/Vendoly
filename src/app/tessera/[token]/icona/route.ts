import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Carica i byte del logo dell'attivita' (data URI oppure indirizzo web). */
async function leggiLogo(logo: string): Promise<Buffer | null> {
  try {
    if (logo.startsWith("data:")) {
      const dati = logo.split(",")[1] || "";
      return Buffer.from(dati, logo.includes(";base64") ? "base64" : "utf8");
    }
    if (/^https?:\/\//.test(logo)) {
      const r = await fetch(logo, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return null;
      return Buffer.from(await r.arrayBuffer());
    }
  } catch {
    // si usa l'icona di riserva
  }
  return null;
}

/**
 * Icona della tessera sul telefono: il LOGO dell'attivita' centrato su fondo bianco (quadrato, con margine).
 * Senza logo: il colore dell'attivita' con l'iniziale del nome.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cliente = token ? await prisma.customer.findUnique({ where: { loyaltyToken: token }, select: { id: true } }) : null;
  if (!cliente) return new NextResponse("Non trovato", { status: 404 });

  const richiesta = parseInt(req.nextUrl.searchParams.get("size") || "512", 10);
  const size = [180, 192, 512].includes(richiesta) ? richiesta : 512;

  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const sfondo = "#ffffff";
  let png: Buffer | null = null;

  const bytes = imp?.logoUrl ? await leggiLogo(imp.logoUrl) : null;
  if (bytes) {
    try {
      const margine = Math.round(size * 0.12);
      const interno = size - margine * 2;
      const logo = await sharp(bytes, { density: 300 })
        .resize(interno, interno, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      png = await sharp({ create: { width: size, height: size, channels: 4, background: sfondo } })
        .composite([{ input: logo, gravity: "centre" }])
        .png()
        .toBuffer();
    } catch {
      png = null;
    }
  }

  if (!png) {
    const accento = /^#[0-9a-fA-F]{6}$/.test(imp?.accentColor || "") ? imp!.accentColor : "#d97706";
    const iniziale = (imp?.brandName || "S").trim().charAt(0).toUpperCase().replace(/[<>&"']/g, "S");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${accento}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(size * 0.55)}" fill="#ffffff">${iniziale}</text></svg>`;
    png = await sharp(Buffer.from(svg)).png().toBuffer();
  }

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
