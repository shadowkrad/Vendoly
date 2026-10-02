import { NextRequest, NextResponse } from "next/server";
import { createDeviceRegistrationOptions } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const res = await createDeviceRegistrationOptions(req);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 400 });
    }
    return NextResponse.json(res.options);
  } catch (error: any) {
    console.error("[Vendoly] Errore register-options:", error);
    return NextResponse.json({ error: error.message || "Errore generazione opzioni registrazione" }, { status: 500 });
  }
}
