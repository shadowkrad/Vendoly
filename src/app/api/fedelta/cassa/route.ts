import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { cercaClientePerTelefono } from "@/lib/clienti-telefono";
import { leggiRegole, puntiPerImporto, accreditaPunti, riscattaPremio, assicuraTokenTessera } from "@/lib/fidelity";

/** Cerca un cliente per telefono (anche con spazi o +39), per link/codice tessera o per nome. */
async function trovaClienti(q: string) {
  const testo = q.trim();
  if (!testo) return [];

  const daLink = testo.includes("/tessera/") ? testo.split("/tessera/")[1].split(/[?#/]/)[0] : testo;
  const perToken = await prisma.customer.findUnique({ where: { loyaltyToken: daLink } });
  if (perToken) return [perToken];

  const cifre = testo.replace(/\D/g, "");
  if (cifre.length >= 5) {
    const trovato = await cercaClientePerTelefono(testo);
    if (trovato) return prisma.customer.findMany({ where: { id: trovato.id } });
  }
  return prisma.customer.findMany({
    where: {
      phone: { not: "CANCELLATO" },
      OR: [{ firstName: { contains: testo } }, { lastName: { contains: testo } }],
    },
    orderBy: [{ lastName: "asc" }],
    take: 8,
  });
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const q = req.nextUrl.searchParams.get("q") || "";
  const regole = await leggiRegole();
  const trovati = await trovaClienti(q);

  const clienti = await Promise.all(
    trovati.map(async (c) => ({
      id: c.id,
      nome: c.firstName,
      cognome: c.lastName ?? "",
      telefono: c.phone,
      punti: c.loyaltyPoints,
      tokenTessera: await assicuraTokenTessera(c.id),
    }))
  );
  return NextResponse.json({ regole, clienti });
}

const operazioneSchema = z.discriminatedUnion("azione", [
  z.object({
    azione: z.literal("ACCREDITA"),
    clienteId: z.string().min(1),
    importo: z.number().min(0).max(100000).optional(),
    punti: z.number().int().min(0).max(100000).optional(),
  }),
  z.object({
    azione: z.literal("RISCATTA"),
    clienteId: z.string().min(1),
    premioId: z.string().min(1),
  }),
]);

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const parsed = operazioneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  const dati = parsed.data;
  const operatore = "Staff";

  try {
    const regole = await leggiRegole();
    if (!regole.enabled) {
      return NextResponse.json({ error: "Il programma fedeltà non è attivo (si attiva in Impostazioni)" }, { status: 400 });
    }

    if (dati.azione === "ACCREDITA") {
      const daSpesa = puntiPerImporto(dati.importo ?? 0, regole);
      const manuali = dati.punti ?? 0;
      const totale = daSpesa + manuali;
      if (totale <= 0) return NextResponse.json({ error: "Indica l'importo speso o i punti da dare" }, { status: 400 });
      const descrizione =
        daSpesa > 0 && manuali > 0
          ? `Cassa: spesa ${dati.importo?.toFixed(2)} € (+${daSpesa}) e punti extra (+${manuali})`
          : daSpesa > 0
            ? `Cassa: spesa ${dati.importo?.toFixed(2)} € (+${daSpesa} pt)`
            : `Punti extra (+${manuali} pt)`;
      const r = await accreditaPunti(
        {
          clienteId: dati.clienteId,
          punti: totale,
          origine: daSpesa > 0 ? "SPESA" : "MANUALE",
          importo: dati.importo ?? null,
          descrizione,
          operatore,
        },
        regole
      );
      return NextResponse.json({ success: true, accreditati: totale, bonusBenvenuto: r.bonusBenvenuto, saldo: r.saldo });
    }

    const r = await riscattaPremio(dati.clienteId, dati.premioId, operatore);
    return NextResponse.json({ success: true, premio: r.premio, saldo: r.saldo, buono: r.buono });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Operazione non riuscita" }, { status: 400 });
  }
}
