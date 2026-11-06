import { descriviValore, ETICHETTA_MOTIVO } from "@/lib/buoni";
import { condizioniBuono } from "@/lib/buono-pubblico";

function esc(s: string | null | undefined): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Email del buono: valore, codice, scadenza e link alla pagina con il QR. Linguaggio semplice, nessun gergo tecnico. */
export function templateEmailBuono(dati: {
  nomeSalone: string;
  nomeDestinatario?: string | null;
  buono: {
    motivo: string;
    tipoValore: string;
    importoIniziale: number;
    saldoResiduo: number;
    percentuale: number | null;
    descrizioneServizio: string | null;
    spesaMinima: number | null;
    usoParziale: boolean;
    dataScadenza: Date | null;
    codice: string;
    beneficiarioMessaggio: string | null;
  };
  link: string;
  colore: string;
}) {
  const { buono } = dati;
  const salone = esc(dati.nomeSalone);
  const colore = /^#[0-9a-fA-F]{6}$/.test(dati.colore) ? dati.colore : "#ec4899";
  const tipo = esc(ETICHETTA_MOTIVO[buono.motivo as keyof typeof ETICHETTA_MOTIVO] || "Buono");
  const valore = esc(descriviValore(buono));
  const saluto = dati.nomeDestinatario ? `Ciao ${esc(dati.nomeDestinatario)},` : "Ciao,";
  const condizioni = condizioniBuono(buono)
    .map((c) => `<li style="margin: 2px 0;">${esc(c)}</li>`)
    .join("");

  return {
    subject: `Il tuo buono di ${dati.nomeSalone}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff;">
        <h2 style="color: ${colore}; margin-top: 0;">${tipo}</h2>
        <p style="color: #374151; font-size: 15px;">${saluto}</p>
        <p style="color: #4b5563; font-size: 14px;"><strong>${salone}</strong> ti ha riservato questo buono:</p>
        <div style="text-align: center; margin: 20px 0; padding: 20px; border-radius: 14px; background: ${colore}15; border: 1px solid ${colore}55;">
          <div style="font-size: 30px; font-weight: bold; color: ${colore};">${valore}</div>
          ${buono.beneficiarioMessaggio ? `<p style="color:#4b5563; font-style: italic; margin: 10px 0 0;">“${esc(buono.beneficiarioMessaggio)}”</p>` : ""}
          <div style="margin-top: 14px; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #111827;">${esc(buono.codice)}</div>
        </div>
        <p style="text-align: center; margin: 22px 0;">
          <a href="${esc(dati.link)}" style="background: ${colore}; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Apri il buono</a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Mostra il codice o il QR che trovi aprendo il buono quando vieni da noi.</p>
        <ul style="color: #6b7280; font-size: 12px; padding-left: 18px; margin-top: 6px;">${condizioni}</ul>
      </div>
    `,
  };
}
