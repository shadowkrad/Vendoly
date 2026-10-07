import { NextRequest, NextResponse } from "next/server";
import {
  verifyMaintenanceTokenWithCore,
  setAdminSession,
  setMaintenanceSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token di manutenzione mancante o non valido." },
        { status: 400 }
      );
    }

    const session = await verifyMaintenanceTokenWithCore(token);
    if (!session || !session.id) {
      return NextResponse.json(
        {
          error:
            "Accesso di manutenzione non autorizzato. Il token potrebbe essere scaduto o la sessione già terminata.",
        },
        { status: 401 }
      );
    }

    // 1. Imposta la sessione admin standard di Vendoly
    await setAdminSession();

    // 2. Imposta i metadati di manutenzione per banner e tracciamento
    await setMaintenanceSession({
      isMaintenance: true,
      adminNome: session.adminNome,
      adminEmail: session.adminEmail,
      motivo: session.motivo,
      sessionId: session.id,
      startedAt: session.startedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Sessione di assistenza tecnica attivata con successo.",
      redirectUrl: "/dashboard",
    });
  } catch (err: any) {
    console.error("[MaintenanceLogin] Errore durante l'autenticazione:", err);
    return NextResponse.json(
      { error: err?.message || "Errore del server durante l'accesso." },
      { status: 500 }
    );
  }
}
