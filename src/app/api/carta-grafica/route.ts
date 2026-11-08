import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { origineDaRichiesta } from "@/lib/buono-pubblico";
import { caricaCartaGrafica, salvaCartaGrafica } from "@/lib/carta-grafica-server";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const origine = await origineDaRichiesta();
    const data = await caricaCartaGrafica(origine);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Errore GET /api/carta-grafica:", err);
    return NextResponse.json({ error: "Errore caricamento grafica" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const config = await salvaCartaGrafica(body);
    return NextResponse.json({ success: true, config });
  } catch (err) {
    console.error("Errore PUT /api/carta-grafica:", err);
    return NextResponse.json({ error: "Errore salvataggio grafica" }, { status: 500 });
  }
}
