import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Segnale di presenza dell'operatore Taaaac: lo inoltra al Core, che mostra il banner al cliente solo se arriva.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId obbligatorio" }, { status: 400 });
    }

    const coreApiUrl =
      process.env.TAAAAC_CORE_API_URL?.trim() ||
      process.env.TAAAAC_CORE_URL?.trim() ||
      "https://taaaac.eu";

    const res = await fetch(`${coreApiUrl}/api/internal/maintenance/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, active: Boolean(data?.active) });
  } catch {
    return NextResponse.json({ success: false, active: false });
  }
}
