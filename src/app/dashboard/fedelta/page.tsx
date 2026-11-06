"use client";

import { useState, useEffect } from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import FidelityCassa from "@/components/dashboard/FidelityCassa";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";

interface ClienteFedelta {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string | null;
  puntiFedelta: number;
  dataUltimaVisita: string | null;
  createdAt: string;
}

interface Movimento {
  id: string;
  clienteId: string;
  punti: number;
  tipo: "ACCREDITO" | "RISCATTO";
  descrizione: string | null;
  createdAt: string;
  cliente: {
    id: string;
    nome: string;
    cognome: string;
    telefono: string;
  };
}

interface Stats {
  tessereAttive: number;
  puntiTotali: number;
  premiRiscattati: number;
  movimentiMese: number;
}

export default function FedeltaPage() {
  const [stats, setStats] = useState<Stats>({
    tessereAttive: 0,
    puntiTotali: 0,
    premiRiscattati: 0,
    movimentiMese: 0,
  });
  const [clienti, setClienti] = useState<ClienteFedelta[]>([]);
  const [ultimiMovimenti, setUltimiMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal Assegna Punti
  const [isAssegnaOpen, setIsAssegnaOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [puntiDaAssegnare, setPuntiDaAssegnare] = useState<number>(10);
  const [descrizioneMovimento, setDescrizioneMovimento] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal Riscatta Premio
  const [isRiscattaOpen, setIsRiscattaOpen] = useState(false);
  const [riscattaCliente, setRiscattaCliente] = useState<ClienteFedelta | null>(null);
  const [catalogo, setCatalogo] = useState<{ pointsPerEuro: number; rewards: { id: string; name: string; pointsRequired: number }[] } | null>(null);
  useEffect(() => {
    fetch("/api/fedelta/cassa?q=")
      .then((r) => r.json())
      .then((d) => d?.regole && setCatalogo(d.regole))
      .catch(() => {});
  }, []);
  const [premiReali, setPremiReali] = useState<{ id: string; name: string; pointsRequired: number }[]>([]);
  const [premioSelezionato, setPremioSelezionato] = useState<{ id: string; punti: number; nome: string } | null>(null);

  // Notifica flash
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDati = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fedelta");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || { tessereAttive: 0, puntiTotali: 0, premiRiscattati: 0, movimentiMese: 0 });
        setClienti(data.clienti || []);
        setUltimiMovimenti(data.ultimiMovimenti || []);
      }
    } catch (err) {
      console.error("Errore fetch fedeltà:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDati();
  }, []);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Esegui accredito punti
  const handleAssegnaPunti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId || puntiDaAssegnare <= 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/fedelta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: selectedClienteId,
          punti: Number(puntiDaAssegnare),
          tipo: "ACCREDITO",
          descrizione: descrizioneMovimento || `Accredito punti (+${puntiDaAssegnare} pt)`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || "Errore durante l'assegnazione punti", "error");
      } else {
        showFeedback(`Accreditati con successo ${puntiDaAssegnare} punti! Nuovo saldo: ${data.nuovoSaldo} pt`);
        setIsAssegnaOpen(false);
        setSelectedClienteId("");
        setDescrizioneMovimento("");
        fetchDati();
      }
    } catch (err) {
      showFeedback("Errore di rete durante l'operazione", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Carica i premi decisi dal titolare quando si apre il riscatto
  useEffect(() => {
    if (!isRiscattaOpen || !riscattaCliente) return;
    setPremioSelezionato(null);
    fetch(`/api/fedelta/cassa?q=${encodeURIComponent(riscattaCliente.telefono)}`)
      .then((r) => r.json())
      .then((d) => setPremiReali(Array.isArray(d?.regole?.rewards) ? d.regole.rewards : []))
      .catch(() => setPremiReali([]));
  }, [isRiscattaOpen, riscattaCliente]);

  // Esegui riscatto premio (scala i punti e registra il movimento)
  const handleRiscattaPremio = async () => {
    if (!riscattaCliente || !premioSelezionato) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/fedelta/cassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          azione: "RISCATTA",
          clienteId: riscattaCliente.id,
          premioId: premioSelezionato.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || "Errore durante il riscatto premio", "error");
      } else {
        showFeedback(
          `Premio "${premioSelezionato.nome}" riscattato! Creato il buono ${data.buono?.codice} (lo trovi in Buoni). Saldo residuo: ${data.saldo} pt`
        );
        setIsRiscattaOpen(false);
        setRiscattaCliente(null);
        fetchDati();
      }
    } catch (err) {
      showFeedback("Errore di connessione durante il riscatto", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getLivello = (punti: number) => {
    if (punti >= 250) {
      return { nome: "Gold VIP", badge: "bg-amber-100 text-amber-800 border-amber-300", icon: "🥇" };
    }
    if (punti >= 100) {
      return { nome: "Silver", badge: "bg-slate-100 text-slate-800 border-slate-300", icon: "🥈" };
    }
    return { nome: "Bronze", badge: "bg-orange-50 text-orange-800 border-orange-200", icon: "🥉" };
  };

  const clientiFiltrati = clienti.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.cognome.toLowerCase().includes(q) ||
      c.telefono.includes(q)
    );
  });

  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.LOYALTY_CARD}
      title="Raccolta Punti & Card Fedeltà Digitale"
      description="Fidelizza i tuoi clienti con una tessera a punti 100% digitale sullo smartphone. Zero tessere cartacee perse e sblocco premi automatico."
      icon="🎟️"
    >
      <div className="space-y-6">
        {/* Banner Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm font-medium transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎟️</span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Raccolta Punti & Fidelity Card
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Assegna punti in cassa ad ogni trattamento e premia i clienti fedeli.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (clienti.length > 0) setSelectedClienteId(clienti[0].id);
                setPuntiDaAssegnare(10);
                setIsAssegnaOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>+</span> Assegna Punti Cassa
            </button>
          </div>
        </div>

        {/* Cassa fedeltà: accredito e premi reali */}
        <FidelityCassa onChange={fetchDati} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tessere Attive
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.tessereAttive}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Clienti con punti accumulati
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Punti in Circolazione
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.puntiTotali.toLocaleString("it-IT")} pt
            </p>
            <p className="text-xs text-slate-500 mt-1">Accumulati nel negozio</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Premi Riscattati
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.premiRiscattati}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Sconti & trattamenti omaggio
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Movimenti Questo Mese
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats.movimentiMese}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Attività recente in cassa
            </p>
          </div>
        </div>

        {/* Regole di Fedeltà e Premi Sbloccabili */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Premi</h2>
              <p className="text-xs text-slate-500">I vantaggi che i tuoi clienti possono richiedere (si modificano in Impostazioni → Fedeltà)</p>
            </div>
            {catalogo && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                Regola attiva: 1 € speso = {catalogo.pointsPerEuro} {catalogo.pointsPerEuro === 1 ? "punto" : "punti"}
              </span>
            )}
          </div>

          {!catalogo || catalogo.rewards.length === 0 ? (
            <p className="text-xs text-slate-400">Nessun premio impostato.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {[...catalogo.rewards]
                .sort((x, y) => x.pointsRequired - y.pointsRequired)
                .map((pr) => (
                  <div key={pr.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-800">🎁 {pr.name}</span>
                    <span className="shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {pr.pointsRequired} pt
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Tabella / Schede Clienti Fedeltà */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Classifica & Saldo Clienti</h2>
              <p className="text-xs text-slate-500">Cerca un cliente per visualizzare il saldo o riscattare un premio</p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Cerca cliente per nome o telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-base sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Caricamento fidelity card in corso...</div>
          ) : clientiFiltrati.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Nessun cliente trovato con i criteri specificati.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Telefono</th>
                      <th className="px-5 py-3 text-center">Livello</th>
                      <th className="px-5 py-3 text-right">Saldo Punti</th>
                      <th className="px-5 py-3 text-right">Azioni Cassa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clientiFiltrati.map((c) => {
                      const lvl = getLivello(c.puntiFedelta);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {c.nome} {c.cognome}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-slate-500">{c.telefono}</td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${lvl.badge}`}
                            >
                              <span>{lvl.icon}</span> {lvl.nome}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-base font-bold text-emerald-600 font-mono">
                              {c.puntiFedelta}
                            </span>{" "}
                            <span className="text-xs text-slate-400">pt</span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedClienteId(c.id);
                                setPuntiDaAssegnare(10);
                                setIsAssegnaOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                            >
                              + Punti
                            </button>
                            <button
                              onClick={() => {
                                setRiscattaCliente(c);
                                setIsRiscattaOpen(true);
                              }}
                              disabled={c.puntiFedelta < 100}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                                c.puntiFedelta >= 100
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                  : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                              }`}
                            >
                              🎁 Riscatta
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-slate-100">
                {clientiFiltrati.map((c) => {
                  const lvl = getLivello(c.puntiFedelta);
                  return (
                    <div key={c.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            {c.nome} {c.cognome}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{c.telefono}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-emerald-600 font-mono">{c.puntiFedelta}</span>
                          <span className="text-xs text-slate-400 ml-1">pt</span>
                          <div className="mt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${lvl.badge}`}
                            >
                              <span>{lvl.icon}</span> {lvl.nome}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedClienteId(c.id);
                            setPuntiDaAssegnare(10);
                            setIsAssegnaOpen(true);
                          }}
                          className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 active:bg-emerald-100 transition border border-emerald-200 text-center"
                        >
                          + Assegna Punti
                        </button>
                        <button
                          onClick={() => {
                            setRiscattaCliente(c);
                            setIsRiscattaOpen(true);
                          }}
                          disabled={c.puntiFedelta < 100}
                          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition border text-center ${
                            c.puntiFedelta >= 100
                              ? "bg-emerald-50 text-emerald-700 active:bg-emerald-100 border-emerald-200"
                              : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                          }`}
                        >
                          🎁 Riscatta Premio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Storico Ultimi Movimenti */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ultimi Movimenti in Cassa</h2>
              <p className="text-xs text-slate-500">Tracciamento in tempo reale di accrediti e riscatti</p>
            </div>
          </div>

          {ultimiMovimenti.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nessun movimento recente registrato.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimiMovimenti.map((mov) => (
                <div key={mov.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        mov.tipo === "ACCREDITO"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {mov.tipo === "ACCREDITO" ? "+" : "-"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {mov.cliente.nome} {mov.cliente.cognome}
                      </p>
                      <p className="text-xs text-slate-500">{mov.descrizione || "Movimento cassa"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        mov.tipo === "ACCREDITO" ? "text-emerald-600" : "text-emerald-600"
                      }`}
                    >
                      {mov.tipo === "ACCREDITO" ? `+${mov.punti}` : `-${mov.punti}`} pt
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {new Date(mov.createdAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Assegna Punti */}
      {isAssegnaOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Assegna Punti al Cliente</h3>
              <button
                onClick={() => setIsAssegnaOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssegnaPunti} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Seleziona Cliente
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  required
                >
                  <option value="" disabled>
                    -- Scegli un cliente --
                  </option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome} ({c.puntiFedelta} pt attuali)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Punti da Accreditare
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 25, 50, 100].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setPuntiDaAssegnare(preset)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        puntiDaAssegnare === preset
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      +{preset} pt
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={puntiDaAssegnare}
                  onChange={(e) => setPuntiDaAssegnare(parseInt(e.target.value) || 0)}
                  className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Motivo / Note (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Spesa piega + trattamento colore"
                  value={descrizioneMovimento}
                  onChange={(e) => setDescrizioneMovimento(e.target.value)}
                  className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssegnaOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedClienteId}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition"
                >
                  {submitting ? "Accredito..." : "Conferma Accredito"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Riscatta Premio */}
      {isRiscattaOpen && riscattaCliente && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Riscatta Premio Fedeltà</h3>
                <p className="text-xs text-slate-500">
                  Per {riscattaCliente.nome} {riscattaCliente.cognome} (Saldo: {riscattaCliente.puntiFedelta} pt)
                </p>
              </div>
              <button
                onClick={() => setIsRiscattaOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Scegli il Premio da Riscattare
              </label>

              {premiReali.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Nessun premio impostato: si aggiungono in Impostazioni, sezione Fedeltà.
                </p>
              ) : (
                [...premiReali]
                  .sort((x, y) => x.pointsRequired - y.pointsRequired)
                  .map((pr) => {
                    const ok = riscattaCliente.puntiFedelta >= pr.pointsRequired;
                    const scelto = premioSelezionato?.id === pr.id;
                    return (
                      <div
                        key={pr.id}
                        onClick={() => ok && setPremioSelezionato({ id: pr.id, punti: pr.pointsRequired, nome: pr.name })}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                          !ok
                            ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                            : scelto
                            ? "border-emerald-500 bg-emerald-50/50 cursor-pointer"
                            : "border-slate-200 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">🎁 {pr.name}</p>
                          {!ok && <p className="text-xs text-slate-500">Mancano punti per questo premio</p>}
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100/60 px-2 py-1 rounded-md">
                          {pr.pointsRequired} pt
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRiscattaOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleRiscattaPremio}
                disabled={submitting || !premioSelezionato || riscattaCliente.puntiFedelta < premioSelezionato.punti}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition"
              >
                {submitting ? "Riscatto in corso..." : "Conferma e scala i punti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AddonModuleGuard>
  );
}
