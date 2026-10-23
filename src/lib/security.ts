import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "./db";
import { sendNotificationMail } from "./taaaac-mailer";

// ============================================================================
// 1. IN-MEMORY BRUTE FORCE PROTECTOR (Sliding Window & Account Lock)
// ============================================================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const ipAttempts = new Map<string, RateLimitRecord>();
const accountAttempts = new Map<string, RateLimitRecord>();

const MAX_IP_ATTEMPTS = 5;
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minuti
const MAX_ACCOUNT_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minuti

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipAttempts.entries()) {
      if (now - record.firstAttemptAt > IP_WINDOW_MS && (!record.lockedUntil || now > record.lockedUntil)) {
        ipAttempts.delete(ip);
      }
    }
    for (const [key, record] of accountAttempts.entries()) {
      if (now - record.firstAttemptAt > IP_WINDOW_MS && (!record.lockedUntil || now > record.lockedUntil)) {
        accountAttempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function getClientIp(req?: NextRequest | Request | Headers | null): string {
  if (!req) return "127.0.0.1";
  let headers: Headers;
  if ("headers" in req && req.headers instanceof Headers) {
    headers = req.headers;
  } else if ("headers" in req && typeof req.headers === "object") {
    headers = new Headers(req.headers as any);
  } else {
    headers = req as Headers;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const list = forwarded.split(",");
    return list[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export function checkBruteForce(
  ip: string,
  accountKey: string = "admin"
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number; locked: boolean } {
  const now = Date.now();

  const ipRec = ipAttempts.get(ip);
  if (ipRec && ipRec.lockedUntil && now < ipRec.lockedUntil) {
    const retryAfter = Math.ceil((ipRec.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter, locked: true };
  }

  const accRec = accountAttempts.get(accountKey);
  if (accRec && accRec.lockedUntil && now < accRec.lockedUntil) {
    const retryAfter = Math.ceil((accRec.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter, locked: true };
  }

  const currentAttempts = Math.max(ipRec?.attempts || 0, accRec?.attempts || 0);
  const remaining = Math.max(0, MAX_IP_ATTEMPTS - currentAttempts);

  return { allowed: true, remainingAttempts: remaining, retryAfterSeconds: 0, locked: false };
}

export function recordFailedAttempt(
  ip: string,
  accountKey: string = "admin"
): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  let ipRec = ipAttempts.get(ip);
  if (!ipRec || now - ipRec.firstAttemptAt > IP_WINDOW_MS) {
    ipRec = { attempts: 1, firstAttemptAt: now, lockedUntil: null };
  } else {
    ipRec.attempts += 1;
  }
  if (ipRec.attempts >= MAX_IP_ATTEMPTS) {
    ipRec.lockedUntil = now + LOCK_DURATION_MS;
  }
  ipAttempts.set(ip, ipRec);

  let accRec = accountAttempts.get(accountKey);
  if (!accRec || now - accRec.firstAttemptAt > IP_WINDOW_MS) {
    accRec = { attempts: 1, firstAttemptAt: now, lockedUntil: null };
  } else {
    accRec.attempts += 1;
  }
  if (accRec.attempts >= MAX_ACCOUNT_ATTEMPTS) {
    accRec.lockedUntil = now + LOCK_DURATION_MS;
  }
  accountAttempts.set(accountKey, accRec);

  const isLocked = Boolean(ipRec.lockedUntil || accRec.lockedUntil);
  return {
    locked: isLocked,
    retryAfterSeconds: isLocked ? Math.ceil(LOCK_DURATION_MS / 1000) : 0,
  };
}

export function resetBruteForceAttempts(ip: string, accountKey: string = "admin") {
  ipAttempts.delete(ip);
  accountAttempts.delete(accountKey);
}

// ============================================================================
// 2. DEVICE FINGERPRINTING & USER-AGENT PARSER
// ============================================================================

export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop";
  summary: string;
}

export function parseDevice(userAgent?: string | null): ParsedDeviceInfo {
  if (!userAgent) {
    return { browser: "Browser sconosciuto", os: "Dispositivo sconosciuto", deviceType: "desktop", summary: "Dispositivo Web" };
  }

  const ua = userAgent.toLowerCase();

  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = "mobile";
  }

  let os = "Sconosciuto";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone")) os = "iOS (iPhone)";
  else if (ua.includes("ipad")) os = "iPadOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  let browser = "Browser Web";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome") && !ua.includes("edg/")) browser = "Google Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Apple Safari";
  else if (ua.includes("firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  const summary = `${browser} su ${os} (${deviceType === "mobile" ? "Smartphone" : deviceType === "tablet" ? "Tablet" : "Computer"})`;

  return { browser, os, deviceType, summary };
}

// ============================================================================
// 3. TRUSTED DEVICES & SECURITY EMAIL NOTIFICATION
// ============================================================================

export async function checkAndRegisterTrustedDevice(params: {
  userEmail?: string | null;
  ip: string;
  userAgent?: string | null;
  existingDeviceId?: string | null;
}): Promise<{ isNewDevice: boolean; deviceId: string }> {
  const { userEmail, ip, userAgent, existingDeviceId } = params;
  const deviceInfo = parseDevice(userAgent);

  if (existingDeviceId) {
    const device = await prisma.trustedDevice.findUnique({
      where: { id: existingDeviceId },
    });

    if (device) {
      await prisma.trustedDevice.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          ipAddress: ip,
        },
      });
      return { isNewDevice: false, deviceId: device.id };
    }
  }

  const deviceHash = crypto
    .createHash("sha256")
    .update(`${deviceInfo.browser}|${deviceInfo.os}|${deviceInfo.deviceType}|${userAgent || ""}`)
    .digest("hex")
    .substring(0, 32);

  const existingByHash = await prisma.trustedDevice.findUnique({
    where: { deviceHash },
  });

  if (existingByHash) {
    await prisma.trustedDevice.update({
      where: { id: existingByHash.id },
      data: {
        lastSeenAt: new Date(),
        ipAddress: ip,
      },
    });
    return { isNewDevice: false, deviceId: existingByHash.id };
  }

  const newDevice = await prisma.trustedDevice.create({
    data: {
      deviceHash,
      deviceName: deviceInfo.summary,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress: ip,
    },
  });

  // Se è configurata un'email per le notifiche, invia l'allerta
  const targetEmail = userEmail || process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL;

  if (targetEmail) {
    const dataOra = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://barberly.taaaac.eu";

    try {
      await sendNotificationMail({
        to: targetEmail,
        subject: `🚨 [Sicurezza Vendoly] Nuovo accesso rilevato (${deviceInfo.os})`,
        text: `Abbiamo rilevato un nuovo accesso al tuo gestionale Vendoly.\n\nData e ora: ${dataOra}\nDispositivo: ${deviceInfo.summary}\nIndirizzo IP: ${ip}\n\nSe sei stato tu ad accedere, non devi fare nulla.\nSe NON riconosci questo accesso, cambia subito la tua password o contatta il supporto tecnico.\n\nTeam Vendoly & Taaaac`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <span style="background: #fef2f2; color: #dc2626; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #fecaca;">
                Avviso di Sicurezza
              </span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
              Nuovo accesso al tuo gestionale Vendoly
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
              È stato rilevato un nuovo accesso al profilo gestionale da un dispositivo o browser non registrato in precedenza.
            </p>

            <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; font-size: 13px;">
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; width: 35%;">Data e Ora</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${dataOra}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Dispositivo</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${deviceInfo.summary}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Indirizzo IP</td>
                <td style="padding: 12px 16px; color: #0f172a; font-family: monospace;">${ip}</td>
              </tr>
            </table>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 500;">
                ✓ Se hai effettuato tu questo accesso, non devi fare nulla. Il dispositivo è stato memorizzato come autorizzato.
              </p>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                ⚠️ <strong>Non riconosci questa attività?</strong> Cambia subito la tua password di accesso o accedi al pannello di sicurezza per disconnettere tutti i dispositivi remoti.
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${appUrl}/login" style="background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block;">
                Vai al Gestionale →
              </a>
            </div>
          </div>
        `,
      });
    } catch (err: any) {
      console.warn("[Security] Invio email nuovo dispositivo fallito:", err?.message || err);
    }
  }

  return { isNewDevice: true, deviceId: newDevice.id };
}

// ============================================================================
// 4. ACCESS AUDIT LOGGING
// ============================================================================

export async function logAccessAttempt(params: {
  esito: "SUCCESS" | "FAILED_PASSWORD" | "FAILED_MFA" | "LOCKED" | "BOT_BLOCKED";
  ip: string;
  userAgent?: string | null;
  mfaUsed?: boolean;
  dettaglio?: string | null;
}) {
  const { esito, ip, userAgent, mfaUsed, dettaglio } = params;
  const deviceInfo = parseDevice(userAgent);

  try {
    await prisma.accessLog.create({
      data: {
        esito,
        ipAddress: ip,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        mfaUsed: Boolean(mfaUsed),
        dettaglio: dettaglio || null,
      },
    });
  } catch (err: any) {
    console.error("[Security] Errore salvataggio AccessLog:", err?.message || err);
  }
}
