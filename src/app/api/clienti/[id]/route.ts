import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma, ensureDatabase } from "@/lib/db";
import { assicuraTokenTessera } from "@/lib/fidelity";
import { updateCustomer, deleteCustomer } from "@/lib/customer-actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  await ensureDatabase();
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        pointsMovements: { orderBy: { createdAt: "desc" }, take: 15 },
        orders: { orderBy: { createdAt: "desc" }, take: 25 },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
    }

    const tokenTessera = await assicuraTokenTessera(id);
    const ora = new Date();
    const [buoni, cache] = await Promise.all([
      prisma.giftCard.findMany({
        where: {
          clienteId: id,
          stato: "ATTIVA",
          OR: [{ dataScadenza: null }, { dataScadenza: { gte: ora } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          codice: true,
          motivo: true,
          tipoValore: true,
          importoIniziale: true,
          saldoResiduo: true,
          percentuale: true,
          descrizioneServizio: true,
          dataScadenza: true,
        },
      }),
      prisma.tenantLocalCache
        .findUnique({ where: { id: "singleton" }, select: { brandName: true } })
        .catch(() => null),
    ]);

    const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return NextResponse.json({
      cliente: {
        ...customer,
        birthDate: customer.birthDate ? customer.birthDate.toISOString() : null,
        tokenTessera,
        totalSpent,
      },
      buoni,
      nomeAttivita: cache?.brandName || "Vendoly Store",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Errore caricamento scheda cliente" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateCustomer(id, body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Errore aggiornamento cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const result = await deleteCustomer(id);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Errore cancellazione cliente" },
      { status: 500 }
    );
  }
}
