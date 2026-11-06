import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { z } from "zod";
import { sendNotificationMail } from "@/lib/taaaac-mailer";
import { appUrlDaRichiesta } from "@/lib/app-url";
import { templateEmailBuono } from "@/lib/buoni-invio";
import { statoEffettivo } from "@/lib/buoni";
import { eAmbienteDemo } from "@/lib/demo";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  canale: z.enum(["EMAIL", "WHATSAPP"]),
  email: z.string().email("Indirizzo email non valido").optional().nullable(),
});

/**
 * Invio del buono. EMAIL: parte subito (di default dal servizio email di Taaaac, senza costi per l'esercente).
 * WHATSAPP: non invia nulla da solo (costi e scelta dell'esercente): registra che l'esercente ha aperto WhatsApp.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dati non validi" }, { status: 400 });
  }
  const operatore = "Staff";

  const b = await prisma.giftCard.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "Buono non trovato" }, { status: 404 });
  if (statoEffettivo(b) !== "ATTIVA") {
    return NextResponse.json({ error: "Si possono inviare solo i buoni ancora validi" }, { status: 400 });
  }
  if (!b.tokenPubblico) {
    return NextResponse.json({ error: "Questo buono non ha un link: è stato emesso con una versione precedente" }, { status: 400 });
  }

  if (parsed.data.canale === "WHATSAPP") {
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: b.id, tipo: "INVIO", importo: 0, saldoDopo: b.saldoResiduo, operatore, note: "Inviato su WhatsApp (aperto dall'esercente)" },
    });
    return NextResponse.json({ success: true });
  }

  // Email: indirizzo indicato, oppure quello del cliente intestatario, oppure di chi ha acquistato
  let destinatario = parsed.data.email?.trim() || "";
  let nomeDest: string | null = b.beneficiarioNome || null;
  if (!destinatario && b.clienteId) {
    const c = await prisma.customer.findUnique({ where: { id: b.clienteId }, select: { email: true, firstName: true } });
    if (c?.email && !c.email.endsWith(".local") && !c.email.endsWith(".invalid")) destinatario = c.email;
    nomeDest = c?.firstName || nomeDest;
  }
  if (!destinatario) destinatario = b.acquirenteEmail || "";
  if (!destinatario) {
    return NextResponse.json({ error: "Manca l'indirizzo email: scrivilo per inviare il buono" }, { status: 400 });
  }

  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
  const link = `${appUrlDaRichiesta(req)}/buono/${b.tokenPubblico}`;
  const { subject, html } = templateEmailBuono({
    nomeSalone: imp?.brandName || "Il tuo salone",
    nomeDestinatario: nomeDest,
    buono: b,
    link,
    colore: imp?.accentColor || "#d97706",
  });
  // Nella demo l'email non parte davvero (nessun invio a indirizzi reali): si simula e si registra
  if (eAmbienteDemo(req.headers.get("host"))) {
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: b.id, tipo: "INVIO", importo: 0, saldoDopo: b.saldoResiduo, operatore, note: `Email simulata (demo) a ${destinatario}` },
    });
    return NextResponse.json({ success: true, destinatario, simulato: true });
  }

  const r = await sendNotificationMail({ to: destinatario, subject, html, senderName: imp?.brandName || undefined });
  if (!r.success) {
    return NextResponse.json({ error: "Invio non riuscito: controlla l'indirizzo e riprova" }, { status: 502 });
  }
  await prisma.movimentoGiftCard.create({
    data: { giftCardId: b.id, tipo: "INVIO", importo: 0, saldoDopo: b.saldoResiduo, operatore, note: `Inviato per email a ${destinatario}` },
  });
  return NextResponse.json({ success: true, destinatario });
}
