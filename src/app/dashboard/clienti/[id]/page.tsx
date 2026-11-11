"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { classificaTelefono, ETICHETTA_TELEFONO, puoRicevereMessaggi } from "@/lib/phone";
import ClienteFedeltaPanel from "@/components/dashboard/ClienteFedeltaPanel";

type Messaggio = { tipo: "ok" | "errore"; testo: string } | null;

function giorniAlCompleanno(dataNascita?: string | null): number | null {
  if (!dataNascita) return null;
  const n = new Date(dataNascita);
  if (isNaN(n.getTime())) return null;
  const oggi = new Date();
  const base = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  let prossimo = Date.UTC(oggi.getFullYear(), n.getUTCMonth(), n.getUTCDate());
  if (prossimo < base) prossimo = Date.UTC(oggi.getFullYear() + 1, n.getUTCMonth(), n.getUTCDate());
  return Math.round((prossimo - base) / 86400000);
}

export default function VendolyClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);
  const [buoni, setBuoni] = useState<any[]>([]);
  const [nomeAttivita, setNomeAttivita] = useState("Vendoly Store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messaggio, setMessaggio] = useState<Messaggio>(null);

  const ricaricaCliente = useCallback(async () => {
    const r = await fetch(`/api/clienti/${id}`);
    if (r.ok) {
      const data = await r.json();
      setCliente(data.cliente || null);
      setBuoni(data.buoni || []);
      if (data.nomeAttivita) setNomeAttivita(data.nomeAttivita);
    } else {
      setCliente({ error: true });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    ricaricaCliente();
  }, [ricaricaCliente]);

  const handleUpdate = async () => {
    if (!cliente) return;
    setSaving(true);
    setMessaggio(null);
    try {
      const res = await fetch(`/api/clienti/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: cliente.firstName,
          lastName: cliente.lastName || "",
          phone: cliente.phone,
          email: cliente.email || "",
          address: cliente.address || "",
          fiscalCode: cliente.fiscalCode || "",
          clothingSize: cliente.clothingSize || "",
          shoeSize: cliente.shoeSize || "",
          preferredBrands: cliente.preferredBrands || "",
          notes: cliente.notes || "",
          birthDate: cliente.birthDate ? String(cliente.birthDate).slice(0, 10) : null,
          marketingConsent: Boolean(cliente.marketingConsent),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.customer) {
          setCliente((prev: any) => ({ ...prev, phone: data.customer.phone ?? prev.phone }));
        }
        setMessaggio({ tipo: "ok", testo: "Dati cliente salvati." });
      } else {
        setMessaggio({ tipo: "errore", testo: data.error || "Non è stato possibile salvare." });
      }
    } catch {
      setMessaggio({ tipo: "errore", testo: "Errore di connessione, riprova." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Sei sicuro di voler eliminare questo cliente dall'anagrafica?")) {
      await fetch(`/api/clienti/${id}`, { method: "DELETE" });
      router.push("/dashboard/clienti");
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Caricamento scheda cliente...</div>;
  if (!cliente || cliente.error) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-3">
        <p className="text-rose-600 font-semibold">Cliente non trovato.</p>
        <Link href="/dashboard/clienti" className="text-xs text-emerald-700 font-semibold hover:underline">
          ← Torna alla lista clienti
        </Link>
      </div>
    );
  }

  const tipoTel = classificaTelefono(cliente.phone);
  const riceveMessaggi = puoRicevereMessaggi(cliente.phone);
  const giorniCompleanno = giorniAlCompleanno(cliente.birthDate);
  const movimenti: any[] = cliente.pointsMovements || [];
  const ordini: any[] = cliente.orders || [];

  const campo =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-300";
  const etichetta = "text-xs font-semibold text-slate-500 uppercase";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/clienti" className="text-xs text-emerald-700 font-semibold hover:underline">
          ← Torna alla lista clienti
        </Link>
        <button
          onClick={handleDelete}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-1 border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
        >
          Elimina Cliente
        </button>
      </div>

      {/* Intestazione scheda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {cliente.firstName} {cliente.lastName || ""}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span
                className={`px-2.5 py-1 rounded-full font-semibold border ${
                  riceveMessaggi
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                📞 {ETICHETTA_TELEFONO[tipoTel]}
              </span>
              {giorniCompleanno !== null && giorniCompleanno <= 30 && (
                <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🎂 {giorniCompleanno === 0 ? "Compleanno oggi" : `Compleanno tra ${giorniCompleanno} giorni`}
                </span>
              )}
              {Number(cliente.totalSpent || 0) > 0 && (
                <span className="px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Spesa totale: € {Number(cliente.totalSpent).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[220px]">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
              <div className="text-2xl font-extrabold text-emerald-700">{cliente.loyaltyPoints ?? 0}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Punti fedeltà</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-2xl font-extrabold text-slate-800">{ordini.length}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Ordini</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anagrafica */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Anagrafica &amp; Preferenze</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={etichetta}>Nome</label>
            <input
              type="text"
              value={cliente.firstName || ""}
              onChange={(e) => setCliente({ ...cliente, firstName: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Cognome</label>
            <input
              type="text"
              value={cliente.lastName || ""}
              onChange={(e) => setCliente({ ...cliente, lastName: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Telefono</label>
            <input
              type="tel"
              value={cliente.phone || ""}
              onChange={(e) => setCliente({ ...cliente, phone: e.target.value })}
              className={campo}
            />
            {tipoTel === "FISSO" && (
              <p className="text-[11px] text-amber-700 mt-1">
                Telefono fisso: non può ricevere WhatsApp. Usa l&apos;email per tessera e buoni.
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={etichetta}>Email (opzionale)</label>
              <span className="text-[10px] text-slate-400">{cliente.email ? "Registrata" : "Nessuna email"}</span>
            </div>
            <input
              type="email"
              value={cliente.email || ""}
              placeholder="Serve per inviare tessera, buoni e comunicazioni"
              onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Data di nascita (facoltativa)</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={cliente.birthDate ? String(cliente.birthDate).slice(0, 10) : ""}
              onChange={(e) => setCliente({ ...cliente, birthDate: e.target.value || null })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Codice Fiscale / P.IVA</label>
            <input
              type="text"
              value={cliente.fiscalCode || ""}
              onChange={(e) => setCliente({ ...cliente, fiscalCode: e.target.value })}
              className={campo}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={etichetta}>Indirizzo spedizione / ritiro</label>
            <input
              type="text"
              value={cliente.address || ""}
              onChange={(e) => setCliente({ ...cliente, address: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Taglia Abiti</label>
            <input
              type="text"
              value={cliente.clothingSize || ""}
              onChange={(e) => setCliente({ ...cliente, clothingSize: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Taglia Scarpe</label>
            <input
              type="text"
              value={cliente.shoeSize || ""}
              onChange={(e) => setCliente({ ...cliente, shoeSize: e.target.value })}
              className={campo}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={etichetta}>Brand preferiti</label>
            <input
              type="text"
              value={cliente.preferredBrands || ""}
              onChange={(e) => setCliente({ ...cliente, preferredBrands: e.target.value })}
              className={campo}
            />
          </div>
        </div>

        <div>
          <label className={etichetta}>Note riservate &amp; Wishlist</label>
          <textarea
            rows={3}
            value={cliente.notes || ""}
            onChange={(e) => setCliente({ ...cliente, notes: e.target.value })}
            className={campo}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(cliente.marketingConsent)}
            onChange={(e) => setCliente({ ...cliente, marketingConsent: e.target.checked })}
          />
          <span>Consenso comunicazioni promozionali e buono compleanno per email</span>
        </label>

        {messaggio && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              messaggio.tipo === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {messaggio.testo}
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva Modifiche"}
        </button>
      </div>

      {/* Fedeltà, punti e invio tessera */}
      <ClienteFedeltaPanel
        clienteId={cliente.id}
        nomeCliente={`${cliente.firstName || ""} ${cliente.lastName || ""}`.trim()}
        telefono={cliente.phone || ""}
        email={cliente.email}
        punti={cliente.loyaltyPoints ?? 0}
        tokenTessera={cliente.loyaltyToken || cliente.tokenTessera}
        movimenti={movimenti}
        nomeAttivita={nomeAttivita}
        accent="emerald"
        onSaldoAggiornato={ricaricaCliente}
      />

      {/* Buoni */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Buoni</h2>
          <Link href="/dashboard/gift-cards" className="text-xs text-emerald-700 font-semibold hover:underline">
            Gestisci buoni →
          </Link>
        </div>
        {buoni.length === 0 ? (
          <p className="text-xs text-slate-400">Nessun buono attivo per questo cliente.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {buoni.map((b: any) => (
              <div key={b.id} className="py-2.5 text-sm">
                <p className="font-medium text-slate-800">
                  {b.tipoValore === "PERCENTUALE"
                    ? `${b.percentuale}% di sconto`
                    : b.tipoValore === "SERVIZIO"
                      ? b.descrizioneServizio
                      : `${Number(b.saldoResiduo).toFixed(2)} € di credito`}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="font-mono">{b.codice}</span> ·{" "}
                  {b.dataScadenza
                    ? `scade il ${new Date(b.dataScadenza).toLocaleDateString("it-IT")}`
                    : "senza scadenza"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storico Ordini */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          Storico Ordini ({ordini.length})
        </h2>
        {ordini.length === 0 ? (
          <p className="text-xs text-slate-400">Nessun ordine registrato per questo cliente.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ordini.map((o: any) => (
              <div key={o.id} className="py-3 flex items-center justify-between text-sm gap-3">
                <div>
                  <p className="font-semibold text-slate-900 font-mono text-xs">{o.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString("it-IT")} · {o.channel}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-800">
                    € {Number(o.totalAmount || 0).toFixed(2)}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
