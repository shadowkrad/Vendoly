import { NextRequest, NextResponse } from "next/server";
import { getStoreOrders, createOrder } from "@/lib/store-actions";

export async function GET() {
  try {
    const orders = await getStoreOrders();
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Impossibile recuperare gli ordini" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createOrder(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Errore nella creazione dell'ordine" },
      { status: 400 }
    );
  }
}
