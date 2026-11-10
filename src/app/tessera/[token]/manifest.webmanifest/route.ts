import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcolaHashLogoTessera } from "@/lib/pwa-icon-version";

export const dynamic = "force-dynamic";

/** Manifest della tessera: aggiunta alla schermata Home con nome, colori e icona (logo) dell'attivita'. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cliente = token ? await prisma.customer.findUnique({ where: { loyaltyToken: token }, select: { id: true } }) : null;
  if (!cliente) return new NextResponse("Non trovato", { status: 404 });

  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const nome = imp?.brandName || "Tessera fedeltà";
  const accento = imp?.accentColor || "#d97706";
  const v = calcolaHashLogoTessera(imp?.logoUrl, accento, nome);
  const base = `/tessera/${token}`;

  return NextResponse.json(
    {
      name: `${nome} — Tessera fedeltà`,
      short_name: nome.length > 14 ? nome.slice(0, 14) : nome,
      description: `La tua tessera fedeltà di ${nome}`,
      id: base,
      start_url: base,
      scope: `${base}/`,
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: accento,
      icons: [
        { src: `${base}/icona?size=192&v=${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `${base}/icona?size=512&v=${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" } }
  );
}
