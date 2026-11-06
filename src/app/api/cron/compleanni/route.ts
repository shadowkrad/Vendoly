import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db";
import { eseguiBuoniCompleanno } from "@/lib/compleanni";

export const dynamic = "force-dynamic";

/**
 * Crea (e invia) i buoni compleanno. Si puo' richiamare piu' volte al giorno senza creare doppioni.
 * Autorizzazione: segreto del cron (Bearer o x-cron-secret) oppure sessione ADMIN (anche dalla pagina Buoni).
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const xCronSecret = req.headers.get("x-cron-secret");
    const vercelToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cronOk = Boolean(cronSecret) && (vercelToken === cronSecret || xCronSecret === cronSecret);

    const admin = await isAdminAuthenticated();
    if (!cronOk && !admin) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

    await ensureDatabase();
    const esito = await eseguiBuoniCompleanno({ host: req.headers.get("host") });
    return NextResponse.json(esito);
  } catch (error: any) {
    console.error("[CRON /api/cron/compleanni] Errore:", error);
    return NextResponse.json({ error: error?.message || "Errore buoni compleanno" }, { status: 500 });
  }
}
