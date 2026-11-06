import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

/** Ricerca rapida clienti (nome o telefono) per intestare un buono. */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const ricerca = req.nextUrl.searchParams.get("ricerca")?.trim() || "";
  const limit = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "8", 10) || 8));
  const cifre = ricerca.replace(/\D/g, "");

  const righe = await prisma.customer.findMany({
    where: {
      phone: { not: "CANCELLATO" },
      ...(ricerca
        ? { OR: [{ firstName: { contains: ricerca } }, { lastName: { contains: ricerca } }, ...(cifre.length >= 3 ? [{ phone: { contains: cifre } }] : [])] }
        : {}),
    },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    orderBy: { firstName: "asc" },
    take: limit,
  });

  return NextResponse.json({
    clienti: righe.map((c) => ({ id: c.id, nome: c.firstName, cognome: c.lastName ?? "", telefono: c.phone, email: c.email })),
  });
}
