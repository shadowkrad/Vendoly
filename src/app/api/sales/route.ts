import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: true,
      },
    });

    // Statistiche rapide di cassa
    const allSales = await prisma.sale.findMany({
      select: {
        totalAmount: true,
        pointsEarned: true,
        createdAt: true,
      },
    });

    const totalRevenue = allSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalSalesCount = allSales.length;
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const totalLoyaltyPoints = allSales.reduce((acc, s) => acc + s.pointsEarned, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalSalesCount,
        averageTicket,
        totalLoyaltyPoints,
      },
      recentSales,
    });
  } catch (error: any) {
    console.error("Errore recupero vendite:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dei dati di vendita" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      customerId,
      paymentMethod = "CONTANTI",
      discountAmount = 0,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Il carrello non contiene articoli validi" },
        { status: 400 }
      );
    }

    // Calcolo totali e generazione numero scontrino univoco
    let subtotal = 0;
    let taxAmount = 0;

    const saleItemsData = items.map((item: any) => {
      const lineSubtotal = item.price * item.quantity;
      const lineTax = lineSubtotal * (item.vatRate / (100 + item.vatRate));
      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: item.id,
        productName: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        vatRate: item.vatRate || 22.0,
        subtotal: lineSubtotal,
      };
    });

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const pointsEarned = Math.floor(totalAmount / 10); // 1 punto ogni 10€

    const timestamp = Date.now();
    const saleNumber = `SCT-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`;

    // Transazione Prisma: crea vendita, crea righe scontrino, scala scorte, accredita punti
    const newSale = await prisma.$transaction(async (tx) => {
      // 1. Crea la vendita
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          paymentMethod,
          status: "COMPLETED",
          cashierName: "Cassa 1 - Operatore",
          customerId: customerId || null,
          pointsEarned,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 2. Aggiorna giacenze prodotti
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Accredita punti fedeltà al cliente
      if (customerId && pointsEarned > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            fidelityPoints: {
              increment: pointsEarned,
            },
          },
        });
      }

      return sale;
    });

    return NextResponse.json({
      success: true,
      sale: newSale,
    });
  } catch (error: any) {
    console.error("Errore salvataggio vendita:", error);
    return NextResponse.json(
      { error: "Errore durante la registrazione dello scontrino" },
      { status: 500 }
    );
  }
}
