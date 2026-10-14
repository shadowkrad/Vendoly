import { NextRequest, NextResponse } from "next/server";
import { setAdminSession, verifyAdminPasswordOrPin, isDemoEnvironment } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const host = req.headers.get("host");

    // 1. Accesso 1-Click per ambiente Demo
    if (body.demo) {
      if (!isDemoEnvironment(host)) {
        return NextResponse.json(
          { error: "Accesso demo non consentito in questo ambiente" },
          { status: 403 }
        );
      }
      await setAdminSession();
      return NextResponse.json({ success: true, isDemo: true });
    }

    // 2. Accesso con Password Master o PIN
    const secret = body.password || body.pin || "";
    if (!secret || !verifyAdminPasswordOrPin(secret)) {
      return NextResponse.json(
        { error: "Password non valida o errata" },
        { status: 401 }
      );
    }

    await setAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione" },
      { status: 500 }
    );
  }
}
