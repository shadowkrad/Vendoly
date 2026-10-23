import { NextRequest, NextResponse } from "next/server";
import { setAdminSession, verifyAdminPasswordOrPin, isDemoEnvironment } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyTotpCode, verifyAndConsumeBackupCode } from "@/lib/totp";
import {
  checkBruteForce,
  recordFailedAttempt,
  resetBruteForceAttempts,
  checkAndRegisterTrustedDevice,
  logAccessAttempt,
  getClientIp,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const host = req.headers.get("host");
    const userAgent = req.headers.get("user-agent");

    // 1. Honey-pot invisibile anti-bot
    if (body.botField) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 400 });
    }

    // 2. Accesso 1-Click per ambiente Demo
    if (body.demo) {
      if (!isDemoEnvironment(host)) {
        return NextResponse.json(
          { error: "Accesso demo non consentito in questo ambiente" },
          { status: 403 }
        );
      }
      await setAdminSession();
      return NextResponse.json({ success: true, isDemo: true });
    }

    // 3. Controllo Anti-Brute-Force
    const bf = checkBruteForce(ip, "admin");
    if (!bf.allowed) {
      return NextResponse.json(
        {
          error: `Troppi tentativi falliti. Riprova tra ${Math.ceil(bf.retryAfterSeconds / 60)} minuti.`,
          locked: true,
          retryAfter: bf.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Controllo stato blocco tenant
    const tenant = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (tenant?.lockedUntil && new Date() < tenant.lockedUntil) {
      const diffSec = Math.ceil((tenant.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Accesso temporaneamente sospeso per sicurezza. Riprova tra ${Math.ceil(diffSec / 60)} minuti.`,
          locked: true,
          retryAfter: diffSec,
        },
        { status: 429 }
      );
    }

    // 5. Accesso con Password Master o PIN
    const secret = body.password || body.pin || "";
    if (!secret || !verifyAdminPasswordOrPin(secret)) {
      const fail = recordFailedAttempt(ip, "admin");
      const currentAttempts = (tenant?.failedLoginAttempts || 0) + 1;
      const lockedUntil = currentAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      if (tenant) {
        await prisma.tenantLocalCache.update({
          where: { id: "singleton" },
          data: { failedLoginAttempts: currentAttempts, lockedUntil },
        });
      }

      await logAccessAttempt({
        esito: "FAILED_PASSWORD",
        ip,
        userAgent,
        dettaglio: "Password errata",
      });

      return NextResponse.json(
        {
          error: "Password non valida o errata",
          locked: fail.locked,
        },
        { status: 401 }
      );
    }

    // 6. Verifica MFA / 2FA se attiva
    if (tenant?.mfaEnabled && tenant?.mfaSecret) {
      const mfaCode = body.mfaCode as string | undefined;
      if (!mfaCode) {
        return NextResponse.json(
          { error: "MFA_REQUIRED", mfaRequired: true },
          { status: 403 }
        );
      }

      let mfaValid = false;
      const cleanCode = mfaCode.trim().replace(/\s/g, "");

      if (/^\d{6}$/.test(cleanCode)) {
        mfaValid = verifyTotpCode(cleanCode, tenant.mfaSecret);
      }

      if (!mfaValid && tenant.mfaBackupCodes) {
        const backupRes = await verifyAndConsumeBackupCode(cleanCode, tenant.mfaBackupCodes);
        if (backupRes.valid) {
          mfaValid = true;
          await prisma.tenantLocalCache.update({
            where: { id: "singleton" },
            data: { mfaBackupCodes: backupRes.remainingCodesJson },
          });
        }
      }

      if (!mfaValid) {
        recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_MFA",
          ip,
          userAgent,
          mfaUsed: true,
          dettaglio: "Codice 2FA o di emergenza errato",
        });
        return NextResponse.json(
          { error: "Codice di sicurezza non valido o scaduto." },
          { status: 401 }
        );
      }
    }

    // Accesso autorizzato con successo!
    resetBruteForceAttempts(ip, "admin");

    if (tenant && (tenant.failedLoginAttempts > 0 || tenant.lockedUntil)) {
      await prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Verifica / registrazione dispositivo fidato
    const existingDeviceId = req.cookies.get("taaaac_device_id")?.value;
    const deviceResult = await checkAndRegisterTrustedDevice({
      userEmail: tenant?.contactEmail,
      ip,
      userAgent,
      existingDeviceId,
    });

    await logAccessAttempt({
      esito: "SUCCESS",
      ip,
      userAgent,
      mfaUsed: Boolean(tenant?.mfaEnabled),
    });

    await setAdminSession();

    const response = NextResponse.json({ success: true });

    // Salva cookie persistente dispositivo fidato per 1 anno
    response.cookies.set("taaaac_device_id", deviceResult.deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione" },
      { status: 500 }
    );
  }
}
