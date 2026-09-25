/**
 * Taaaac Mailer - Dispatcher notifiche per Vendoly
 * Invia tramite Taaaac Cloud Mail Engine (predefinito) o SMTP proprietario
 */

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  senderName?: string;
  replyTo?: string;
  smtpConfig?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
    from?: string;
  };
}

export async function sendNotificationMail(
  params: SendMailParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  const coreUrls = [
    process.env.TAAAAC_INTERNAL_URL || "http://taaaac-core:3000",
    process.env.TAAAAC_CORE_URL || "https://taaaac.eu",
  ];

  const targetDomain =
    process.env.TAAAAC_TENANT_DOMAIN ||
    (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.includes("taaaac.eu")
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : "vendoly.taaaac.eu");

  let lastError = "Impossibile contattare il gateway email Taaaac";

  for (const baseUrl of coreUrls) {
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/internal/mail/send`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
        },
        body: JSON.stringify({
          domain: targetDomain,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
          senderName: params.senderName || "Vendoly Negozio Online",
          replyTo: params.replyTo,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        return { success: true, id: data.messageId };
      } else {
        lastError = data.error || `Errore HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[Taaaac Mailer Dev] Simulazione invio (Core offline): ${params.subject} -> ${params.to}`);
    return { success: true, id: "simulated-dev-" + Date.now() };
  }

  return { success: false, error: `Taaaac Mail Engine: ${lastError}` };
}
