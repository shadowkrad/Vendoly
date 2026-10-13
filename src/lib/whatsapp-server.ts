/**
 * WhatsApp Server Helper per Vendoly.
 * Inoltra le notifiche automatiche al micro-servizio centralizzato Taaaac Core.
 */

export interface InviaNotificaWhatsAppCloudOptions {
  recipient: string;
  text?: string;
  templateName?: string;
  templateParameters?: Record<string, string>;
  messageType?: "STATO_ORDINE" | "PROMEMORIA" | "CONFERMA" | "CUSTOM";
}

export async function inviaNotificaWhatsAppCloud(
  options: InviaNotificaWhatsAppCloudOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const coreUrls = [
      process.env.TAAAAC_INTERNAL_URL || "http://taaaac-core:3000",
      process.env.TAAAAC_CORE_URL || "https://taaaac.eu",
    ];

    const targetDomain =
      process.env.TAAAAC_TENANT_DOMAIN ||
      (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.includes("taaaac.eu")
        ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
        : "vendoly.taaaac.eu");

    let lastError = "Impossibile contattare Taaaac Communication Hub";

    for (const baseUrl of coreUrls) {
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/internal/whatsapp/send`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
          },
          body: JSON.stringify({
            tenantDomain: targetDomain,
            recipient: options.recipient,
            text: options.text,
            templateName: options.templateName,
            templateParameters: options.templateParameters,
            messageType: options.messageType || "STATO_ORDINE",
          }),
          signal: AbortSignal.timeout(6000),
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          return { success: true, messageId: data.messageId };
        } else {
          lastError = data.error || `HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastError = err.message || "Errore connessione Core";
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[Vendoly WhatsApp Dev] Fallback simulazione: ${options.recipient}`);
      return { success: true, messageId: `dev-simulated-${Date.now()}` };
    }

    return { success: false, error: lastError };
  } catch (error: any) {
    console.error("[Vendoly WhatsApp Cloud Error]:", error);
    return { success: false, error: error.message };
  }
}
