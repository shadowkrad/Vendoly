import { NextRequest, NextResponse } from "next/server";
import { syncOmnichannelChannels, fetchOmnichannelStatus } from "@/lib/omnichannel-client";
import { prisma, ensureDatabase } from "@/lib/db";
import { orariUfficialiPerCanali, chiusureFuture, modalitaOrari } from "@/lib/anagrafica-attivita";

async function isCallerAuthorized(): Promise<boolean> {
  try {
    const authMod = await import("@/lib/auth");
    if (typeof (authMod as any).isAdminAuthenticated === "function") {
      return await (authMod as any).isAdminAuthenticated();
    }
    if (typeof (authMod as any).auth === "function") {
      const session = await (authMod as any).auth();
      return !!session;
    }
  } catch {}
  return true;
}

export async function GET() {
  const isAuth = await isCallerAuthorized();
  if (!isAuth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const status = await fetchOmnichannelStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const isAuth = await isCallerAuthorized();
  if (!isAuth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Gli orari su Google / Facebook / Instagram sono SEMPRE gli orari ufficiali del negozio salvati in
    // Impostazioni > Negozio (giorni di chiusura inclusi): quelli inviati dal chiamante non vengono usati.
    await ensureDatabase();
    const cache = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
    // Solo un negozio fisico manda gli orari ai canali: per un e-commerce o un orario di assistenza non si pubblica nulla
    if (modalitaOrari(cache) !== "NEGOZIO") {
      return NextResponse.json({
        ok: true,
        success: true,
        summary: "Orari non inviati: nelle impostazioni sono indicati come orario di assistenza o disattivati.",
        channels: {},
      });
    }
    const weeklyHours = orariUfficialiPerCanali(cache);
    const specialClosures = body.specialClosures || (await chiusureFuture());

    const result = await syncOmnichannelChannels({
      weeklyHours,
      specialClosures,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: result.error || "Errore durante la sincronizzazione canali" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      summary: result.summary,
      channels: result.channels,
    });
  } catch (error: any) {
    console.error("[Omnichannel Sync Channels API Error]:", error);
    return NextResponse.json(
      { ok: false, success: false, error: error.message || "Errore interno server durante il sync canali" },
      { status: 500 }
    );
  }
}
