import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { annullaBuono, statoEffettivo } from "@/lib/buoni";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();
  const { id } = await params;
  const b = await prisma.giftCard.findUnique({ where: { id }, include: { movimenti: { orderBy: { createdAt: "desc" } } } });
  if (!b) return NextResponse.json({ error: "Buono non trovato" }, { status: 404 });
  return NextResponse.json({ ...b, stato: statoEffettivo(b) });
}

const azioneSchema = z.object({ azione: z.literal("ANNULLA"), motivo: z.string().max(255).optional().nullable() });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();
  const { id } = await params;
  const parsed = azioneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  const operatore = "Staff";
  try {
    const b = await annullaBuono(id, parsed.data.motivo ?? null, operatore);
    return NextResponse.json({ success: true, stato: b.stato });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Operazione non riuscita" }, { status: 400 });
  }
}
