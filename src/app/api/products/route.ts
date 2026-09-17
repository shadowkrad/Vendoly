import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const customers = await prisma.customer.findMany({
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories,
      products,
      customers,
    });
  } catch (error: any) {
    console.error("Errore recupero catalogo:", error);
    return NextResponse.json(
      { error: "Impossibile recuperare il catalogo" },
      { status: 500 }
    );
  }
}
