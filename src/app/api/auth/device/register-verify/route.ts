import { NextRequest, NextResponse } from "next/server";
import { verifyAndSaveDeviceRegistration } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await verifyAndSaveDeviceRegistration(req, body);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 400 });
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[Vendoly] Errore register-verify:", error);
    return NextResponse.json({ error: error.message || "Errore verifica registrazione dispositivo" }, { status: 500 });
  }
}
