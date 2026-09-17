import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_CUSTOMERS,
} from "@/lib/demo-data";

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
      categories: categories.length > 0 ? categories : DEMO_CATEGORIES,
      products: products.length > 0 ? products : DEMO_PRODUCTS,
      customers: customers.length > 0 ? customers : DEMO_CUSTOMERS,
    });
  } catch (error: any) {
    console.warn("Fallback dati catalogo su ambiente serverless:", error);
    return NextResponse.json({
      success: true,
      categories: DEMO_CATEGORIES,
      products: DEMO_PRODUCTS,
      customers: DEMO_CUSTOMERS,
    });
  }
}
