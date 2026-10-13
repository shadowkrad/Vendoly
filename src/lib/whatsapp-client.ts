/**
 * WhatsApp Client Helper per Vendoly (E-commerce, Negozio & Spedizioni).
 * Client-safe, non carica Prisma o runtime server-side.
 */
import { buildWhatsAppTrackingMessage } from "./tracking-utils";

export { buildWhatsAppTrackingMessage };

export function formattaNumeroWhatsApp(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return "39" + digits;
  }
  return digits;
}

export function generaLinkWhatsApp(phone: string, message: string): string {
  const cleanPhone = formattaNumeroWhatsApp(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function apriWhatsAppWeb(phone: string, message: string): void {
  if (typeof window === "undefined") return;
  const url = generaLinkWhatsApp(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function generaMessaggioOrdineProntoRitiro(dati: {
  negozio: string;
  nomeCliente: string;
  numeroOrdine: string;
}): string {
  return `🛍️ Ciao ${dati.nomeCliente}! Il tuo ordine #${dati.numeroOrdine} è pronto per essere ritirato presso ${dati.negozio}. Ti aspettiamo in negozio!`;
}

export function generaMessaggioOrdineRicevuto(dati: {
  negozio: string;
  nomeCliente: string;
  numeroOrdine: string;
  totale?: string;
}): string {
  let msg = `🛍️ Ciao ${dati.nomeCliente}! Abbiamo ricevuto il tuo ordine #${dati.numeroOrdine} su ${dati.negozio}.`;
  if (dati.totale) msg += ` Totale: ${dati.totale}.`;
  msg += ` Ti aggiorneremo appena il pacco sarà pronto! A presto.`;
  return msg;
}
