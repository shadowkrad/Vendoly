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
        ragioneSociale: config.ragioneSociale || "",
        partitaIva: config.partitaIva || "",
        indirizzo: config.indirizzo || "",
        titolare: config.titolare || "",
        orariFeriali: config.orariFeriali || "09:30 – 13:00 / 15:30 – 19:30",
        orariSabato: config.orariSabato || "09:30 – 19:30 (Continuato)",
        orariDomenica: config.orariDomenica || "Chiuso",
        sogliaSpedizioneGratis: config.sogliaSpedizioneGratis ?? 50,
        costoSpedizioneStandard: config.costoSpedizioneStandard ?? 5.9,
        ritiroInSede: config.ritiroInSede ?? true,
        politicaReso: config.politicaReso || "Reso garantito entro 14 giorni lavorativi dalla data di ricezione dell'ordine per capi integri e con cartellino.",
        messaggioScontrino: config.messaggioScontrino || "Grazie per il tuo acquisto su Vendoly! Torna a trovarci.",
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
      ragioneSociale: "",
      partitaIva: "",
      indirizzo: "",
      titolare: "",
      orariFeriali: "09:30 – 13:00 / 15:30 – 19:30",
      orariSabato: "09:30 – 19:30 (Continuato)",
      orariDomenica: "Chiuso",
      sogliaSpedizioneGratis: 50,
      costoSpedizioneStandard: 5.9,
      ritiroInSede: true,
      politicaReso: "Reso garantito entro 14 giorni lavorativi dalla data di ricezione dell'ordine per capi integri e con cartellino.",
      messaggioScontrino: "Grazie per il tuo acquisto su Vendoly! Torna a trovarci.",
    });
  } catch (error) {
    console.error("Errore recupero impostazioni:", error);
    return NextResponse.json({ error: "Errore nel recupero impostazioni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      logoUrl,
      faviconUrl,
      primaryColor,
      accentColor,
      contactEmail,
      phone,
      ragioneSociale,
      partitaIva,
      indirizzo,
      titolare,
      orariFeriali,
      orariSabato,
      orariDomenica,
      sogliaSpedizioneGratis,
      costoSpedizioneStandard,
      ritiroInSede,
      politicaReso,
      messaggioScontrino,
    } = body;

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
        ...(ragioneSociale !== undefined && { ragioneSociale }),
        ...(partitaIva !== undefined && { partitaIva }),
        ...(indirizzo !== undefined && { indirizzo }),
        ...(titolare !== undefined && { titolare }),
        ...(orariFeriali !== undefined && { orariFeriali }),
        ...(orariSabato !== undefined && { orariSabato }),
        ...(orariDomenica !== undefined && { orariDomenica }),
        ...(sogliaSpedizioneGratis !== undefined && {
          sogliaSpedizioneGratis: parseFloat(sogliaSpedizioneGratis) || 0,
        }),
        ...(costoSpedizioneStandard !== undefined && {
          costoSpedizioneStandard: parseFloat(costoSpedizioneStandard) || 0,
        }),
        ...(ritiroInSede !== undefined && { ritiroInSede: Boolean(ritiroInSede) }),
        ...(politicaReso !== undefined && { politicaReso }),
        ...(messaggioScontrino !== undefined && { messaggioScontrino }),
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
        ragioneSociale: ragioneSociale || null,
        partitaIva: partitaIva || null,
        indirizzo: indirizzo || null,
        titolare: titolare || null,
        orariFeriali: orariFeriali || "09:30 – 13:00 / 15:30 – 19:30",
        orariSabato: orariSabato || "09:30 – 19:30 (Continuato)",
        orariDomenica: orariDomenica || "Chiuso",
        sogliaSpedizioneGratis: parseFloat(sogliaSpedizioneGratis) || 50,
        costoSpedizioneStandard: parseFloat(costoSpedizioneStandard) || 5.9,
        ritiroInSede: ritiroInSede !== undefined ? Boolean(ritiroInSede) : true,
        politicaReso:
          politicaReso ||
          "Reso garantito entro 14 giorni lavorativi dalla data di ricezione dell'ordine per capi integri e con cartellino.",
        messaggioScontrino: messaggioScontrino || "Grazie per il tuo acquisto su Vendoly! Torna a trovarci.",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error("Errore salvataggio impostazioni:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
