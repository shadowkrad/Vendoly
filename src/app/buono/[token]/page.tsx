import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caricaBuonoPubblico, condizioniBuono } from "@/lib/buono-pubblico";
import { BuonoRegaloCard } from "@/components/carta-grafica/CartaGraficaCanvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Il tuo buono",
  robots: { index: false, follow: false },
};

const STATI: Record<string, { testo: string; cls: string }> = {
  RISCATTATA: { testo: "Buono già utilizzato", cls: "bg-gray-100 text-gray-700" },
  SCADUTA: { testo: "Buono scaduto", cls: "bg-amber-100 text-amber-800" },
  ANNULLATA: { testo: "Buono annullato", cls: "bg-rose-100 text-rose-800" },
};

// Pagina del buono: si apre dal link privato ricevuto (email, WhatsApp o QR stampato).
export default async function BuonoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await caricaBuonoPubblico(token);
  if (!b) notFound();

  const attivo = b.stato === "ATTIVA";
  const stato = STATI[b.stato];
  const cond = condizioniBuono(b);

  return (
    <main
      className="min-h-screen py-8 px-4"
      style={{
        background: `linear-gradient(160deg, ${b.cartaGrafica.config.coloreChiaro} 0%, #F8F5EE 100%)`,
      }}
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Card grafica coordinata al tema dell'attività */}
        <BuonoRegaloCard
          config={b.cartaGrafica.config}
          attivita={b.cartaGrafica.attivita}
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

        {stato && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold text-center ${stato.cls}`}>
            {stato.testo}
          </div>
        )}

        {attivo && (
          <section
            className="bg-white rounded-2xl border p-5 shadow-xs text-center"
            style={{ borderColor: `${b.cartaGrafica.config.coloreDettaglio}66` }}
          >
            <p className="text-xs text-gray-500 mb-2">Mostra questo codice in cassa</p>
            <div
              className="inline-block p-2 rounded-2xl border-2 bg-white"
              style={{ borderColor: b.cartaGrafica.config.coloreDettaglio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.qr} alt="QR del buono" className="w-44 h-44 mx-auto block" />
            </div>
            <p className="mt-2.5 font-mono font-bold text-lg tracking-widest text-gray-900">
              {b.codice}
            </p>
            <div className="mt-3">
              <a
                href={`/buono/${token}/stampa?formato=cartoncino`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                🖨️ Stampa Cartoncino Regalo
              </a>
            </div>
          </section>
        )}

        <section className="bg-white/95 rounded-2xl border border-gray-200/80 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Condizioni</h2>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            {cond.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <p className="text-center text-xs text-gray-600 font-medium">
          {b.brand.nome}
          {b.brand.indirizzo ? ` · ${b.brand.indirizzo}` : ""}
          {b.brand.telefono ? ` · Tel. ${b.brand.telefono}` : ""}
        </p>
      </div>
    </main>
  );
}
