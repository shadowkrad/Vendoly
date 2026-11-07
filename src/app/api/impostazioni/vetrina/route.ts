import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/db";
import { parseShowcaseConfig, ShowcaseConfig, DEFAULT_VENDOLY_SHOWCASE_CONFIG } from "@/lib/showcase-defaults";
import { applicaAnagrafica, caricaVetrinaUnificata } from "@/lib/anagrafica-attivita";

export async function GET() {
  try {
    // Dati del negozio e orari arrivano da Impostazioni > Negozio (fonte unica)
    const { showcase: parsedConfig, cache } = await caricaVetrinaUnificata();

    // Sincronizza i valori con TenantLocalCache se presenti
    if (cache?.brandName && (!parsedConfig.brandName || parsedConfig.brandName === DEFAULT_VENDOLY_SHOWCASE_CONFIG.brandName)) {
      parsedConfig.brandName = cache.brandName;
    }
    if (cache?.logoUrl && !parsedConfig.logoUrl) {
      parsedConfig.logoUrl = cache.logoUrl;
    }
    if (cache?.faviconUrl && !parsedConfig.faviconUrl) {
      parsedConfig.faviconUrl = cache.faviconUrl;
    }
    if (cache?.primaryColor && (!parsedConfig.primaryColor || parsedConfig.primaryColor === "#0f172a")) {
      parsedConfig.primaryColor = cache.primaryColor;
    }
    if (cache?.accentColor && (!parsedConfig.accentColor || parsedConfig.accentColor === "#059669")) {
      parsedConfig.accentColor = cache.accentColor;
    }

    return NextResponse.json({
      success: true,
      config: parsedConfig,
    });
  } catch (error) {
    console.error("Errore fetch showcase config Vendoly:", error);
    return NextResponse.json(
      { success: false, config: parseShowcaseConfig(null) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureDatabase();
    const body: ShowcaseConfig = await req.json();

    // Lo Studio NON puo' cambiare i dati del negozio: nome, indirizzo, telefono, email, orari e descrizione
    // restano quelli di Impostazioni > Negozio, qualunque cosa arrivi dal browser.
    const esistente = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } });
    if (esistente) {
      const salvata = parseShowcaseConfig((esistente as any).showcaseConfig);
      body.about = { ...(body.about || salvata.about), description: salvata.about.description };
      applicaAnagrafica(body, esistente);
    }

    const serializedConfig = JSON.stringify(body);

    const updateData: any = {
      showcaseConfig: serializedConfig,
    };

    if (body.primaryColor?.trim()) {
      updateData.primaryColor = body.primaryColor.trim();
    }
    if (body.accentColor?.trim()) {
      updateData.accentColor = body.accentColor.trim();
    }
    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl;
    }
    if (body.faviconUrl !== undefined) {
      updateData.faviconUrl = body.faviconUrl;
    }

    await prisma.tenantLocalCache.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        domain: "vendoly-demo.taaaac.eu",
        brandName: body.brandName || DEFAULT_VENDOLY_SHOWCASE_CONFIG.brandName,
        primaryColor: body.primaryColor || DEFAULT_VENDOLY_SHOWCASE_CONFIG.primaryColor,
        accentColor: body.accentColor || DEFAULT_VENDOLY_SHOWCASE_CONFIG.accentColor,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Vetrina Vendoly salvata con successo",
      config: body,
    });
  } catch (error) {
    console.error("Errore salvataggio vetrina Vendoly:", error);
    return NextResponse.json(
      { error: "Errore durante il salvataggio della vetrina" },
      { status: 500 }
    );
  }
}
