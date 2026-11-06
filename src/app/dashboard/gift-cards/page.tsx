"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { classificaTelefono } from "@/lib/phone";

const MOTIVI: { id: string; etichetta: string }[] = [
  { id: "REGALO", etichetta: "Buono regalo" },
  { id: "SCONTO", etichetta: "Buono sconto" },
  { id: "COMPENSAZIONE", etichetta: "Compensazione (errore o disservizio)" },
  { id: "GESTO_COMMERCIALE", etichetta: "Gesto commerciale" },
  { id: "PREMIO_PUNTI", etichetta: "Premio punti" },
  { id: "COMPLEANNO", etichetta: "Buono compleanno" },
  { id: "PROMOZIONE", etichetta: "Promozione" },
];
const etichettaMotivo = (id: string) => MOTIVI.find((m) => m.id === id)?.etichetta || id;

interface Movimento {
  id: string;
  tipo: string | null;
  importo: number;
  saldoDopo: number | null;
  operatore: string | null;
  note: string | null;
  createdAt: string;
}

interface Buono {
  id: string;
  codice: string;
  motivo: string;
  tipoValore: "IMPORTO" | "PERCENTUALE" | "SERVIZIO";
  importoIniziale: number;
  saldoResiduo: number;
  percentuale: number | null;
  descrizioneServizio: string | null;
  spesaMinima: number | null;
  usoParziale: boolean;
  note: string | null;
  acquirenteNome: string;
  beneficiarioNome: string;
  beneficiarioMessaggio: string | null;
  dataScadenza: string | null;
  stato: "ATTIVA" | "RISCATTATA" | "SCADUTA" | "ANNULLATA";
  clienteNome: string | null;
  clienteEmail: string | null;
  clienteTelefono: string | null;
  acquirenteEmail: string | null;
  acquirenteTelefono: string | null;
  tokenPubblico: string | null;
  createdAt: string;
  movimenti?: Movimento[];
}

interface Stats {
  incassoMese: number;
  buoniAttivi: number;
  valoreResiduo: number;
  inScadenza: number;
  buoniRiscattati: number;
}

interface ClienteRicerca {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email?: string | null;
}

const ETICHETTA_MOVIMENTO: Record<string, string> = {
  EMISSIONE: "Emesso",
  USO: "Usato",
  ANNULLO: "Annullato",
  STAMPA: "Stampato",
  RISTAMPA: "Ristampato",
  INVIO: "Inviato",
};

interface Anteprima {
  buono: { id: string; codice: string; motivoEtichetta: string; tipoValore: string; valore: string; saldoResiduo: number; spesaMinima: number | null; usoParziale: boolean; dataScadenza: string | null; stato: string; intestatario: string | null };
  anteprima: { sconto: number; nuovoSaldo: number; conclude: boolean } | null;
  errore: string | null;
}

const valoreTesto = (b: Buono) =>
  b.tipoValore === "PERCENTUALE"
    ? `${b.percentuale}% di sconto`
    : b.tipoValore === "SERVIZIO"
    ? b.descrizioneServizio || "Servizio in omaggio"
    : `${b.importoIniziale.toFixed(2)} €`;

const euro = (n: number) => `${n.toFixed(2)} €`;

const statoCls: Record<string, string> = {
  ATTIVA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RISCATTATA: "bg-slate-100 text-slate-600 border-slate-200",
  SCADUTA: "bg-amber-50 text-amber-800 border-amber-200",
  ANNULLATA: "bg-rose-50 text-rose-700 border-rose-200",
};

const campo = "w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500";
const etichetta = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1";

