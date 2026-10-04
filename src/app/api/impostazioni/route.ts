import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (config) {
      return NextResponse.json({
        brandName: config.brandName,
        logoUrl: config.logoUrl,
        faviconUrl: config.faviconUrl,
        primaryColor: config.primaryColor,
        accentColor: config.accentColor,
        contactEmail: config.contactEmail,
        phone: config.phone,
      });
    }

    return NextResponse.json({
      brandName: "Vendoly Store",
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#0f172a",
      accentColor: "#059669",
      contactEmail: "support@vendoly.taaaac.eu",
      phone: "+39 02 8901 5678",
    });
  } catch (error) {
    console.error("Errore recupero impostazioni:", error);
    return NextResponse.json({ error: "Errore nel recupero impostazioni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandName, logoUrl, faviconUrl, primaryColor, accentColor, contactEmail, phone } = body;

    const updated = await prisma.tenantLocalCache.upsert({
      where: { id: "singleton" },
      update: {
        ...(brandName !== undefined && { brandName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(faviconUrl !== undefined && { faviconUrl }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(accentColor !== undefined && { accentColor }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(phone !== undefined && { phone }),
        lastSyncedAt: new Date(),
      },
      create: {
        id: "singleton",
        domain: "vendoly-demo.taaaac.eu",
        licenseStatus: "ATTIVO",
        enabledModules: "[]",
        brandName: brandName || "Vendoly Store",
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primaryColor || "#0f172a",
        accentColor: accentColor || "#059669",
        contactEmail: contactEmail || "support@vendoly.taaaac.eu",
        phone: phone || "+39 02 8901 5678",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("Errore salvataggio impostazioni:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
