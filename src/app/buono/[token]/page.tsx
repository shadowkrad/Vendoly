import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caricaBuonoPubblico, condizioniBuono } from "@/lib/buono-pubblico";

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

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div
          className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${b.brand.accento}, ${b.brand.secondario})` }}
        >
          <div className="flex items-center gap-3">
            {b.brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.brand.logoUrl} alt="" className="w-12 h-12 rounded-full bg-white object-cover" />
            ) : null}
            <div>
              <div className="text-lg font-extrabold leading-tight">{b.brand.nome}</div>
              <div className="text-xs opacity-90">{b.motivoEtichetta}</div>
            </div>
          </div>
          {b.destinatario && <div className="mt-6 text-sm opacity-90">Per {b.destinatario}</div>}
          <div className={`${b.destinatario ? "mt-1" : "mt-6"} text-4xl font-black leading-tight`}>{b.valore}</div>
          {b.tipoValore === "IMPORTO" && b.saldoResiduo !== b.importoIniziale && attivo && (
            <div className="mt-1 text-sm opacity-95">Credito residuo: {b.saldoResiduo.toFixed(2)} €</div>
          )}
          {b.messaggio && <p className="mt-4 text-sm italic opacity-95">“{b.messaggio}”</p>}
        </div>

        {stato && <div className={`rounded-2xl px-4 py-3 text-sm font-semibold text-center ${stato.cls}`}>{stato.testo}</div>}

        {attivo && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs text-center">
            <p className="text-xs text-gray-500 mb-2">Mostra questo codice in cassa</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.qr} alt="QR del buono" className="w-44 h-44 mx-auto" />
            <p className="mt-2 font-mono font-bold text-lg tracking-wider text-gray-900">{b.codice}</p>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Condizioni</h2>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            {condizioniBuono(b).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <p className="text-center text-[11px] text-gray-400">
          {b.brand.nome}
          {b.brand.indirizzo ? ` · ${b.brand.indirizzo}` : ""}
          {b.brand.telefono ? ` · ${b.brand.telefono}` : ""}
        </p>
      </div>
    </main>
  );
}
