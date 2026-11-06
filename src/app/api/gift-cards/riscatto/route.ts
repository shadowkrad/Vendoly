import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { trovaBuonoPerCodice, calcolaUso, usaBuono, statoEffettivo, descriviValore, ETICHETTA_MOTIVO } from "@/lib/buoni";

const schema = z.object({
  codice: z.string().min(1, "Codice buono obbligatorio"),
  importoSpesa: z.number().min(0).max(1000000).optional().nullable(),
  // Compatibilita' con la vecchia schermata
  importoDaScalare: z.number().positive().max(1000000).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  soloAnteprima: z.boolean().optional(),
});

/**
 * Cassa: cerca un buono per codice (o link) e lo usa. Con `soloAnteprima` non scrive nulla e dice
 * quanto sconto darebbe, cosi' la cassa puo' mostrarlo prima di confermare.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dati non validi" }, { status: 400 });
  }
  const { codice, importoSpesa, importoDaScalare, note, soloAnteprima } = parsed.data;
  const operatore = "Staff";

  try {
    const buono = await trovaBuonoPerCodice(codice);
    if (!buono) {
      return NextResponse.json({ error: `Nessun buono trovato con il codice ${codice.trim().toUpperCase()}` }, { status: 404 });
    }
    const cl = buono.clienteId
      ? await prisma.customer.findUnique({ where: { id: buono.clienteId }, select: { firstName: true, lastName: true } })
      : null;
    const cliente = cl ? { nome: cl.firstName, cognome: (cl.lastName ?? "") } : null;
    const scheda = {
      id: buono.id,
      codice: buono.codice,
      motivo: buono.motivo,
      motivoEtichetta: ETICHETTA_MOTIVO[buono.motivo as keyof typeof ETICHETTA_MOTIVO] || buono.motivo,
      tipoValore: buono.tipoValore,
      valore: descriviValore(buono),
      saldoResiduo: buono.saldoResiduo,
      spesaMinima: buono.spesaMinima,
      usoParziale: buono.usoParziale,
      dataScadenza: buono.dataScadenza,
      stato: statoEffettivo(buono),
      intestatario: cliente ? `${cliente.nome} ${cliente.cognome}`.trim() : buono.beneficiarioNome || null,
    };

    if (soloAnteprima) {
      let esito: { sconto: number; nuovoSaldo: number; conclude: boolean } | null = null;
      let errore: string | null = null;
      try {
        esito = calcolaUso(buono, { importoSpesa, importoDaScalare });
      } catch (e: any) {
        errore = e.message;
      }
      return NextResponse.json({ buono: scheda, anteprima: esito, errore });
    }

    const r = await usaBuono(buono.id, { importoSpesa, importoDaScalare, note, operatore });
    return NextResponse.json({
      success: true,
      codice: buono.codice,
      sconto: r.sconto,
      // Compatibilita'
      importoScalato: r.sconto,
      nuovoSaldo: r.buono.saldoResiduo,
      stato: r.buono.stato,
      movimento: r.movimento,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Impossibile usare il buono" }, { status: 400 });
  }
}
