import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, verifyAdminPasswordOrPin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import qrcode from "qrcode";
import {
  generateTotpSecret,
  generateOtpauthUri,
  generateBackupCodes,
  verifyTotpCode,
  hashBackupCodes,
} from "@/lib/totp";

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

    const email = tenant?.contactEmail || "admin@vendoly.taaaac.eu";
    const secret = generateTotpSecret();
    const otpauthUri = generateOtpauthUri(email, secret, "Vendoly Store");
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUri, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    const backupCodes = generateBackupCodes(8);

    return NextResponse.json({
      secret,
      otpauthUri,
      qrCodeDataUrl,
      backupCodes,
    });
  } catch (error) {
    console.error("Errore setup MFA:", error);
    return NextResponse.json({ error: "Impossibile generare le chiavi MFA" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await isAdminAuthenticated();
    if (!isAuthed) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // ── ATTIVAZIONE MFA ──
    if (action === "ENABLE") {
      const { secret, code, backupCodes } = body;
      if (!secret || !code || !backupCodes || !Array.isArray(backupCodes)) {
        return NextResponse.json({ error: "Parametri incompleti" }, { status: 400 });
      }

      const isValid = verifyTotpCode(code, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Codice a 6 cifre errato o scaduto. Verifica l'orario del tuo telefono." },
          { status: 400 }
        );
      }

      const hashedCodes = await hashBackupCodes(backupCodes);

      await prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
          mfaBackupCodes: JSON.stringify(hashedCodes),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Autenticazione a due fattori (2FA) attivata con successo!",
      });
    }

    // ── DISATTIVAZIONE MFA ──
    if (action === "DISABLE") {
      const { password } = body;
      if (!password) {
        return NextResponse.json({ error: "Password richiesta per confermare la disattivazione" }, { status: 400 });
      }

      const passwordValid = verifyAdminPasswordOrPin(password);
      if (!passwordValid) {
        return NextResponse.json({ error: "Password errata" }, { status: 403 });
      }

      await prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Autenticazione a due fattori disattivata.",
      });
    }

    return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 });
  } catch (error) {
    console.error("Errore aggiornamento MFA:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento MFA" }, { status: 500 });
  }
}
