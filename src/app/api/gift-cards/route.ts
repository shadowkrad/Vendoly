import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { MOTIVI, emettiBuono, statoEffettivo } from "@/lib/buoni";

const emissioneSchema = z.object({
  motivo: z.enum(MOTIVI).default("REGALO"),
  tipoValore: z.enum(["IMPORTO", "PERCENTUALE", "SERVIZIO"]).default("IMPORTO"),
  importo: z.number().positive().max(100000).optional().nullable(),
  // Compatibilita' con la vecchia schermata: importoIniziale = importo
  importoIniziale: z.number().positive().max(100000).optional().nullable(),
  percentuale: z.number().min(1).max(100).optional().nullable(),
  descrizioneServizio: z.string().max(200).optional().nullable(),
  mesiValidita: z.number().int().min(1).max(120).optional().nullable(), // vuoto = senza scadenza
  dataScadenza: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
  spesaMinima: z.number().min(0).max(100000).optional().nullable(),
  usoParziale: z.boolean().optional(),
  note: z.string().max(500).optional().nullable(),
  acquirenteNome: z.string().max(100).optional().nullable(),
  acquirenteEmail: z.string().email("Email non valida").optional().or(z.literal("")).nullable(),
  acquirenteTelefono: z.string().max(30).optional().nullable(),
  beneficiarioNome: z.string().max(100).optional().nullable(),
  beneficiarioMessaggio: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() || "";
    const stato = sp.get("stato") || "";
    const motivo = sp.get("motivo") || "";
    const clienteId = sp.get("clienteId") || "";

    const ora = new Date();
    const inizioMese = new Date(ora.getFullYear(), ora.getMonth(), 1);
    const tra30 = new Date(ora.getTime() + 30 * 86400000);
    const nonScaduto = { OR: [{ dataScadenza: null }, { dataScadenza: { gte: ora } }] };

    const where: any = {};
    if (motivo) where.motivo = motivo;
    if (clienteId) where.clienteId = clienteId;
    if (search) {
      where.AND = [
        {
          OR: [
            { codice: { contains: search } },
            { beneficiarioNome: { contains: search } },
            { acquirenteNome: { contains: search } },
            { descrizioneServizio: { contains: search } },
          ],
        },
      ];
    }
    if (stato === "ATTIVA") {
      where.stato = "ATTIVA";
      where.AND = [...(where.AND || []), nonScaduto];
    } else if (stato === "SCADUTA") {
      where.stato = "ATTIVA";
      where.dataScadenza = { lt: ora };
    } else if (stato) {
      where.stato = stato;
    }

    const [regaliMese, attivi, residuoAgg, inScadenza, usati, lista] = await Promise.all([
      prisma.giftCard.aggregate({
        _sum: { importoIniziale: true },
        where: { createdAt: { gte: inizioMese }, motivo: "REGALO", stato: { not: "ANNULLATA" } },
      }),
      prisma.giftCard.count({ where: { stato: "ATTIVA", ...nonScaduto } }),
      prisma.giftCard.aggregate({
        _sum: { saldoResiduo: true },
        where: { stato: "ATTIVA", tipoValore: "IMPORTO", ...nonScaduto },
      }),
      prisma.giftCard.count({ where: { stato: "ATTIVA", dataScadenza: { gte: ora, lte: tra30 } } }),
      prisma.giftCard.count({ where: { stato: "RISCATTATA" } }),
      prisma.giftCard.findMany({
        where,
        include: { movimenti: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const ids = Array.from(new Set(lista.map((b) => b.clienteId).filter(Boolean) as string[]));
    const clienti = ids.length
      ? await prisma.customer.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } })
      : [];
    const anagrafica = new Map(
      clienti.map((c) => [c.id, { id: c.id, nome: c.firstName, cognome: c.lastName ?? "", email: c.email, telefono: c.phone }])
    );

    const giftCards = lista.map((b) => ({
      ...b,
      stato: statoEffettivo(b),
      clienteNome: b.clienteId && anagrafica.get(b.clienteId) ? `${anagrafica.get(b.clienteId)!.nome} ${anagrafica.get(b.clienteId)!.cognome}`.trim() : null,
      clienteEmail: b.clienteId ? anagrafica.get(b.clienteId)?.email || null : null,
      clienteTelefono: b.clienteId ? anagrafica.get(b.clienteId)?.telefono || null : null,
    }));

    return NextResponse.json({
      stats: {
        incassoMese: regaliMese._sum.importoIniziale || 0,
        buoniAttivi: attivi,
        valoreResiduo: residuoAgg._sum.saldoResiduo || 0,
        inScadenza,
        buoniRiscattati: usati,
      },
      giftCards,
    });
  } catch (error) {
    console.error("Errore GET /api/gift-cards:", error);
    return NextResponse.json({ error: "Errore durante il recupero dei buoni" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const parsed = emissioneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dati non validi" }, { status: 400 });
  }
  const d = parsed.data;
  const operatore = "Staff";

  try {
    if (d.motivo === "REGALO" && !d.beneficiarioNome?.trim() && !d.clienteId) {
      return NextResponse.json({ error: "Indica per chi è il buono regalo" }, { status: 400 });
    }
    const buono = await emettiBuono({
      motivo: d.motivo,
      tipoValore: d.tipoValore,
      importo: d.importo ?? d.importoIniziale ?? null,
      percentuale: d.percentuale ?? null,
      descrizioneServizio: d.descrizioneServizio ?? null,
      mesiValidita: d.mesiValidita ?? null,
      dataScadenza: d.dataScadenza ? new Date(d.dataScadenza) : null,
      clienteId: d.clienteId ?? null,
      spesaMinima: d.spesaMinima ?? null,
      usoParziale: d.usoParziale,
      note: d.note ?? null,
      acquirenteNome: d.acquirenteNome ?? null,
      acquirenteEmail: d.acquirenteEmail || null,
      acquirenteTelefono: d.acquirenteTelefono ?? null,
      beneficiarioNome: d.beneficiarioNome ?? null,
      beneficiarioMessaggio: d.beneficiarioMessaggio ?? null,
      operatore,
    });
    return NextResponse.json({ success: true, giftCard: buono });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore durante l'emissione del buono" }, { status: 400 });
  }
}
