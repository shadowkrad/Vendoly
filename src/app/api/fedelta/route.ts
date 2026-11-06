import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";

const movimentoSchema = z.object({
  clienteId: z.string().min(1, "Cliente obbligatorio"),
  punti: z.number().int().positive("I punti devono essere un intero positivo"),
  tipo: z.enum(["ACCREDITO", "RISCATTO"]),
  descrizione: z.string().max(255).optional().nullable(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  try {
    const inizioMese = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [tessereAttive, puntiAggregati, premiRiscattati, movimentiMese, clienti, ultimiMovimenti] = await Promise.all([
      prisma.customer.count({ where: { loyaltyPoints: { gt: 0 } } }),
      prisma.customer.aggregate({ _sum: { loyaltyPoints: true } }),
      prisma.movimentoPunti.count({ where: { tipo: "RISCATTO", origine: "PREMIO" } }),
      prisma.movimentoPunti.count({ where: { tipo: "ACCREDITO", createdAt: { gte: inizioMese } } }),
      prisma.customer.findMany({
        where: { phone: { not: "CANCELLATO" } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          loyaltyPoints: true,
          createdAt: true,
          orders: { take: 1, orderBy: { createdAt: "desc" }, select: { createdAt: true } },
        },
        orderBy: [{ loyaltyPoints: "desc" }, { lastName: "asc" }],
        take: 100,
      }),
      prisma.movimentoPunti.findMany({
        include: { cliente: { select: { id: true, firstName: true, lastName: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    return NextResponse.json({
      stats: {
        tessereAttive,
        puntiTotali: puntiAggregati._sum.loyaltyPoints || 0,
        premiRiscattati,
        movimentiMese,
      },
      clienti: clienti.map((c) => ({
        id: c.id,
        nome: c.firstName,
        cognome: c.lastName ?? "",
        telefono: c.phone,
        email: c.email,
        puntiFedelta: c.loyaltyPoints,
        dataUltimaVisita: c.orders[0]?.createdAt ?? null,
        createdAt: c.createdAt,
      })),
      ultimiMovimenti: ultimiMovimenti.map((m) => ({
        ...m,
        cliente: { id: m.cliente.id, nome: m.cliente.firstName, cognome: m.cliente.lastName ?? "", telefono: m.cliente.phone },
      })),
    });
  } catch (error) {
    console.error("Errore GET /api/fedelta:", error);
    return NextResponse.json({ error: "Errore durante il recupero dei dati fedeltà" }, { status: 500 });
  }
}

/** Movimento manuale (assegna punti a mano). Per spesa e premi si usa /api/fedelta/cassa. */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  try {
    const parsed = movimentoSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dati non validi", details: parsed.error.format() }, { status: 400 });
    }
    const { clienteId, punti, tipo, descrizione } = parsed.data;

    const cliente = await prisma.customer.findUnique({
      where: { id: clienteId },
      select: { id: true, loyaltyPoints: true },
    });
    if (!cliente) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });

    if (tipo === "RISCATTO" && cliente.loyaltyPoints < punti) {
      return NextResponse.json(
        { error: `Punti insufficienti: il cliente ha ${cliente.loyaltyPoints} punti, necessari ${punti}` },
        { status: 400 }
      );
    }

    const nuovoSaldo = tipo === "ACCREDITO" ? cliente.loyaltyPoints + punti : cliente.loyaltyPoints - punti;
    const risultato = await prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id: clienteId }, data: { loyaltyPoints: nuovoSaldo } });
      return tx.movimentoPunti.create({
        data: {
          clienteId,
          punti,
          tipo,
          origine: "MANUALE",
          saldoDopo: nuovoSaldo,
          operatore: "Staff",
          descrizione:
            descrizione || (tipo === "ACCREDITO" ? `Accredito manuale (+${punti} pt)` : `Riscatto manuale (-${punti} pt)`),
        },
      });
    });

    return NextResponse.json({ success: true, nuovoSaldo, movimento: risultato });
  } catch (error) {
    console.error("Errore POST /api/fedelta:", error);
    return NextResponse.json({ error: "Errore durante l'operazione sui punti fedeltà" }, { status: 500 });
  }
}
