import { NextRequest, NextResponse } from "next/server";
import {
  syncOmnichannelChannels,
  fetchOmnichannelStatus,
  formatDisponibilitaToOmnichannel,
  formatEccezioniToSpecialClosures,
} from "@/lib/omnichannel-client";

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

    // 1. Estrazione o conversione di weeklyHours
    let weeklyHours = body.weeklyHours;
    if (!weeklyHours && (body.orari || body.disponibilita)) {
      weeklyHours = formatDisponibilitaToOmnichannel(body.orari || body.disponibilita);
    }

    // 2. Estrazione o conversione di specialClosures
    let specialClosures = body.specialClosures;
    if (!specialClosures && body.eccezioni) {
      specialClosures = formatEccezioniToSpecialClosures(body.eccezioni);
    }

    if (!weeklyHours || !Array.isArray(weeklyHours)) {
      // Fallback con orari standard per moduli a orario continuato (es. Tavoly, Vendoly, Taskly, Showly)
      weeklyHours = [
        { dayOfWeek: "MONDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "TUESDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "WEDNESDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "THURSDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "FRIDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "SATURDAY", isOpen: true, slots: [{ open: "09:00", close: "19:00" }] },
        { dayOfWeek: "SUNDAY", isOpen: false, slots: [] },
      ];
    }

    const result = await syncOmnichannelChannels({
      weeklyHours,
      specialClosures: specialClosures || [],
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
