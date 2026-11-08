import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { statoEffettivo } from "@/lib/buoni";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ formato: z.enum(["a4", "ricevuta", "cartoncino", "cartaceo"]).default("a4") });

/** Registra la stampa (la prima e' STAMPA, le successive RISTAMPA, con lo stesso codice) e dice quale pagina aprire. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const formato = parsed.success ? parsed.data.formato : "a4";
  const operatore = "Staff";

  const b = await prisma.giftCard.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "Buono non trovato" }, { status: 404 });
  if (statoEffettivo(b) !== "ATTIVA") {
    return NextResponse.json({ error: "Si possono stampare solo i buoni ancora validi" }, { status: 400 });
  }
  if (!b.tokenPubblico) {
    return NextResponse.json({ error: "Questo buono non ha un link: è stato emesso con una versione precedente" }, { status: 400 });
  }

  const gia = await prisma.movimentoGiftCard.count({ where: { giftCardId: b.id, tipo: { in: ["STAMPA", "RISTAMPA"] } } });
  const ristampa = gia > 0;
  await prisma.movimentoGiftCard.create({
    data: {
      giftCardId: b.id,
      tipo: ristampa ? "RISTAMPA" : "STAMPA",
      importo: 0,
      saldoDopo: b.saldoResiduo,
      operatore,
      note: `${ristampa ? "Ristampa" : "Stampa"} ${formato === "ricevuta" ? "ricevuta 80 mm" : formato === "cartoncino" ? "cartoncino regalo" : "A4"} con lo stesso codice`,
    },
  });
  return NextResponse.json({ success: true, ristampa, url: `/buono/${b.tokenPubblico}/stampa?formato=${formato}` });
}
