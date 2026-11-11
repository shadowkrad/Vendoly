"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Check, Copy, ExternalLink, Gift, Mail, MessageCircle, Plus, RotateCcw } from "lucide-react";
import { puoRicevereMessaggi } from "@/lib/phone";

export interface MovimentoPuntiItem {
  id: string;
  punti: number;
  tipo: string;
  descrizione?: string | null;
  createdAt: string;
}

interface PremioFedelta {
  id: string;
  name: string;
  pointsRequired: number;
}

interface RegoleFedelta {
  enabled: boolean;
  pointsPerEuro: number;
  welcomeBonusPoints: number;
  minPointsToRedeem: number;
  rewards: PremioFedelta[];
}

export type AccentoPanel = "pink" | "amber" | "blue" | "indigo" | "emerald";

interface ClienteFedeltaPanelProps {
  clienteId: string;
  nomeCliente: string;
  telefono: string;
  email?: string | null;
  punti: number;
  tokenTessera?: string | null;
  movimenti: MovimentoPuntiItem[];
  nomeAttivita?: string;
  dark?: boolean;
  accent?: AccentoPanel;
  onSaldoAggiornato?: () => void | Promise<void>;
}

function formattaNumeroWhatsApp(phone: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("3")) {
    return `39${digits}`;
  }
  return digits;
}

function costruisciTestoPredefinito(
  nomeCliente: string,
  nomeAttivita: string,
  punti: number,
  linkTessera: string
): string {
  const salutoNome = (nomeCliente || "").trim() || "Cliente";
  const attivita = (nomeAttivita || "").trim() || "la nostra attività";
  const rigaLink = linkTessera
    ? `Apri la tua tessera personale da questo link per vedere punti e premi disponibili:\n${linkTessera}`
    : "Chiedi il link personale della tua tessera alla nostra reception.";
  return (
    `Ciao ${salutoNome}! ✨\n\n` +
    `Ecco la tua Tessera Punti digitale di ${attivita}:\n` +
    `🎁 Saldo attuale: ${punti} punti\n\n` +
    `${rigaLink}\n\n` +
    `💡 Consiglio: una volta aperta dal telefono, salvala sulla schermata Home (come un'app) per averla sempre con te!`
  );
}

const TEMI_ACCENTO: Record<
  AccentoPanel,
  {
    cardBorder: string;
    btnPrimary: string;
    linkText: string;
    badgeSoft: string;
    outlineBtn: string;
  }
> = {
  pink: {
    cardBorder: "border-pink-100",
    btnPrimary: "bg-pink-600 hover:bg-pink-700 text-white",
    linkText: "text-pink-600 hover:text-pink-700",
    badgeSoft: "bg-pink-50 text-pink-700 border-pink-200",
    outlineBtn: "border-pink-200 text-pink-700 hover:bg-pink-50",
  },
  amber: {
    cardBorder: "border-amber-200",
    btnPrimary: "bg-amber-600 hover:bg-amber-700 text-white",
    linkText: "text-amber-700 hover:text-amber-800",
    badgeSoft: "bg-amber-50 text-amber-800 border-amber-200",
    outlineBtn: "border-amber-300 text-amber-800 hover:bg-amber-50",
  },
  blue: {
    cardBorder: "border-blue-100",
    btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    linkText: "text-blue-600 hover:text-blue-700",
    badgeSoft: "bg-blue-50 text-blue-700 border-blue-200",
    outlineBtn: "border-blue-200 text-blue-700 hover:bg-blue-50",
  },
  indigo: {
    cardBorder: "border-indigo-100",
    btnPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    linkText: "text-indigo-600 hover:text-indigo-700",
    badgeSoft: "bg-indigo-50 text-indigo-700 border-indigo-200",
    outlineBtn: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
  },
  emerald: {
    cardBorder: "border-emerald-100",
    btnPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    linkText: "text-emerald-700 hover:text-emerald-800",
    badgeSoft: "bg-emerald-50 text-emerald-700 border-emerald-200",
    outlineBtn: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  },
};

