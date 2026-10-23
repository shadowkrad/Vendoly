import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await isAdminAuthenticated();
    if (!isAuthed) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id: deviceId } = await params;

    const device = await prisma.trustedDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json({ error: "Dispositivo non trovato" }, { status: 404 });
    }

    await prisma.trustedDevice.delete({
      where: { id: device.id },
    });

    return NextResponse.json({
      success: true,
      message: "Dispositivo rimosso con successo.",
    });
  } catch (error) {
    console.error("Errore rimozione dispositivo:", error);
    return NextResponse.json({ error: "Errore interno rimozione dispositivo" }, { status: 500 });
  }
}
