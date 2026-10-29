"use client";

import OmnichannelSyncCard from "@/components/dashboard/OmnichannelSyncCard";

import { useState, useEffect } from "react";
import {
  Clock,
  Save,
  Check,
  AlertCircle,
  Calendar,
  Plus,
  X,
  Trash2,
  Store,
  Sparkles,
} from "lucide-react";

interface EccezioneCalendario {
  id: string;
  data: string;
  tipo: "CHIUSURA" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE";
  titolo: string;
  orarioApertura?: string | null;
  orarioChiusura?: string | null;
  pausaInizio?: string | null;
  pausaFine?: string | null;
  note?: string | null;
}

interface FestivitaNazionale {
  data: string;
  nome: string;
}

export default function VendolyOrariPage() {
  const [activeTab, setActiveTab] = useState<"standard" | "festivita">("standard");

  // Orari Negozio Standard (Feriali, Sabato, Domenica)
  const [orariFeriali, setOrariFeriali] = useState("09:30 – 13:00 / 15:30 – 19:30");
  const [orariSabato, setOrariSabato] = useState("09:30 – 19:30 (Continuato)");
  const [orariDomenica, setOrariDomenica] = useState("Chiuso");
  const [savingStandard, setSavingStandard] = useState(false);
  const [standardFeedback, setStandardFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Festività & Eccezioni
  const [eccezioni, setEccezioni] = useState<EccezioneCalendario[]>([]);
  const [festivitaNazionali, setFestivitaNazionali] = useState<FestivitaNazionale[]>([]);
  const [rispettaFestivita, setRispettaFestivita] = useState(true);
  const [savingFestivita, setSavingFestivita] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal Nuova Data Speciale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTipo, setNewTipo] = useState<"CHIUSURA" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE">("APERTURA_STRAORDINARIA");
  const [newTitolo, setNewTitolo] = useState("");
  const [newOraInizio, setNewOraInizio] = useState("09:30");
  const [newOraFine, setNewOraFine] = useState("19:30");
  const [newPausaInizio, setNewPausaInizio] = useState("");
  const [newPausaFine, setNewPausaFine] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submittingEcc, setSubmittingEcc] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "festivita") {
        setActiveTab("festivita");
      }
    }

    // Carica orari negozio correnti
    fetch("/api/impostazioni")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.orariFeriali) setOrariFeriali(data.orariFeriali);
          if (data.orariSabato) setOrariSabato(data.orariSabato);
          if (data.orariDomenica) setOrariDomenica(data.orariDomenica);
        }
      })
      .catch((err) => console.error("Errore fetch impostazioni:", err));

    // Carica eccezioni e festività
    fetch("/api/calendario-eccezioni")
      .then((r) => r.json())
      .then((calData) => {
        if (calData && !calData.error) {
          setEccezioni(calData.eccezioni || []);
          setFestivitaNazionali(calData.festivitaNazionali || []);
          setRispettaFestivita(calData.rispettaFestivitaNazionali ?? true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore fetch calendario eccezioni:", err);
        setLoading(false);
      });
  }, []);

  const handleToggleFestivita = async (val: boolean) => {
    setSavingFestivita(true);
    try {
      const res = await fetch("/api/calendario-eccezioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rispettaFestivitaNazionali: val }),
      });
      if (res.ok) {
        setRispettaFestivita(val);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFestivita(false);
    }
  };

  const handleSaveStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStandard(true);
    setStandardFeedback(null);
    try {
      const res = await fetch("/api/impostazioni", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orariFeriali,
          orariSabato,
          orariDomenica,
        }),
      });
      if (res.ok) {
        setStandardFeedback({
          type: "success",
          text: "Orari standard del negozio salvati con successo!",
        });
      } else {
        setStandardFeedback({
          type: "error",
          text: "Errore durante il salvataggio degli orari.",
        });
      }
    } catch {
      setStandardFeedback({
        type: "error",
        text: "Errore di connessione durante il salvataggio.",
      });
    } finally {
      setSavingStandard(false);
    }
  };

  const handleCreateEccezione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTitolo) return;

    setSubmittingEcc(true);
    try {
      const res = await fetch("/api/calendario-eccezioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: newDate,
          tipo: newTipo,
          titolo: newTitolo,
          orarioApertura: newTipo !== "CHIUSURA" ? newOraInizio : null,
          orarioChiusura: newTipo !== "CHIUSURA" ? newOraFine : null,
          pausaInizio: newTipo !== "CHIUSURA" && newPausaInizio ? newPausaInizio : null,
          pausaFine: newTipo !== "CHIUSURA" && newPausaFine ? newPausaFine : null,
          note: newNote,
          isAperto: newTipo !== "CHIUSURA",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEccezioni((prev) => {
          const filtered = prev.filter((item) => item.data !== newDate);
          return [...filtered, data.eccezione].sort((a, b) => a.data.localeCompare(b.data));
        });
        setIsModalOpen(false);
        setNewDate("");
        setNewTitolo("");
        setNewNote("");
        setNewPausaInizio("");
        setNewPausaFine("");
      } else {
        alert("Errore durante il salvataggio dell'eccezione");
      }
    } catch (err) {
      console.error(err);
      alert("Errore di connessione");
    } finally {
      setSubmittingEcc(false);
    }
  };

  const handleDeleteEccezione = async (id: string, dataStr: string) => {
    if (!confirm(`Vuoi rimuovere l'impostazione speciale per la data ${dataStr}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/calendario-eccezioni", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEccezioni((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione");
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            <span>Orari Negozio & Festività Nazionali</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configura gli orari settimanali del negozio fisico, le festività italiane e le aperture o chiusure straordinarie per lo shopping.
          </p>
        </div>

        {/* Omnichannel Sync Hub v1.1.0 */}
      <div className="mt-4 mb-4">
        <OmnichannelSyncCard
          eccezioni={typeof eccezioni !== "undefined" ? eccezioni : []}
          accentColor="emerald"
        />
      </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("standard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "standard"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orari Settimanali Negozio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("festivita")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "festivita"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Festività & Date Speciali</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Orari Standard Negozio */}
      {activeTab === "standard" && (
        <form onSubmit={handleSaveStandard} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Orari di Apertura Negozio Fisico</h2>
                <p className="text-xs text-slate-500">
                  Definisci gli orari mostrati ai clienti sul sito, nel footer e per il ritiro in sede.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Lunedì – Venerdì (Feriali)</label>
                <input
                  type="text"
                  value={orariFeriali}
                  onChange={(e) => setOrariFeriali(e.target.value)}
                  placeholder="09:30 – 13:00 / 15:30 – 19:30"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">Es. 09:30 – 13:00 / 15:30 – 19:30</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Sabato</label>
                <input
                  type="text"
                  value={orariSabato}
                  onChange={(e) => setOrariSabato(e.target.value)}
                  placeholder="09:30 – 19:30 (Continuato)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">Es. Orario continuato o spezzato</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Domenica</label>
                <input
                  type="text"
                  value={orariDomenica}
                  onChange={(e) => setOrariDomenica(e.target.value)}
                  placeholder="Chiuso"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400">Es. Chiuso oppure 10:00 – 13:00 / 16:00 – 20:00</p>
              </div>
            </div>

            {standardFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  standardFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {standardFeedback.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{standardFeedback.text}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingStandard}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingStandard ? "Salvataggio..." : "Salva Orari Negozio"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Festività & Date Speciali */}
      {activeTab === "festivita" && (
        <div className="space-y-6">
          {/* Card Toggle Festività Nazionali */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇮🇹</span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Rispetta Festività Nazionali Italiane
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Se attivato, il negozio fisico risulterà automaticamente chiuso e protetto da ritiri non presidiati nei 12 giorni festivi ufficiali del calendario italiano (Natale, Capodanno, Ferragosto, Pasqua, Pasquetta, 25 Aprile, 1 Maggio, 2 Giugno, ecc.).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rispettaFestivita}
                  disabled={savingFestivita}
                  onChange={(e) => handleToggleFestivita(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-700 min-w-[70px]">
                {rispettaFestivita ? "Abilitato" : "Disabilitato"}
              </span>
            </div>
          </div>

          {/* Elenco Festività Nazionali Riconosciute (Chips) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Festività Italiane Riconosciute ({new Date().getFullYear()})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Calcolo Pasqua e Lunedì dell&apos;Angelo automatico
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {festivitaNazionali.map((fest) => {
                const ecc = eccezioni.find((e) => e.data === fest.data);
                return (
                  <div
                    key={fest.data}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                      ecc
                        ? "bg-amber-50/70 border-amber-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 truncate">{fest.nome}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {formatDateDisplay(fest.data)}
                      </p>
                    </div>
                    {ecc && (
                      <span className="mt-1.5 inline-block text-[9px] font-black uppercase text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                        Eccezione: {ecc.tipo === "CHIUSURA" ? "Chiuso" : "Aperto"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sezione Eccezioni & Date Speciali */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Aperture e Chiusure Straordinarie Personalizzate</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Programma aperture eccezionali (es. shopping domenicale natalizio o saldi), ferie o orari speciali per singoli giorni.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Data Speciale</span>
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Caricamento calendario...</p>
            ) : eccezioni.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <Store className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Nessuna eccezione o data speciale inserita</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Tutte le giornate seguono gli orari settimanali standard e le festività nazionali ufficiali.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {eccezioni.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      item.tipo === "CHIUSURA"
                        ? "bg-rose-50/50 border-rose-200 text-rose-950"
                        : "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.tipo === "CHIUSURA"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.tipo === "CHIUSURA" ? "Chiusura" : "Apertura Speciale"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {formatDateDisplay(item.data)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 pt-1">{item.titolo}</h4>

                      {item.tipo !== "CHIUSURA" && item.orarioApertura && item.orarioChiusura && (
                        <p className="text-xs font-semibold text-emerald-700">
                          Orario: {item.orarioApertura} – {item.orarioChiusura}
                          {item.pausaInizio && item.pausaFine && ` (Pausa: ${item.pausaInizio} - ${item.pausaFine})`}
                        </p>
                      )}

                      {item.note && (
                        <p className="text-[11px] text-slate-600 italic mt-1">{item.note}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteEccezione(item.id, item.data)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 p-1 hover:bg-rose-100 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rimuovi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Aggiungi Data Speciale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Nuova Data Speciale</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEccezione} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Data (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tipo di Eccezione</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTipo("APERTURA_STRAORDINARIA")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      newTipo === "APERTURA_STRAORDINARIA"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ✨ Apertura Straordinaria
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTipo("CHIUSURA")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      newTipo === "CHIUSURA"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🛑 Chiusura Speciale
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Titolo / Motivo</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Apertura Domenicale Natalizia, Ponte, Saldi..."
                  value={newTitolo}
                  onChange={(e) => setNewTitolo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {newTipo !== "CHIUSURA" && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Orari di Apertura per questa Giornata
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500">Apertura</label>
                      <input
                        type="time"
                        value={newOraInizio}
                        onChange={(e) => setNewOraInizio(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Chiusura</label>
                      <input
                        type="time"
                        value={newOraFine}
                        onChange={(e) => setNewOraFine(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Note Interne (Opzionali)</label>
                <textarea
                  rows={2}
                  placeholder="Note a uso del personale o dettagli promozionali..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submittingEcc}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {submittingEcc ? "Salvataggio..." : "Salva Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