export default function ClienteFedeltaPanel({
  clienteId,
  nomeCliente,
  telefono,
  email,
  punti,
  tokenTessera,
  movimenti,
  nomeAttivita = "la nostra attività",
  dark = false,
  accent = "pink",
  onSaldoAggiornato,
}: ClienteFedeltaPanelProps) {
  const [origin, setOrigin] = useState("");
  const [regole, setRegole] = useState<RegoleFedelta | null>(null);
  const [importo, setImporto] = useState("");
  const [extraPunti, setExtraPunti] = useState("");
  const [lavoro, setLavoro] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "errore"; testo: string } | null>(null);

  const [testoPersonalizzato, setTestoPersonalizzato] = useState(false);
  const [oggettoCustom, setOggettoCustom] = useState("");
  const [messaggioCustom, setMessaggioCustom] = useState("");
  const [copiatoLink, setCopiatoLink] = useState(false);
  const [copiatoTesto, setCopiatoTesto] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const query = tokenTessera || telefono || nomeCliente;
    if (!query) return;
    let attivo = true;
    fetch(`/api/fedelta/cassa?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (attivo && data?.regole) {
          setRegole(data.regole);
        }
      })
      .catch(() => null);
    return () => {
      attivo = false;
    };
  }, [clienteId, tokenTessera, telefono, nomeCliente]);

  const linkRelativo = tokenTessera ? `/tessera/${tokenTessera}` : "";
  const linkCompleto = tokenTessera ? `${origin}${linkRelativo}` : "";

  const oggettoDefault = useMemo(
    () => `La tua Tessera Punti digitale — ${(nomeAttivita || "").trim() || "Fedeltà"}`,
    [nomeAttivita]
  );

  const messaggioDefault = useMemo(
    () => costruisciTestoPredefinito(nomeCliente, nomeAttivita, punti, linkCompleto || linkRelativo),
    [nomeCliente, nomeAttivita, punti, linkCompleto, linkRelativo]
  );

  const oggettoAttuale = testoPersonalizzato ? oggettoCustom : oggettoDefault;
  const messaggioAttuale = testoPersonalizzato ? messaggioCustom : messaggioDefault;

  const gestisciModificaTesto = (nuovoTesto: string) => {
    if (!testoPersonalizzato) {
      setOggettoCustom(oggettoDefault);
    }
    setTestoPersonalizzato(true);
    setMessaggioCustom(nuovoTesto);
  };

  const gestisciModificaOggetto = (nuovoOggetto: string) => {
    if (!testoPersonalizzato) {
      setMessaggioCustom(messaggioDefault);
    }
    setTestoPersonalizzato(true);
    setOggettoCustom(nuovoOggetto);
  };

  const ripristinaAutomatico = () => {
    setTestoPersonalizzato(false);
    setOggettoCustom("");
    setMessaggioCustom("");
  };

  const emailPulita =
    email && !email.endsWith(".schedly.local") && !email.endsWith(".local") ? email.trim() : "";
  const puoWhatsApp = puoRicevereMessaggi(telefono);
  const waHref = puoWhatsApp
    ? `https://wa.me/${formattaNumeroWhatsApp(telefono)}?text=${encodeURIComponent(messaggioAttuale)}`
    : undefined;
  const mailtoHref = `mailto:${encodeURIComponent(emailPulita)}?subject=${encodeURIComponent(
    oggettoAttuale
  )}&body=${encodeURIComponent(messaggioAttuale)}`;

  const anteprimaPunti =
    regole && importo && parseFloat(importo) > 0
      ? Math.floor(parseFloat(importo) * regole.pointsPerEuro)
      : 0;

  const operaCassa = async (corpo: Record<string, unknown>) => {
    setLavoro(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/fedelta/cassa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, ...corpo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Operazione non riuscita");
      }
      if (corpo.azione === "ACCREDITA") {
        setImporto("");
        setExtraPunti("");
        setFeedback({
          tipo: "ok",
          testo: `Accreditati ${data.accreditati} punti${
            data.bonusBenvenuto ? ` (più ${data.bonusBenvenuto} di benvenuto)` : ""
          }. Nuovo saldo: ${data.saldo} punti.`,
        });
      } else {
        setFeedback({
          tipo: "ok",
          testo: `Premio "${data.premio?.name || ""}" riscattato${
            data.buono?.codice ? `: creato il buono ${data.buono.codice}` : ""
          }. Saldo punti: ${data.saldo}.`,
        });
      }
      await onSaldoAggiornato?.();
    } catch (err: any) {
      setFeedback({ tipo: "errore", testo: err?.message || "Errore operazione punti" });
    } finally {
      setLavoro(false);
    }
  };

  const handleAccredita = async (e: React.FormEvent) => {
    e.preventDefault();
    const imp = parseFloat(importo);
    const man = parseInt(extraPunti, 10);
    await operaCassa({
      azione: "ACCREDITA",
      importo: Number.isFinite(imp) && imp > 0 ? imp : undefined,
      punti: Number.isFinite(man) && man > 0 ? man : undefined,
    });
  };

  const handleCopiaLink = async () => {
    if (!linkCompleto) return;
    try {
      await navigator.clipboard?.writeText(linkCompleto);
      setCopiatoLink(true);
      setTimeout(() => setCopiatoLink(false), 2000);
    } catch {
      // Fallback silenzioso
    }
  };

  const handleCopiaTesto = async () => {
    try {
      await navigator.clipboard?.writeText(messaggioAttuale);
      setCopiatoTesto(true);
      setTimeout(() => setCopiatoTesto(false), 2000);
    } catch {
      // Fallback silenzioso
    }
  };

  const tema = TEMI_ACCENTO[accent];

  const cardBg = dark
    ? "bg-slate-900 border border-slate-800 text-slate-100"
    : `bg-white border ${tema.cardBorder} text-gray-900`;
  const subBox = dark
    ? "bg-slate-950/70 border border-slate-800"
    : "bg-slate-50/70 border border-slate-200/80";
  const inputCls = dark
    ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
    : "w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-300";
  const mutedText = dark ? "text-slate-400" : "text-gray-500";
  const dividerCls = dark ? "divide-y divide-slate-800" : "divide-y divide-gray-100";

  return (
    <div className={`rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 ${cardBg}`}>
      {/* Intestazione con saldo e collegamenti tessera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
              dark
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : tema.badgeSoft
            }`}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}>
              Fedeltà, Punti &amp; Tessera Digitale
            </h2>
            <p className={`text-xs ${mutedText}`}>
              Saldo attuale:{" "}
              <strong className={dark ? "text-amber-400" : "text-gray-900"}>{punti} punti</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {tokenTessera && (
            <>
              <a
                href={linkRelativo}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold transition ${
                  dark
                    ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    : tema.outlineBtn
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Apri tessera
              </a>
              <button
                type="button"
                onClick={handleCopiaLink}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                  dark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {copiatoLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiatoLink ? "Link copiato" : "Copia link"}
              </button>
            </>
          )}
          <Link
            href="/dashboard/fedelta"
            className={`text-xs font-semibold hover:underline px-1 ${
              dark ? "text-amber-400" : tema.linkText
            }`}
          >
            Cassa fedeltà →
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.tipo === "ok"
              ? dark
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : dark
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.testo}
        </div>
      )}

      {/* Gestione punti nel profilo */}
      {regole && !regole.enabled ? (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            dark
              ? "bg-slate-950/60 border-slate-800 text-slate-400"
              : "bg-amber-50/60 border-amber-200 text-amber-900"
          }`}
        >
          <span>
            Il programma raccolta punti è disattivato. Puoi attivarlo in Impostazioni o nella sezione Fedeltà.
          </span>
          <Link href="/dashboard/fedelta" className="font-semibold underline shrink-0">
            Vai a Fedeltà →
          </Link>
        </div>
      ) : regole?.enabled ? (
        <div className={`rounded-xl p-4 space-y-4 ${subBox}`}>
          <form onSubmit={handleAccredita} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                Gestisci punti dal profilo
              </h3>
              <span className={`text-[11px] ${mutedText}`}>
                Regola: {regole.pointsPerEuro} pt / €
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Spesa effettuata (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.50"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  placeholder="es. 45.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
                  Punti extra manuali (+)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={extraPunti}
                  onChange={(e) => setExtraPunti(e.target.value)}
                  placeholder="es. 10"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={lavoro || (!importo && !extraPunti)}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer ${tema.btnPrimary}`}
              >
                <Plus className="w-3.5 h-3.5" />
                {lavoro ? "Salvataggio..." : "Accredita punti"}
              </button>
            </div>

            {(anteprimaPunti > 0 || (parseInt(extraPunti, 10) || 0) > 0) && (
              <p className={`text-[11px] font-medium ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                Verranno accreditati{" "}
                <strong>{anteprimaPunti + (parseInt(extraPunti, 10) || 0)} punti</strong>
                {anteprimaPunti > 0 && (parseInt(extraPunti, 10) || 0) > 0
                  ? ` (${anteprimaPunti} da spesa + ${parseInt(extraPunti, 10)} extra)`
                  : ""}
                .
              </p>
            )}
          </form>

          {regole.rewards && regole.rewards.length > 0 && (
            <div className={`pt-3 border-t ${dark ? "border-slate-800" : "border-slate-200"} space-y-2`}>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                <Gift className="w-3.5 h-3.5" />
                <span>Premi riscattabili</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {regole.rewards.map((p) => {
                  const ok = punti >= p.pointsRequired && punti >= regole.minPointsToRedeem;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border text-xs ${
                        dark
                          ? "bg-slate-900 border-slate-800"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>
                          {p.name}
                        </div>
                        <div className={`text-[11px] ${mutedText}`}>{p.pointsRequired} punti</div>
                      </div>
                      <button
                        type="button"
                        disabled={!ok || lavoro}
                        onClick={() => {
                          if (confirm(`Riscattare "${p.name}" e scalare ${p.pointsRequired} punti?`)) {
                            operaCassa({ azione: "RISCATTA", premioId: p.id });
                          }
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-35 cursor-pointer"
                      >
                        Riscatta
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Invio Manuale Tessera Punti (WhatsApp & Email) */}
      <div className={`rounded-xl p-4 space-y-3 ${subBox}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
              Invia Tessera Punti (Invio Manuale WhatsApp &amp; Email)
            </h3>
            <p className={`text-[11px] mt-0.5 ${mutedText}`}>
              Il testo si genera in automatico con il saldo e il link della tessera. Puoi modificarlo prima dell&apos;invio.
            </p>
          </div>
          {testoPersonalizzato && (
            <button
              type="button"
              onClick={ripristinaAutomatico}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer shrink-0 ${
                dark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-gray-200 text-gray-600 hover:bg-white"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Ripristina testo automatico
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
              Oggetto Email
            </label>
            <input
              type="text"
              value={oggettoAttuale}
              onChange={(e) => gestisciModificaOggetto(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={`block text-[11px] font-semibold mb-1 ${mutedText}`}>
              Testo pronto per WhatsApp ed Email
            </label>
            <textarea
              rows={5}
              value={messaggioAttuale}
              onChange={(e) => gestisciModificaTesto(e.target.value)}
              className={`${inputCls} font-sans leading-relaxed`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {puoWhatsApp ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Invia su WhatsApp
            </a>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-medium ${
                dark
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              WhatsApp non disponibile (numero fisso o mancante)
            </span>
          )}

          <a
            href={mailtoHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition"
          >
            <Mail className="w-3.5 h-3.5" />
            Invia via Email
          </a>

          <button
            type="button"
            onClick={handleCopiaTesto}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              dark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {copiatoTesto ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiatoTesto ? "Testo copiato!" : "Copia testo"}
          </button>

          {!emailPulita && (
            <span className={`text-[11px] ${mutedText}`}>
              (Nessuna email in anagrafica: si aprirà la bozza da indirizzare)
            </span>
          )}
        </div>
      </div>

      {/* Movimenti punti */}
      <div className="space-y-2">
        <h3 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
          Ultimi movimenti punti
        </h3>
        {movimenti.length === 0 ? (
          <p className={`text-xs ${mutedText}`}>Nessun movimento punti per questo cliente.</p>
        ) : (
          <div className={dividerCls}>
            {movimenti.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <p className={`font-medium truncate ${dark ? "text-slate-200" : "text-gray-800"}`}>
                    {m.descrizione || (m.tipo === "RISCATTO" ? "Riscatto premio" : "Accredito punti")}
                  </p>
                  <p className={`text-[11px] ${mutedText}`}>
                    {new Date(m.createdAt).toLocaleString("it-IT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    m.tipo === "RISCATTO"
                      ? dark
                        ? "text-rose-400"
                        : "text-rose-600"
                      : dark
                        ? "text-emerald-400"
                        : "text-emerald-600"
                  }`}
                >
                  {m.tipo === "RISCATTO" ? `−${m.punti}` : `+${m.punti}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
