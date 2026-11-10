import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { leggiSorgentiIconaPwa } from "@/lib/pwa-icon-version";

export const dynamic = "force-dynamic";

const VALID_SIZES = [16, 32, 48, 180, 192, 512] as const;

async function caricaBufferSorgente(src: string): Promise<Buffer | null> {
  try {
    if (src.startsWith("data:")) {
      const commaIdx = src.indexOf(",");
      if (commaIdx === -1) return null;
      const meta = src.slice(0, commaIdx);
      const dataPart = src.slice(commaIdx + 1);
      return meta.includes(";base64")
        ? Buffer.from(dataPart, "base64")
        : Buffer.from(decodeURIComponent(dataPart), "utf8");
    }
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
  } catch {
    // passa alla sorgente successiva
  }
  return null;
}

async function caricaBufferFallbackStatico(size: number): Promise<Buffer | null> {
  const preferred =
    size === 512
      ? "icon-512.png"
      : size === 180
      ? "apple-touch-icon.png"
      : "icon-192.png";

  const candidati = [
    path.join(process.cwd(), "public", "icons", preferred),
    path.join(process.cwd(), "public", preferred),
    path.join(process.cwd(), "public", "icons", "icon-192.png"),
    path.join(process.cwd(), "public", "icon-192.png"),
    path.join(process.cwd(), "public", "icons", "icon-512.png"),
    path.join(process.cwd(), "public", "icon-512.png"),
  ];

  for (const filePath of candidati) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
        return await fs.promises.readFile(/*turbopackIgnore: true*/ filePath);
      }
    } catch {
      // ignora
    }
  }
  return null;
}

async function renderizzaIconaPng(
  inputBuffer: Buffer,
  size: number,
  opts: { isMaskable: boolean; brandBg: string }
): Promise<Buffer> {
  const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(opts.brandBg)
    ? opts.brandBg
    : "#059669";

  if (opts.isMaskable) {
    // Margine di sicurezza del 10% per lato (quadrato interno 80%) su sfondo pieno del brand
    const inner = Math.max(1, Math.round(size * 0.8));
    const resized = await sharp(inputBuffer, { density: 300 })
      .resize(inner, inner, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const comp = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: validHex,
      },
    })
      .composite([{ input: resized, gravity: "centre" }])
      .png()
      .toBuffer();

    return await sharp(comp)
      .flatten({ background: validHex })
      .png()
      .toBuffer();
  }

  if (size === 180) {
    // iPhone (apple-touch-icon): sempre opaca su sfondo bianco (senza canale alfa)
    return await sharp(inputBuffer, { density: 300 })
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
  }

  return await sharp(inputBuffer, { density: 300 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSize = parseInt(searchParams.get("size") || "192", 10);
  const size = (VALID_SIZES as readonly number[]).includes(rawSize) ? rawSize : 192;
  const isMaskable = searchParams.get("maskable") === "1";
  const hasVersion = Boolean(searchParams.get("v")?.trim());

  const { faviconUrl, logoUrl, primaryColor, accentColor } = await leggiSorgentiIconaPwa();
  const brandBg = accentColor || primaryColor || "#059669";
  const candidates = [faviconUrl, logoUrl].filter((x): x is string => Boolean(x && x.trim().length > 0));

  let pngBuffer: Buffer | null = null;

  for (const src of candidates) {
    const rawBuf = await caricaBufferSorgente(src);
    if (!rawBuf) continue;
    try {
      pngBuffer = await renderizzaIconaPng(rawBuf, size, {
        isMaskable,
        brandBg,
      });
      break;
    } catch {
      pngBuffer = null;
    }
  }

  if (!pngBuffer) {
    const fallbackBuf = await caricaBufferFallbackStatico(size);
    if (fallbackBuf) {
      try {
        pngBuffer = await renderizzaIconaPng(fallbackBuf, size, {
          isMaskable,
          brandBg,
        });
      } catch {
        pngBuffer = null;
      }
    }
  }

  if (!pngBuffer) {
    const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(brandBg)
      ? brandBg
      : "#059669";
    pngBuffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: validHex,
      },
    })
      .png()
      .toBuffer();
  }

  const etag = `"${crypto.createHash("sha1").update(pngBuffer).digest("hex").slice(0, 16)}"`;
  if (!hasVersion && request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  }

  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": hasVersion ? "public, max-age=31536000, immutable" : "no-cache",
      ETag: etag,
    },
  });
}
