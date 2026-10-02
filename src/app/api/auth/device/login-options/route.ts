import { NextRequest, NextResponse } from "next/server";
import { createDeviceLoginOptions } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const res = await createDeviceLoginOptions(req);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 400 });
    }
    return NextResponse.json(res.options);
  } catch (error: any) {
    console.error("[Vendoly] Errore login-options:", error);
    return NextResponse.json({ error: error.message || "Errore generazione opzioni login dispositivo" }, { status: 500 });
  }
}
