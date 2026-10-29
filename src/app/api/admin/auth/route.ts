import { NextRequest, NextResponse } from "next/server";
import { setAdminSession, verifyAdminPasswordOrPin, isDemoEnvironment } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  checkBruteForce,
  recordFailedAttempt,
  resetBruteForceAttempts,
  logAccessAttempt,
  getClientIp,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const host = req.headers.get("host") || "";
    const userAgent = req.headers.get("user-agent");

    // 1. Honey-pot invisibile anti-bot
    if (body.botField) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 400 });
    }

    // 2. Accesso 1-Click per ambiente Demo (Vercel)
    if (body.demo) {
      if (!isDemoEnvironment(host)) {
        return NextResponse.json(
          { error: "Accesso demo non consentito in questo ambiente" },
          { status: 403 }
        );
      }
      await setAdminSession();
      return NextResponse.json({ success: true, isDemo: true, role: "ADMIN" });
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

    // 4. Controllo stato blocco temporaneo tenant
    const tenantCache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (tenantCache?.lockedUntil && new Date() < tenantCache.lockedUntil) {
      const diffSec = Math.ceil((tenantCache.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Accesso temporaneamente sospeso per sicurezza. Riprova tra ${Math.ceil(diffSec / 60)} minuti.`,
          locked: true,
          retryAfter: diffSec,
        },
        { status: 429 }
      );
    }

    let authSuccess = false;
    let authRole = "ADMIN";
    let operatorName = "Titolare";

    // ── MODALITÀ A: ACCESSO TITOLARE CON EMAIL + PASSWORD ──
    if (body.email && body.password) {
      const cleanEmail = String(body.email).trim().toLowerCase();
      const rawPassword = String(body.password);
      const coreApiUrl = process.env.TAAAAC_CORE_API_URL?.trim() || "https://taaaac.eu";
      const tenantDomain = process.env.TAAAAC_TENANT_DOMAIN || host;
      const subdomain = tenantDomain ? tenantDomain.split(".")[0].toLowerCase() : null;

      // 1. Verifica centralizzata su Taaaac Core
      try {
        const coreRes = await fetch(`${coreApiUrl}/api/internal/auth/verify-tenant-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: rawPassword,
            subdomain,
          }),
        });

        if (coreRes.ok) {
          const coreData = await coreRes.json();
          if (coreData.valid) {
            authSuccess = true;
            authRole = coreData.user?.role || "ADMIN";
            operatorName = coreData.user?.name || cleanEmail;
          }
        }
      } catch (err) {
        console.warn("Verifica centralizzata Taaaac Core non disponibile, provo fallback locale:", err);
      }

      // 2. Fallback locale se offline o credenziali d'emergenza
      if (!authSuccess && verifyAdminPasswordOrPin(rawPassword)) {
        authSuccess = true;
        authRole = "ADMIN";
        operatorName = "Amministratore Negozio";
      }

      if (!authSuccess) {
        const fail = recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_PASSWORD",
          ip,
          userAgent,
          dettaglio: `Tentativo errato per email: ${cleanEmail}`,
        });

        return NextResponse.json(
          {
            error: "Email o password errati. Verifica le credenziali ricevute via email.",
            locked: fail.locked,
          },
          { status: 401 }
        );
      }
    }
    // ── MODALITÀ B: ACCESSO COLLABORATORE CON PIN TOUCH ──
    else if (body.pin) {
      const cleanPin = String(body.pin).trim();
      const masterPin = process.env.ADMIN_PIN?.trim();

      if (masterPin && cleanPin === masterPin) {
        authSuccess = true;
        authRole = "STAFF";
        operatorName = "Staff Negozio";
      } else if (verifyAdminPasswordOrPin(cleanPin)) {
        authSuccess = true;
        authRole = "ADMIN";
        operatorName = "Postazione Cassa";
      } else {
        const fail = recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_PASSWORD",
          ip,
          userAgent,
          dettaglio: "PIN collaboratore non riconosciuto",
        });
        return NextResponse.json(
          { error: "PIN non valido o non riconosciuto.", locked: fail.locked },
          { status: 401 }
        );
      }
    }
    // ── MODALITÀ C: COMPATIBILITÀ RETROATTIVA (SOLO PASSWORD MASTER) ──
    else if (body.password) {
      const rawPassword = String(body.password);
      if (verifyAdminPasswordOrPin(rawPassword)) {
        authSuccess = true;
        authRole = "ADMIN";
        operatorName = "Amministratore";
      } else {
        const fail = recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_PASSWORD",
          ip,
          userAgent,
          dettaglio: "Password non valida",
        });
        return NextResponse.json(
          { error: "Password errata.", locked: fail.locked },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Inserisci email e password per accedere." },
        { status: 400 }
      );
    }

    // 5. Successo: Reset tentativi brute-force
    resetBruteForceAttempts(ip, "admin");
    if (tenantCache && tenantCache.failedLoginAttempts > 0) {
      await prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // 6. Imposta sessione
    await setAdminSession();

    // 7. Log accesso riuscito
    await logAccessAttempt({
      esito: "SUCCESS",
      ip,
      userAgent,
      dettaglio: `Login effettuato con successo (${authRole} - ${operatorName})`,
    });

    return NextResponse.json({
      success: true,
      role: authRole,
      operator: operatorName,
    });
  } catch (err: any) {
    console.error("Errore API login Vendoly:", err);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
