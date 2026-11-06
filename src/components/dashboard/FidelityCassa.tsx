"use client";

import React, { useState } from "react";
import QRCode from "qrcode";
import { classificaTelefono } from "@/lib/phone";

interface Premio {
  id: string;
  name: string;
  pointsRequired: number;
}
interface Regole {
  enabled: boolean;
  pointsPerEuro: number;
  welcomeBonusPoints: number;
  minPointsToRedeem: number;
  rewards: Premio[];
}
interface ClienteCassa {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  punti: number;
  tokenTessera: string;
}

/**
 * Cassa fidelity: cerca il cliente (telefono, nome o link della tessera), accredita i punti della spesa e
 * riscatta i premi scelti dal titolare. Tutto scritto nel database dell'attivita'.
 */
export default function FidelityCassa({ onChange }: { onChange?: () => void }) {
  const [ricerca, setRicerca] = useState("");
  const [cerco, setCerco] = useState(false);
  const [regole, setRegole] = useState<Regole | null>(null);
  const [risultati, setRisultati] = useState<ClienteCassa[] | null>(null);
  const [cliente, setCliente] = useState<ClienteCassa | null>(null);
  const [importo, setImporto] = useState("");
  const [extra, setExtra] = useState("");
  const [lavoro, setLavoro] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "errore"; testo: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const linkTessera = (c: ClienteCassa) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/tessera/${c.tokenTessera}`;

  const scegli = async (c: ClienteCassa) => {
    setCliente(c);
    setImporto("");
    setExtra("");
    setMsg(null);
    try {
      setQr(await QRCode.toDataURL(linkTessera(c), { margin: 1, width: 180 }));
    } catch {
      setQr(null);
    }
  };

  const cerca = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ricerca.trim()) return;
    setCerco(true);
    setMsg(null);
    setCliente(null);
    try {
      const res = await fetch(`/api/fedelta/cassa?q=${encodeURIComponent(ricerca.trim())}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Ricerca non riuscita");
      setRegole(d.regole);
      setRisultati(d.clienti);
      if (d.clienti.length === 1) await scegli(d.clienti[0]);
      if (d.clienti.length === 0) setMsg({ tipo: "errore", testo: "Nessun cliente trovato. Controlla il numero o crealo dalla sezione Clienti." });
    } catch (err: any) {
      setMsg({ tipo: "errore", testo: err.message });
    } finally {
      setCerco(false);
    }
  };

  const opera = async (corpo: any) => {
    if (!cliente) return;
    setLavoro(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fedelta/cassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: cliente.id, ...corpo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Operazione non riuscita");
      setCliente({ ...cliente, punti: d.saldo });
      if (corpo.azione === "ACCREDITA") {
        setImporto("");
        setExtra("");
        setMsg({
          tipo: "ok",
          testo: `Accreditati ${d.accreditati} punti${d.bonusBenvenuto ? ` (più ${d.bonusBenvenuto} di benvenuto)` : ""}. Saldo: ${d.saldo}.`,
        });
      } else {
        setMsg({
          tipo: "ok",
          testo: `Premio "${d.premio.name}" riscattato: creato il buono ${d.buono?.codice}. Saldo punti: ${d.saldo}. Lo trovi in Buoni, pronto da stampare o inviare.`,
        });
      }
      onChange?.();
    } catch (err: any) {
      setMsg({ tipo: "errore", testo: err.message });
    } finally {
      setLavoro(false);
    }
  };

  const copia = async () => {
    if (!cliente) return;
    try {
      await navigator.clipboard.writeText(linkTessera(cliente));
      setMsg({ tipo: "ok", testo: "Link della tessera copiato." });
    } catch {
      setMsg({ tipo: "errore", testo: "Non riesco a copiare: " + linkTessera(cliente) });
    }
  };

  const anteprimaPunti =
    regole && importo && parseFloat(importo) > 0 ? Math.floor(parseFloat(importo) * regole.pointsPerEuro) : 0;
  const puoWhatsApp = cliente ? classificaTelefono(cliente.telefono) === "CELLULARE" : false;

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900">Cassa fedeltà</h2>
        <p className="text-xs text-gray-500">Cerca il cliente per telefono, nome o link della tessera.</p>
      </div>

      <form onSubmit={cerca} className="flex gap-2">
        <input
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Telefono, nome o link tessera"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={cerco}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {cerco ? "Cerco…" : "Cerca"}
        </button>
      </form>

      {msg && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold border ${
            msg.tipo === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {msg.testo}
        </div>
      )}

      {!cliente && risultati && risultati.length > 1 && (
        <ul className="divide-y border rounded-xl">
          {risultati.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => scegli(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex justify-between">
                <span className="font-semibold">
                  {c.nome} {c.cognome}
                </span>
                <span className="text-gray-500">
                  {c.telefono} · {c.punti} pt
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cliente && regole && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/60 border border-emerald-100 p-3">
            <div>
              <div className="font-bold text-gray-900">
                {cliente.nome} {cliente.cognome}
              </div>
              <div className="text-xs text-gray-500">{cliente.telefono}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-emerald-700 leading-none">{cliente.punti}</div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase">punti</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Spesa in cassa (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 text-sm"
                placeholder="es. 45"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                {regole.pointsPerEuro} punto{regole.pointsPerEuro === 1 ? "" : "i"} per ogni euro
                {anteprimaPunti > 0 ? ` → +${anteprimaPunti} punti` : ""}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Punti extra (opzionale)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 text-sm"
                placeholder="es. 10"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={lavoro}
            onClick={() =>
              opera({
                azione: "ACCREDITA",
                importo: importo ? parseFloat(importo) : undefined,
                punti: extra ? parseInt(extra, 10) : undefined,
              })
            }
            className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            Accredita punti
          </button>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Premi</h3>
            {regole.rewards.length === 0 ? (
              <p className="text-xs text-gray-400">Nessun premio impostato: si aggiungono in Impostazioni → Fedeltà.</p>
            ) : (
              <ul className="space-y-2">
                {[...regole.rewards]
                  .sort((a, b) => a.pointsRequired - b.pointsRequired)
                  .map((p) => {
                    const ok = cliente.punti >= p.pointsRequired;
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 border rounded-xl px-3 py-2">
                        <div className="text-sm">
                          <div className={ok ? "font-semibold text-gray-900" : "text-gray-500"}>{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.pointsRequired} punti</div>
                        </div>
                        <button
                          type="button"
                          disabled={!ok || lavoro}
                          onClick={() => {
                            if (confirm(`Riscattare "${p.name}" e scalare ${p.pointsRequired} punti?`)) {
                              opera({ azione: "RISCATTA", premioId: p.id });
                            }
                          }}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          Riscatta
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border p-3 flex items-center gap-3">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR tessera" className="w-24 h-24" />
            )}
            <div className="text-xs text-gray-600 space-y-1.5">
              <div className="font-semibold text-gray-900">Tessera digitale del cliente</div>
              <p>Il cliente la apre da telefono e vede punti e premi. Inquadra il QR o invia il link.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copia} className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold">
                  Copia link
                </button>
                {puoWhatsApp ? (
                  <a
                    href={`https://wa.me/39${cliente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Ecco la tua tessera fedeltà: ${linkTessera(cliente)}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
                  >
                    Invia su WhatsApp
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-700">Telefono fisso: consegna il link a voce o per email.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
