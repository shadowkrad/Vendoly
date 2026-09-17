import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validatePosAuthorization } from "@/lib/auth-pos";
import { DEMO_PRODUCTS } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  // 1. Controllo di autorizzazione (Issue #1)
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const listings = await prisma.channelListing.findMany({
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (listings.length > 0) {
      return NextResponse.json({ success: true, listings });
    }
  } catch (err: any) {
    console.warn("Fallback channel listings su ambiente demo:", err?.message || err);
  }

  // Fallback demo per Vercel o primo avvio
  const demoListings = DEMO_PRODUCTS.flatMap((p) =>
    (p.channelListings || []).map((l) => ({
      ...l,
      productId: p.id,
      product: p,
      createdAt: l.listedAt || new Date().toISOString(),
    }))
  );

  return NextResponse.json({ success: true, listings: demoListings });
}

export async function POST(req: NextRequest) {
  // 1. Controllo di autorizzazione (Issue #1)
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const { productId, channel, listedPrice, externalUrl, status = "ACTIVE" } = body;

    if (!productId || !channel || listedPrice === undefined) {
      return NextResponse.json(
        { error: "Dati mancanti per la creazione dell'annuncio" },
        { status: 400 }
      );
    }

    const listing = await prisma.channelListing.create({
      data: {
        productId,
        channel,
        listedPrice: parseFloat(listedPrice),
        externalUrl,
        status,
        listedAt: status === "ACTIVE" ? new Date() : null,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ success: true, listing });
  } catch (err: any) {
    console.error("Errore salvataggio inserzione canale:", err);
    return NextResponse.json(
      { error: "Impossibile salvare l'annuncio multi-canale" },
      { status: 500 }
    );
  }
}
