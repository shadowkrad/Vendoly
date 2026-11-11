import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caricaBuonoPubblico, condizioniBuono } from "@/lib/buono-pubblico";
import {
  BuonoRegaloCard,
} from "@/components/carta-grafica/CartaGraficaCanvas";
import StampaAuto from "./StampaAuto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stampa buono",
  robots: { index: false, follow: false },
};

// Stampa del buono: Cartoncino Regalo (210x99mm su A4, solo il buono: niente biglietto da visita), Buono Cartaceo, Certificato A4 oppure ricevuta da 80 mm per la cassa.
export default async function StampaBuonoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const { token } = await params;
  const { formato } = await searchParams;
  const b = await caricaBuonoPubblico(token);
  if (!b) notFound();

  const fmt =
    formato === "ricevuta"
      ? "ricevuta"
      : formato === "cartoncino"
      ? "cartoncino"
      : formato === "cartaceo"
      ? "cartaceo"
      : "a4";
  const cond = condizioniBuono(b);
  const { config, attivita } = b.cartaGrafica;

  const css =
    fmt === "ricevuta"
      ? `@page { size: 80mm auto; margin: 4mm; } body { margin: 0; background: #fff; } .foglio { width: 72mm; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #000; text-align: center; }`
      : `@page { size: A4 portrait; margin: 0; } body { margin: 0; background: #cbd5e1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .foglio { width: 210mm; min-height: 297mm; margin: 6mm auto; background: #fff; box-sizing: border-box; font-family: Georgia, 'Times New Roman', serif; color: #111; box-shadow: 0 12px 30px rgba(0,0,0,0.25); }`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `${css} @media print { .no-stampa { display: none !important; } body { background: #fff; } .foglio { margin: 0; box-shadow: none; } }`,
        }}
      />
      <StampaAuto />

      {/* Barra superiore di scelta rapida formato (nascosta in stampa) */}
      <div
        className="no-stampa"
        style={{
          background: "#0f172a",
          color: "#fff",
          padding: "10px 18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        <div>
          <strong>{b.brand.nome}</strong> — Stampa Buono{" "}
          <span style={{ color: "#fbbf24", fontWeight: 700 }}>
            Codice Identificativo: <code>{b.codice}</code>
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <a
            href={`/buono/${token}/stampa?formato=cartoncino`}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              background: fmt === "cartoncino" ? "#f59e0b" : "#1e293b",
              color: fmt === "cartoncino" ? "#0f172a" : "#e2e8f0",
            }}
          >
            🎁 Cartoncino Regalo (Precompilato)
          </a>
          <a
            href={`/buono/${token}/stampa?formato=cartaceo`}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              background: fmt === "cartaceo" ? "#f59e0b" : "#1e293b",
              color: fmt === "cartaceo" ? "#0f172a" : "#e2e8f0",
            }}
          >
            ✍️ Buono Cartaceo (con Codice ID)
          </a>
          <a
            href={`/buono/${token}/stampa?formato=a4`}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              background: fmt === "a4" ? "#f59e0b" : "#1e293b",
              color: fmt === "a4" ? "#0f172a" : "#e2e8f0",
            }}
          >
            📄 Certificato A4
          </a>
          <a
            href={`/buono/${token}/stampa?formato=ricevuta`}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
              background: fmt === "ricevuta" ? "#f59e0b" : "#1e293b",
              color: fmt === "ricevuta" ? "#0f172a" : "#e2e8f0",
            }}
          >
            🧾 Ricevuta 80mm
          </a>
        </div>
      </div>

      {fmt === "ricevuta" ? (
        <div className="foglio" style={{ padding: "2mm 0" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{b.brand.nome}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>{b.motivoEtichetta}</div>
          <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
          {b.destinatario && <div style={{ fontSize: 11 }}>Per {b.destinatario}</div>}
          <div style={{ fontSize: 22, fontWeight: 900, margin: "4px 0" }}>{b.valore}</div>
          {b.messaggio && <div style={{ fontSize: 10, fontStyle: "italic" }}>“{b.messaggio}”</div>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.qr}
            alt="QR"
            style={{ width: "38mm", height: "38mm", margin: "6px auto", display: "block" }}
          />
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>
            Codice Identificativo per scaricare il buono:
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 1.5,
              border: "1px solid #000",
              padding: "3px 6px",
              marginTop: 2,
              display: "inline-block",
            }}
          >
            {b.codice}
          </div>
          <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ fontSize: 9, textAlign: "left", lineHeight: 1.35 }}>
            {cond.map((c) => (
              <div key={c}>• {c}</div>
            ))}
          </div>
          <div style={{ fontSize: 9, marginTop: 6 }}>
            {[b.brand.indirizzo, b.brand.telefono].filter(Boolean).join(" · ")}
          </div>
        </div>
      ) : fmt === "cartoncino" || fmt === "cartaceo" ? (
        /* FORMATO CARTONCINO REGALO O CARTACEO (186x88mm su foglio A4 con guida di ritaglio + eventuale retro orari sotto) */
        <div className="foglio" style={{ padding: "16mm 12mm" }}>
          <div
            className="no-stampa"
            style={{
              fontSize: 11,
              color: "#64748b",
              textAlign: "center",
              marginBottom: "4mm",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ✂️ Ritaglia lungo il bordo tratteggiato (formato standard busta regalo 186 × 88 mm)
          </div>

          <div
            style={{
              width: "186mm",
              margin: "0 auto",
              border: "0.3mm dashed #94a3b8",
              padding: "2mm",
            }}
          >
            <BuonoRegaloCard
              config={config}
              attivita={attivita}
              buono={{
                codice: b.codice,
                motivoEtichetta: b.motivoEtichetta,
                valore: b.valore,
                saldoResiduo: b.saldoResiduo,
                importoIniziale: b.importoIniziale,
                tipoValore: b.tipoValore,
                destinatario: b.destinatario,
                acquirente: b.acquirente,
                messaggio: b.messaggio,
                qrDataUrl: b.qr,
                condizioni: cond,
                stato: b.stato,
              }}
              layout={fmt === "cartaceo" ? "cartaceo" : "cartoncino"}
            />
          </div>
        </div>
      ) : (
        /* FORMATO CERTIFICATO A4 COMPLETO CON TEMA ATTIVITÀ */
        <div className="foglio" style={{ padding: "14mm 16mm" }}>
          <BuonoRegaloCard
            config={config}
            attivita={attivita}
            buono={{
              codice: b.codice,
              motivoEtichetta: b.motivoEtichetta,
              valore: b.valore,
              saldoResiduo: b.saldoResiduo,
              importoIniziale: b.importoIniziale,
              tipoValore: b.tipoValore,
              destinatario: b.destinatario,
              acquirente: b.acquirente,
              messaggio: b.messaggio,
              stato: b.stato,
            }}
            layout="web"
          />

          <div
            style={{
              marginTop: "8mm",
              padding: "8mm",
              borderRadius: "6mm",
              border: `1px solid ${config.coloreDettaglio}`,
              background: config.coloreChiaro,
              textAlign: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.qr}
              alt="QR del buono"
              style={{
                width: "48mm",
                height: "48mm",
                margin: "0 auto 3mm",
                display: "block",
                background: "#fff",
                padding: "2mm",
                borderRadius: "3mm",
                border: `1.5px solid ${config.coloreDettaglio}`,
              }}
            />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "#555",
                marginBottom: 4,
              }}
            >
              Codice Identificativo per scaricare il buono:
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 3,
                color: config.coloreScuro,
              }}
            >
              {b.codice}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
              Presenta questo codice identificativo o il QR Code in cassa per scaricare il buono
            </div>
          </div>

          <div
            style={{
              marginTop: "8mm",
              fontSize: 12,
              color: "#333",
              borderTop: `1px solid ${config.coloreDettaglio}`,
              paddingTop: "4mm",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Condizioni di utilizzo</div>
            {cond.map((c) => (
              <div key={c} style={{ marginBottom: 2 }}>
                • {c}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "6mm", textAlign: "center", fontSize: 12, color: "#555" }}>
            <strong>{b.brand.nome}</strong>
            {b.brand.indirizzo ? ` · ${b.brand.indirizzo}` : ""}
            {b.brand.telefono ? ` · Tel. ${b.brand.telefono}` : ""}
          </div>
        </div>
      )}
    </>
  );
}
