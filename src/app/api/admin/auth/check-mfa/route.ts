import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  checkBruteForce,
  recordFailedAttempt,
  getClientIp,
  logAccessAttempt,
} from "@/lib/security";
import { verifyAdminPasswordOrPin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const { password, pin, botField } = body;

    // 1. Honey-pot anti-bot invisibile
    if (botField) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 400 });
    }

    const secret = password || pin || "";
    if (!secret) {
      return NextResponse.json({ error: "Password richiesta" }, { status: 400 });
    }

    // 2. Protezione Anti-Brute-Force
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

    // 3. Controllo blocco account nel database
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

    // 4. Verifica Password
    const passwordMatch = verifyAdminPasswordOrPin(secret);

    if (!passwordMatch) {
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
        userAgent: req.headers.get("user-agent"),
        dettaglio: "Password errata",
      });

      if (fail.locked || lockedUntil) {
        return NextResponse.json(
          {
            error: "Troppi tentativi errati. Accesso sospeso per 15 minuti.",
            locked: true,
            retryAfter: 15 * 60,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "Password non valida o errata" }, { status: 401 });
    }

    // Password corretta!
    return NextResponse.json({
      success: true,
      mfaRequired: Boolean(tenant?.mfaEnabled && tenant?.mfaSecret),
    });
  } catch (error) {
    console.error("Errore check-mfa:", error);
    return NextResponse.json({ error: "Errore interno di verifica" }, { status: 500 });
  }
}
