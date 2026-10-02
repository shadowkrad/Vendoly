import { NextRequest, NextResponse } from "next/server";
import { listAllRegisteredDevices, revokeDevice, deleteDevice } from "@/lib/device-auth";

export async function GET() {
  try {
    const res = await listAllRegisteredDevices();
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 401 });
    }
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[Vendoly] Errore list devices:", error);
    return NextResponse.json({ error: error.message || "Errore recupero lista dispositivi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const hardDelete = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "ID dispositivo mancante" }, { status: 400 });
    }

    const res = hardDelete ? await deleteDevice(id) : await revokeDevice(id);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status || 400 });
    }

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[Vendoly] Errore revoca dispositivo:", error);
    return NextResponse.json({ error: error.message || "Errore durante la disconnessione del dispositivo" }, { status: 500 });
  }
}
