import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caricaBuonoPubblico, condizioniBuono } from "@/lib/buono-pubblico";
import StampaAuto from "./StampaAuto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stampa buono",
  robots: { index: false, follow: false },
};

// Stampa del buono: A4 (con grafica del locale) oppure ricevuta da 80 mm per la stampante di cassa.
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
  const ricevuta = formato === "ricevuta";
  const cond = condizioniBuono(b);

  const css = ricevuta
    ? `@page { size: 80mm auto; margin: 4mm; } body { margin: 0; background: #fff; } .foglio { width: 72mm; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; color: #000; text-align: center; }`
    : `@page { size: A4; margin: 0; } body { margin: 0; background: #e5e7eb; } .foglio { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; font-family: Georgia, 'Times New Roman', serif; color: #111; }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `${css} @media print { .no-stampa { display: none !important; } body { background: #fff; } }` }} />
      <StampaAuto />

      {ricevuta ? (
        <div className="foglio" style={{ padding: "2mm 0" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{b.brand.nome}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>{b.motivoEtichetta}</div>
          <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
          {b.destinatario && <div style={{ fontSize: 11 }}>Per {b.destinatario}</div>}
          <div style={{ fontSize: 22, fontWeight: 900, margin: "4px 0" }}>{b.valore}</div>
          {b.messaggio && <div style={{ fontSize: 10, fontStyle: "italic" }}>“{b.messaggio}”</div>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.qr} alt="QR" style={{ width: "38mm", height: "38mm", margin: "6px auto", display: "block" }} />
          <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{b.codice}</div>
          <hr style={{ border: 0, borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ fontSize: 9, textAlign: "left", lineHeight: 1.35 }}>
            {cond.map((c) => (
              <div key={c}>• {c}</div>
            ))}
          </div>
          <div style={{ fontSize: 9, marginTop: 6 }}>{[b.brand.indirizzo, b.brand.telefono].filter(Boolean).join(" · ")}</div>
        </div>
      ) : (
        <div className="foglio">
          <div style={{ height: "52mm", background: `linear-gradient(135deg, ${b.brand.accento}, ${b.brand.secondario})`, color: "#fff", padding: "14mm 18mm", display: "flex", alignItems: "center", gap: "8mm" }}>
            {b.brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.brand.logoUrl} alt="" style={{ width: "24mm", height: "24mm", borderRadius: "50%", background: "#fff", objectFit: "cover" }} />
            ) : null}
            <div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{b.brand.nome}</div>
              <div style={{ fontSize: 15, opacity: 0.95, marginTop: 2 }}>{b.motivoEtichetta}</div>
            </div>
          </div>

          <div style={{ padding: "16mm 18mm", textAlign: "center" }}>
            {b.destinatario && <div style={{ fontSize: 18, color: "#555" }}>Per {b.destinatario}</div>}
            <div style={{ fontSize: 54, fontWeight: 700, margin: "6mm 0", color: b.brand.accento }}>{b.valore}</div>
            {b.messaggio && <div style={{ fontSize: 17, fontStyle: "italic", color: "#444", margin: "0 12mm 6mm" }}>“{b.messaggio}”</div>}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.qr} alt="QR del buono" style={{ width: "55mm", height: "55mm", margin: "6mm auto 2mm", display: "block" }} />
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{b.codice}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Presenta questo codice in cassa</div>

            <div style={{ marginTop: "14mm", textAlign: "left", fontSize: 12, color: "#444", borderTop: "1px solid #ddd", paddingTop: "5mm" }}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>Condizioni</div>
              {cond.map((c) => (
                <div key={c}>• {c}</div>
              ))}
            </div>
            <div style={{ marginTop: "8mm", fontSize: 12, color: "#777" }}>{[b.brand.indirizzo, b.brand.telefono].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
      )}
    </>
  );
}