export default function BuoniPage() {
  const [stats, setStats] = useState<Stats>({ incassoMese: 0, buoniAttivi: 0, valoreResiduo: 0, inScadenza: 0, buoniRiscattati: 0 });
  const [buoni, setBuoni] = useState<Buono[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStato, setFiltroStato] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cassa
  const [codice, setCodice] = useState("");
  const [spesa, setSpesa] = useState("");
  const [anteprima, setAnteprima] = useState<Anteprima | null>(null);
  const [cassaLoading, setCassaLoading] = useState(false);

  // Emissione
  const [modale, setModale] = useState(false);
  const [motivo, setMotivo] = useState("REGALO");
  const [tipoValore, setTipoValore] = useState<"IMPORTO" | "PERCENTUALE" | "SERVIZIO">("IMPORTO");
  const [importo, setImporto] = useState("50");
  const [percentuale, setPercentuale] = useState("10");
  const [servizio, setServizio] = useState("");
  const [validita, setValidita] = useState("12"); // "" = senza scadenza
  const [spesaMinima, setSpesaMinima] = useState("");
  const [usoParziale, setUsoParziale] = useState(true);
  const [note, setNote] = useState("");
  const [acquirente, setAcquirente] = useState("");
  const [acquirenteEmail, setAcquirenteEmail] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [ricercaCliente, setRicercaCliente] = useState("");
  const [risultatiCliente, setRisultatiCliente] = useState<ClienteRicerca[]>([]);
  const [clienteScelto, setClienteScelto] = useState<ClienteRicerca | null>(null);
  const [invio, setInvio] = useState(false);
  const [inviaSubito, setInviaSubito] = useState(true);
  const [emailInvio, setEmailInvio] = useState<Record<string, string>>({});
  const [inviando, setInviando] = useState<string | null>(null);
  const [erroreModale, setErroreModale] = useState<string | null>(null);

  const mostra = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 6000);
  };

  const carica = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (filtroStato) q.set("stato", filtroStato);
      if (filtroMotivo) q.set("motivo", filtroMotivo);
      const res = await fetch(`/api/gift-cards?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        if (d.stats) setStats(d.stats);
        if (d.giftCards) setBuoni(d.giftCards);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filtroStato, filtroMotivo]);

  useEffect(() => {
    const t = setTimeout(carica, 250);
    return () => clearTimeout(t);
  }, [carica]);

  // Buoni compleanno: se l'automatismo e' attivo, all'apertura della pagina si controlla (al massimo una volta al giorno
  // per browser; la creazione e' comunque sicura contro i doppioni)
  useEffect(() => {
    const oggi = new Date().toISOString().slice(0, 10);
    let giaFatto = false;
    try {
      giaFatto = localStorage.getItem("schedly_compleanni_check") === oggi;
    } catch {}
    if (giaFatto) return;
    fetch("/api/cron/compleanni")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        try {
          localStorage.setItem("schedly_compleanni_check", oggi);
        } catch {}
        if (d?.creati > 0) {
          mostra(`Creati ${d.creati} buoni compleanno${d.inviati ? ` (${d.inviati} inviati per email)` : ""}.`);
          carica();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ricerca cliente per intestare il buono
  useEffect(() => {
    if (!modale || clienteScelto || ricercaCliente.trim().length < 2) {
      setRisultatiCliente([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clienti/ricerca?ricerca=${encodeURIComponent(ricercaCliente.trim())}&limit=6`);
        const d = await res.json();
        const arr = Array.isArray(d) ? d : d.clienti || [];
        setRisultatiCliente(arr.slice(0, 6));
      } catch {
        setRisultatiCliente([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [ricercaCliente, clienteScelto, modale]);

  const apriEmissione = () => {
    setErroreModale(null);
    setModale(true);
  };

  const emetti = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroreModale(null);
    setInvio(true);
    try {
      const corpo: any = {
        motivo,
        tipoValore,
        mesiValidita: validita ? parseInt(validita, 10) : null,
        spesaMinima: spesaMinima ? parseFloat(spesaMinima) : null,
        usoParziale: tipoValore === "IMPORTO" ? usoParziale : false,
        note: note.trim() || null,
        clienteId: clienteScelto?.id || null,
      };
      if (tipoValore === "IMPORTO") corpo.importo = parseFloat(importo);
      if (tipoValore === "PERCENTUALE") corpo.percentuale = parseFloat(percentuale);
      if (tipoValore === "SERVIZIO") corpo.descrizioneServizio = servizio;
      if (motivo === "REGALO") {
        corpo.acquirenteNome = acquirente.trim() || null;
        corpo.acquirenteEmail = acquirenteEmail.trim() || null;
        corpo.beneficiarioNome = beneficiario.trim() || null;
        corpo.beneficiarioMessaggio = messaggio.trim() || null;
      }
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroreModale(d.error || "Emissione non riuscita");
        return;
      }
      let esitoInvio = "";
      if (inviaSubito && clienteScelto?.email) {
        const r = await fetch(`/api/gift-cards/${d.giftCard.id}/invia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canale: "EMAIL" }),
        });
        esitoInvio = r.ok ? ` Inviato per email a ${clienteScelto.email}.` : " L'email non è partita: puoi riprovare dal buono.";
      }
      mostra(`Buono ${d.giftCard.codice} emesso.${esitoInvio}`);
      setAperto(d.giftCard.id);
      setModale(false);
      setAcquirente("");
      setAcquirenteEmail("");
      setBeneficiario("");
      setMessaggio("");
      setNote("");
      setServizio("");
      setSpesaMinima("");
      setClienteScelto(null);
      setRicercaCliente("");
      carica();
    } catch {
      setErroreModale("Errore di connessione");
    } finally {
      setInvio(false);
    }
  };

  const verifica = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!codice.trim()) return;
    setCassaLoading(true);
    setAnteprima(null);
    try {
      const res = await fetch("/api/gift-cards/riscatto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codice, importoSpesa: spesa ? parseFloat(spesa) : null, soloAnteprima: true }),
      });
      const d = await res.json();
      if (!res.ok) mostra(d.error || "Buono non trovato", "error");
      else setAnteprima(d);
    } catch {
      mostra("Errore di connessione", "error");
    } finally {
      setCassaLoading(false);
    }
  };

  const conferma = async () => {
    if (!anteprima) return;
    setCassaLoading(true);
    try {
      const res = await fetch("/api/gift-cards/riscatto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codice: anteprima.buono.codice, importoSpesa: spesa ? parseFloat(spesa) : null }),
      });
      const d = await res.json();
      if (!res.ok) {
        mostra(d.error || "Impossibile usare il buono", "error");
      } else {
        mostra(
          d.sconto > 0
            ? `Buono ${d.codice} usato: sconto di ${euro(d.sconto)}${d.stato === "ATTIVA" ? `, credito residuo ${euro(d.nuovoSaldo)}` : ""}.`
            : `Buono ${d.codice} usato.`
        );
        setAnteprima(null);
        setCodice("");
        setSpesa("");
        carica();
      }
    } catch {
      mostra("Errore di connessione", "error");
    } finally {
      setCassaLoading(false);
    }
  };

  const linkBuono = (b: Buono) => `${window.location.origin}/buono/${b.tokenPubblico}`;

  const stampa = async (b: Buono, formato: "a4" | "ricevuta") => {
    // La finestra va aperta subito (al clic), poi si registra la stampa e la si porta alla pagina giusta
    const finestra = window.open("", "_blank");
    try {
      const res = await fetch(`/api/gift-cards/${b.id}/stampa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formato }),
      });
      const d = await res.json();
      if (!res.ok) {
        finestra?.close();
        mostra(d.error || "Stampa non riuscita", "error");
        return;
      }
      if (finestra) finestra.location.href = d.url;
      else window.location.href = d.url;
      if (d.ristampa) mostra(`Ristampa del buono ${b.codice} (stesso codice).`);
      carica();
    } catch {
      finestra?.close();
      mostra("Errore di connessione", "error");
    }
  };

  const inviaEmail = async (b: Buono) => {
    const indirizzo = (emailInvio[b.id] ?? b.clienteEmail ?? b.acquirenteEmail ?? "").trim();
    setInviando(b.id);
    try {
      const res = await fetch(`/api/gift-cards/${b.id}/invia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canale: "EMAIL", email: indirizzo || null }),
      });
      const d = await res.json();
      if (!res.ok) mostra(d.error || "Invio non riuscito", "error");
      else {
        mostra(
          d.simulato
            ? `Demo: l'email a ${d.destinatario} è simulata, non viene inviata davvero.`
            : `Buono ${b.codice} inviato per email a ${d.destinatario}.`
        );
        carica();
      }
    } catch {
      mostra("Errore di connessione", "error");
    } finally {
      setInviando(null);
    }
  };

  const apriWhatsApp = async (b: Buono, telefono: string) => {
    const numero = telefono.replace(/\D/g, "");
    const testo = `Ciao! Ecco il tuo buono: ${linkBuono(b)}`;
    window.open(`https://wa.me/39${numero}?text=${encodeURIComponent(testo)}`, "_blank");
    fetch(`/api/gift-cards/${b.id}/invia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canale: "WHATSAPP" }),
    }).then(() => carica());
  };

  const copiaLink = async (b: Buono) => {
    try {
      await navigator.clipboard.writeText(linkBuono(b));
      mostra("Link del buono copiato.");
    } catch {
      mostra(linkBuono(b), "error");
    }
  };

  const annulla = async (b: Buono) => {
    const motivoAnnullo = prompt(`Annullare il buono ${b.codice}? Scrivi il motivo (facoltativo):`);
    if (motivoAnnullo === null) return;
    try {
      const res = await fetch(`/api/gift-cards/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ azione: "ANNULLA", motivo: motivoAnnullo }),
      });
      const d = await res.json();
      if (!res.ok) mostra(d.error || "Annullo non riuscito", "error");
      else {
        mostra(`Buono ${b.codice} annullato.`);
        carica();
      }
    } catch {
      mostra("Errore di connessione", "error");
    }
  };

  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.GIFT_CARDS}
      title="Buoni"
      description="Buoni regalo, sconto, compensazione e premi: in euro, in percentuale o con un servizio in omaggio, con o senza scadenza."
      icon="🎁"
    >
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium ${
              feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buoni</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Regali, sconti, compensazioni e premi punti: li emetti qui, li usi in cassa e vedi sempre cosa è stato fatto.
            </p>
          </div>
          <button
            onClick={apriEmissione}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition"
          >
            + Nuovo buono
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Buoni attivi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.buoniAttivi}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Pronti all&apos;uso</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Credito in circolo</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : euro(stats.valoreResiduo)}</p>
            <p className="text-xs text-slate-500 mt-1">Buoni in euro ancora spendibili</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In scadenza (30 gg)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.inScadenza}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Da ricordare ai clienti</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Regali venduti (mese)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : euro(stats.incassoMese)}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Incassati in anticipo</p>
          </div>
        </div>

        {/* Cassa */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Usa un buono in cassa</h2>
            <p className="text-xs text-slate-500">
              Scrivi il codice (o incolla il link) e la spesa del cliente: vedi lo sconto prima di confermare.
            </p>
          </div>
          <form onSubmit={verifica} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className={etichetta}>Codice del buono</label>
              <input
                value={codice}
                onChange={(e) => {
                  setCodice(e.target.value);
                  setAnteprima(null);
                }}
                placeholder="BUO-XXXXX-XXXXX"
                className={`${campo} font-mono uppercase tracking-wider`}
              />
            </div>
            <div>
              <label className={etichetta}>Spesa del cliente (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={spesa}
                onChange={(e) => {
                  setSpesa(e.target.value);
                  setAnteprima(null);
                }}
                placeholder="es. 80"
                className={campo}
              />
            </div>
            <button
              type="submit"
              disabled={cassaLoading || !codice.trim()}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {cassaLoading && !anteprima ? "Controllo…" : "Verifica"}
            </button>
          </form>

          {anteprima && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {anteprima.buono.motivoEtichetta} · {anteprima.buono.valore}
                  </div>
                  <div className="text-xs text-slate-500">
                    {anteprima.buono.intestatario ? `Per ${anteprima.buono.intestatario} · ` : ""}
                    {anteprima.buono.dataScadenza
                      ? `scade il ${format(new Date(anteprima.buono.dataScadenza), "d MMM yyyy", { locale: it })}`
                      : "senza scadenza"}
                    {anteprima.buono.tipoValore === "IMPORTO" ? ` · credito residuo ${euro(anteprima.buono.saldoResiduo)}` : ""}
                    {anteprima.buono.spesaMinima ? ` · spesa minima ${euro(anteprima.buono.spesaMinima)}` : ""}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statoCls[anteprima.buono.stato] || ""}`}>
                  {anteprima.buono.stato}
                </span>
              </div>
              {anteprima.errore ? (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {anteprima.errore}
                </div>
              ) : (
                anteprima.anteprima && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      {anteprima.buono.tipoValore === "SERVIZIO" ? (
                        <b>Servizio in omaggio: {anteprima.buono.valore}</b>
                      ) : (
                        <>
                          Sconto sul conto: <b>{euro(anteprima.anteprima.sconto)}</b>
                          {spesa && parseFloat(spesa) > 0 ? (
                            <> → da pagare <b>{euro(Math.max(0, parseFloat(spesa) - anteprima.anteprima.sconto))}</b></>
                          ) : null}
                          {!anteprima.anteprima.conclude && (
                            <span className="text-slate-500"> · restano {euro(anteprima.anteprima.nuovoSaldo)} sul buono</span>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={conferma}
                      disabled={cassaLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold"
                    >
                      {cassaLoading ? "Attendi…" : "Conferma uso"}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Elenco */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Buoni emessi</h2>
              <p className="text-xs text-slate-500">Tocca un buono per vedere i movimenti.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Cerca per codice o nome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={campo}
              />
              <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)} className={campo}>
                <option value="">Tutti gli stati</option>
                <option value="ATTIVA">Attivi</option>
                <option value="RISCATTATA">Usati</option>
                <option value="SCADUTA">Scaduti</option>
                <option value="ANNULLATA">Annullati</option>
              </select>
              <select value={filtroMotivo} onChange={(e) => setFiltroMotivo(e.target.value)} className={campo}>
                <option value="">Tutti i motivi</option>
                {MOTIVI.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.etichetta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Caricamento buoni…</div>
          ) : buoni.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">Nessun buono trovato.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {buoni.map((b) => {
                const espanso = aperto === b.id;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setAperto(espanso ? null : b.id)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50/70 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{b.codice}</span>
                          <span className="text-xs text-slate-500">{etichettaMotivo(b.motivo)}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-1">
                          {valoreTesto(b)}
                          {b.tipoValore === "IMPORTO" && b.stato === "ATTIVA" && b.saldoResiduo !== b.importoIniziale && (
                            <span className="text-slate-500 font-normal"> · residuo {euro(b.saldoResiduo)}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.clienteNome || b.beneficiarioNome ? `Per ${b.clienteNome || b.beneficiarioNome} · ` : ""}
                          {b.dataScadenza ? `scade il ${format(new Date(b.dataScadenza), "d MMM yyyy", { locale: it })}` : "senza scadenza"}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statoCls[b.stato] || ""}`}>{b.stato}</span>
                    </button>
                    {espanso && (
                      <div className="px-5 pb-5 space-y-3 bg-slate-50/50">
                        <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {b.acquirenteNome && b.motivo === "REGALO" && <div>Acquistato da: <b>{b.acquirenteNome}</b></div>}
                          {b.beneficiarioMessaggio && <div>Messaggio: “{b.beneficiarioMessaggio}”</div>}
                          {b.spesaMinima ? <div>Spesa minima: {euro(b.spesaMinima)}</div> : null}
                          {b.tipoValore === "IMPORTO" && <div>{b.usoParziale ? "Si può usare in più volte" : "Uso in un’unica volta"}</div>}
                          {b.note && <div>Note: {b.note}</div>}
                          <div>Emesso il {format(new Date(b.createdAt), "d MMM yyyy", { locale: it })}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Movimenti</div>
                          <ul className="space-y-1">
                            {(b.movimenti || []).map((m) => (
                              <li key={m.id} className="text-xs text-slate-600 flex justify-between gap-3">
                                <span>
                                  {format(new Date(m.createdAt), "d MMM yyyy HH:mm", { locale: it })} · {ETICHETTA_MOVIMENTO[m.tipo || "USO"] || m.tipo} · {m.note}
                                  {m.operatore ? ` (${m.operatore})` : ""}
                                </span>
                                {m.tipo === "USO" && <span className="font-mono shrink-0">−{euro(m.importo)}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {b.stato === "ATTIVA" && b.tokenPubblico && (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consegna il buono</div>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => stampa(b, "a4")} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                Stampa A4
                              </button>
                              <button onClick={() => stampa(b, "ricevuta")} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                Stampa ricevuta
                              </button>
                              <button onClick={() => copiaLink(b)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                Copia link
                              </button>
                              {(() => {
                                const tel = b.clienteTelefono || b.acquirenteTelefono || "";
                                if (!tel) return null;
                                return classificaTelefono(tel) === "CELLULARE" ? (
                                  <button onClick={() => apriWhatsApp(b, tel)} className="px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                    WhatsApp
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-amber-700 self-center">Telefono fisso: usa email o stampa</span>
                                );
                              })()}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="email"
                                placeholder="Indirizzo email"
                                value={emailInvio[b.id] ?? b.clienteEmail ?? b.acquirenteEmail ?? ""}
                                onChange={(e) => setEmailInvio({ ...emailInvio, [b.id]: e.target.value })}
                                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-300"
                              />
                              <button
                                onClick={() => inviaEmail(b)}
                                disabled={inviando === b.id}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-60"
                              >
                                {inviando === b.id ? "Invio…" : "Invia per email"}
                              </button>
                            </div>
                          </div>
                        )}
                        {b.stato === "ATTIVA" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCodice(b.codice);
                                setAnteprima(null);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                            >
                              Usa in cassa
                            </button>
                            <button
                              onClick={() => annulla(b)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Annulla buono
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {modale && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <form onSubmit={emetti} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Nuovo buono</h3>
              <button type="button" onClick={() => setModale(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            <div>
              <label className={etichetta}>Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}>
                {MOTIVI.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.etichetta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={etichetta}>Valore</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(
                  [
                    ["IMPORTO", "In euro"],
                    ["PERCENTUALE", "Percentuale"],
                    ["SERVIZIO", "Servizio"],
                  ] as const
                ).map(([id, testo]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setTipoValore(id)}
                    className={`py-2 rounded-xl border text-sm font-semibold ${
                      tipoValore === id ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    {testo}
                  </button>
                ))}
              </div>
              {tipoValore === "IMPORTO" && (
                <input type="number" step="0.01" min="1" value={importo} onChange={(e) => setImporto(e.target.value)} className={campo} placeholder="Importo in €" />
              )}
              {tipoValore === "PERCENTUALE" && (
                <input type="number" step="1" min="1" max="100" value={percentuale} onChange={(e) => setPercentuale(e.target.value)} className={campo} placeholder="Sconto in %" />
              )}
              {tipoValore === "SERVIZIO" && (
                <input value={servizio} onChange={(e) => setServizio(e.target.value)} className={campo} placeholder="Es. Manicure completa" />
              )}
            </div>

            <div>
              <label className={etichetta}>Validità</label>
              <select value={validita} onChange={(e) => setValidita(e.target.value)} className={campo}>
                <option value="">Senza scadenza</option>
                <option value="1">1 mese</option>
                <option value="3">3 mesi</option>
                <option value="6">6 mesi</option>
                <option value="12">12 mesi</option>
                <option value="24">24 mesi</option>
              </select>
            </div>

            <div>
              <label className={etichetta}>Intestato a un cliente (facoltativo)</label>
              {clienteScelto ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <span>
                    {clienteScelto.nome} {clienteScelto.cognome} · {clienteScelto.telefono}
                  </span>
                  <button type="button" onClick={() => setClienteScelto(null)} className="text-xs text-emerald-600 font-semibold">
                    Cambia
                  </button>
                </div>
              ) : (
                <>
                  <input value={ricercaCliente} onChange={(e) => setRicercaCliente(e.target.value)} className={campo} placeholder="Cerca per nome o telefono" />
                  {risultatiCliente.length > 0 && (
                    <ul className="mt-1 border rounded-xl divide-y">
                      {risultatiCliente.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setClienteScelto(c);
                              setRicercaCliente("");
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50"
                          >
                            {c.nome} {c.cognome} · {c.telefono}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {clienteScelto?.email ? (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={inviaSubito} onChange={(e) => setInviaSubito(e.target.checked)} />
                Invia subito per email a {clienteScelto.email}
              </label>
            ) : clienteScelto ? (
              <p className="text-xs text-amber-700">Questo cliente non ha un&apos;email: potrai stampare il buono o inviarlo da WhatsApp.</p>
            ) : null}

            {motivo === "REGALO" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={etichetta}>Chi lo regala</label>
                  <input value={acquirente} onChange={(e) => setAcquirente(e.target.value)} className={campo} />
                </div>
                <div>
                  <label className={etichetta}>Email di chi regala</label>
                  <input type="email" value={acquirenteEmail} onChange={(e) => setAcquirenteEmail(e.target.value)} className={campo} />
                </div>
                {!clienteScelto && (
                  <div className="sm:col-span-2">
                    <label className={etichetta}>Per chi è</label>
                    <input value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} className={campo} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className={etichetta}>Messaggio (facoltativo)</label>
                  <input value={messaggio} onChange={(e) => setMessaggio(e.target.value)} className={campo} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={etichetta}>Spesa minima (€, facoltativa)</label>
                <input type="number" step="0.01" min="0" value={spesaMinima} onChange={(e) => setSpesaMinima(e.target.value)} className={campo} />
              </div>
              {tipoValore === "IMPORTO" && (
                <label className="flex items-center gap-2 text-sm text-slate-700 sm:mt-6">
                  <input type="checkbox" checked={usoParziale} onChange={(e) => setUsoParziale(e.target.checked)} />
                  Usabile in più volte
                </label>
              )}
            </div>

            <div>
              <label className={etichetta}>Note interne (facoltative)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={campo} placeholder="Es. errore sul colore del 12/11" />
            </div>

            {erroreModale && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{erroreModale}</div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModale(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">
                Annulla
              </button>
              <button
                type="submit"
                disabled={invio}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {invio ? "Emetto…" : "Emetti buono"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AddonModuleGuard>
  );
}
