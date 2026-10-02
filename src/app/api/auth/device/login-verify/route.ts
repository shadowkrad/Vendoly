import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceLoginAndAuthenticate } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await verifyDeviceLoginAndAuthenticate(req, body);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 401 });
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[Vendoly] Errore login-verify:", error);
    return NextResponse.json({ error: error.message || "Errore durante lo sblocco biometrico" }, { status: 500 });
  }
}
