import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSession,
  clearMaintenanceSession,
  getMaintenanceSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let sessionId = body?.sessionId;

    if (!sessionId) {
      const current = await getMaintenanceSession();
      sessionId = current?.sessionId;
    }

    const coreApiUrl =
      process.env.TAAAAC_CORE_API_URL?.trim() ||
      process.env.TAAAAC_CORE_URL?.trim() ||
      "https://taaaac.eu";

    // 1. Notifica a Taaaac Core la chiusura formale della sessione nel registro audit
    if (sessionId) {
      try {
        await fetch(`${coreApiUrl}/api/internal/maintenance/exit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        });
      } catch (err: any) {
        console.warn(
          "[MaintenanceExit] Notifica chiusura sessione a Taaaac Core fallita:",
          err?.message || err
        );
      }
    }

    // 2. Rimuove la sessione amministrativa e i cookie di manutenzione
    await clearAdminSession();
    await clearMaintenanceSession();

    return NextResponse.json({
      success: true,
      message:
        "Sessione di manutenzione terminata. Rientro in console SuperAdmin effettuato.",
      redirectUrl: "https://admin.taaaac.eu",
    });
  } catch (err: any) {
    console.error("Errore uscita manutenzione:", err);
    return NextResponse.json(
      {
        error:
          err?.message || "Errore durante l'uscita dalla manutenzione",
        redirectUrl: "https://admin.taaaac.eu",
      },
      { status: 500 }
    );
  }
}
