import { NextRequest, NextResponse } from "next/server";
import { getCustomers, createCustomer } from "@/lib/customer-actions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || undefined;
    const customers = await getCustomers(search);
    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Errore recupero clienti" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.firstName || !body.phone) {
      return NextResponse.json(
        { success: false, error: "Nome e Numero di telefono (WhatsApp) sono obbligatori." },
        { status: 400 }
      );
    }
    const result = await createCustomer(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Errore creazione cliente" },
      { status: 500 }
    );
  }
}
