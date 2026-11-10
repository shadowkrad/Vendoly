import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calcolaHashLogoTessera } from "@/lib/pwa-icon-version";
import { leggiRegole } from "@/lib/fidelity";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AggiungiAllaHome from "./AggiungiAllaHome";

export const dynamic = "force-dynamic";

// Titolo, icona (logo dell'attivita') e manifest propri della tessera: servono per "Aggiungi alla schermata Home"
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const imp = await prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const nome = imp?.brandName || "Tessera fedeltà";
  const accento = imp?.accentColor || "#d97706";
  const v = calcolaHashLogoTessera(imp?.logoUrl, accento, nome);
  return {
    title: `${nome} — Tessera fedeltà`,
    robots: { index: false, follow: false },
    manifest: `/tessera/${token}/manifest.webmanifest`,
    icons: {
      icon: [{ url: `/tessera/${token}/icona?size=192&v=${v}`, sizes: "192x192", type: "image/png" }],
      apple: [{ url: `/tessera/${token}/icona?size=180&v=${v}`, sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: { capable: true, title: nome.length > 14 ? nome.slice(0, 14) : nome, statusBarStyle: "default" },
  };
}

// Tessera fedeltà digitale del cliente: si apre dal link personale che l'attività gli ha dato.
// Mostra solo il nome di battesimo, i punti, i premi e gli ultimi movimenti.
export default async function TesseraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const cliente = await prisma.customer.findUnique({
    where: { loyaltyToken: token },
    select: {
      id: true,
      firstName: true,
      loyaltyPoints: true,
      pointsMovements: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!cliente) notFound();

  const [imp, regole] = await Promise.all([
    prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } }),
    leggiRegole(),
  ]);
  if (!regole.enabled) notFound();

  const accento = imp?.accentColor || "#d97706";
  const secondario = imp?.primaryColor || "#0f172a";
  const premi = [...regole.rewards].sort((a, b) => a.pointsRequired - b.pointsRequired);
  const prossimo = premi.find((p) => p.pointsRequired > cliente.loyaltyPoints);
  const mancano = prossimo ? prossimo.pointsRequired - cliente.loyaltyPoints : 0;
  const base = prossimo ? (premi[premi.indexOf(prossimo) - 1]?.pointsRequired ?? 0) : 0;
  const percentuale = prossimo
    ? Math.max(4, Math.min(100, Math.round(((cliente.loyaltyPoints - base) / (prossimo.pointsRequired - base)) * 100)))
    : 100;

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div
          className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accento}, ${secondario})` }}
        >
          <div className="flex items-center gap-3">
            {imp?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imp.logoUrl} alt="" className="w-12 h-12 rounded-full bg-white object-cover" />
            ) : null}
            <div>
              <div className="text-lg font-extrabold leading-tight">{imp?.brandName || "Tessera fedeltà"}</div>
              <div className="text-xs opacity-90">Tessera fedeltà</div>
            </div>
          </div>
          <div className="mt-6 text-sm opacity-90">Ciao {cliente.firstName},</div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black leading-none">{cliente.loyaltyPoints}</span>
            <span className="text-lg font-bold pb-1">punti</span>
          </div>
          {prossimo ? (
            <div className="mt-4">
              <div className="h-2.5 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: `${percentuale}%` }} />
              </div>
              <div className="text-xs mt-1.5 opacity-95">
                Ti mancano <b>{mancano}</b> punti per: {prossimo.name}
              </div>
            </div>
          ) : premi.length > 0 ? (
            <div className="mt-4 text-xs opacity-95">Hai raggiunto tutti i premi: chiedi in cassa!</div>
          ) : null}
        </div>

        <AggiungiAllaHome accento={accento} nome={imp?.brandName || "questa attività"} />

        {premi.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-3">I premi</h2>
            <ul className="space-y-2">
              {premi.map((p) => {
                const raggiunto = cliente.loyaltyPoints >= p.pointsRequired;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className={raggiunto ? "font-semibold text-gray-900" : "text-gray-500"}>
                      {raggiunto ? "✓ " : ""}
                      {p.name}
                    </span>
                    <span
                      className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={
                        raggiunto
                          ? { background: accento, color: "#fff" }
                          : { background: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {p.pointsRequired} pt
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-gray-400 mt-3">Per usare un premio mostra questa pagina in cassa.</p>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Ultimi movimenti</h2>
          {cliente.pointsMovements.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun movimento ancora.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {cliente.pointsMovements.map((m) => (
                <li key={m.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="text-gray-800">{m.descrizione}</div>
                    <div className="text-[11px] text-gray-400">
                      {format(m.createdAt, "d MMMM yyyy", { locale: it })}
                    </div>
                  </div>
                  <span className={`font-bold ${m.tipo === "ACCREDITO" ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.tipo === "ACCREDITO" ? "+" : "−"}
                    {m.punti}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-gray-400">
          {imp?.brandName}
          {imp?.phone ? ` · ${imp.phone}` : ""}
        </p>
      </div>
    </main>
  );
}
