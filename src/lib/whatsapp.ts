/**
 * Helper WhatsApp (link wa.me) usato dal FloatingWhatsAppWidget della vetrina.
 */

export function formattaNumeroWhatsApp(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `39${digits}`;
  }
  return digits;
}

export function generaLinkWhatsApp(phone: string, message: string): string {
  const normalized = formattaNumeroWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}
