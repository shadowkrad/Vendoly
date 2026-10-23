import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAuthed = await isAdminAuthenticated();
    if (!isAuthed) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const tenant = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    const [trustedDevices, accessLogs] = await Promise.all([
      prisma.trustedDevice.findMany({
        orderBy: { lastSeenAt: "desc" },
        take: 20,
      }),
      prisma.accessLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      mfaEnabled: Boolean(tenant?.mfaEnabled),
      tokenVersion: tenant?.tokenVersion || 1,
      trustedDevices: trustedDevices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        ipAddress: d.ipAddress,
        firstSeenAt: d.firstSeenAt,
        lastSeenAt: d.lastSeenAt,
      })),
      accessLogs: accessLogs.map((l) => ({
        id: l.id,
        esito: l.esito,
        ipAddress: l.ipAddress,
        deviceType: l.deviceType,
        userAgent: l.userAgent,
        mfaUsed: l.mfaUsed,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Errore recupero info sicurezza:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

// Kill-switch: Revoca tutte le sessioni remote
export async function DELETE(req: NextRequest) {
  try {
    const isAuthed = await isAdminAuthenticated();
    if (!isAuthed) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: {
          tokenVersion: { increment: 1 },
        },
      }),
      prisma.trustedDevice.deleteMany(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tutte le sessioni remote sono state revocate con successo.",
    });
  } catch (error) {
    console.error("Errore revoca sessioni remote:", error);
    return NextResponse.json({ error: "Errore interno revoca sessioni" }, { status: 500 });
  }
}
