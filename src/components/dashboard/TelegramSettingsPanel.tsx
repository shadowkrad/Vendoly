"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Bot, Users, ExternalLink, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";

export interface TelegramSettingsData {
  enabled: boolean;
  botToken: string;
  botUsername?: string;
  staffChatId: string;
}

interface TelegramSettingsPanelProps {
  data: TelegramSettingsData;
  onChange: (updated: TelegramSettingsData) => void;
}

export default function TelegramSettingsPanel({ data, onChange }: TelegramSettingsPanelProps) {
  const [verifying, setVerifying] = useState(false);
  const [testingStaff, setTestingStaff] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleVerifyToken = async () => {
    if (!data.botToken?.trim()) {
      setTestResult({ ok: false, message: "Inserisci un token bot prima di verificare." });
      return;
    }

    setVerifying(true);
    setTestResult(null);

    try {
      const res = await fetch(`https://api.telegram.org/bot${data.botToken.trim()}/getMe`);
      const tg = await res.json();

      if (tg.ok && tg.result) {
        onChange({
          ...data,
          botUsername: tg.result.username,
        });
        setTestResult({
          ok: true,
          message: `Bot verificato con successo: @${tg.result.username} (${tg.result.first_name})`,
        });
      } else {
        setTestResult({
          ok: false,
          message: tg.description || "Token bot non valido o non riconosciuto da Telegram.",
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || "Errore di connessione ai server Telegram.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleTestStaffMessage = async () => {
    if (!data.botToken?.trim() || !data.staffChatId?.trim()) {
      setTestResult({ ok: false, message: "Token bot e ID Chat Staff sono entrambi obbligatori per il test." });
      return;
    }

    setTestingStaff(true);
    setTestResult(null);

    try {
      const res = await fetch(`https://api.telegram.org/bot${data.botToken.trim()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: data.staffChatId.trim(),
          text: "🚀 <b>Notifica di Prova Taaaac Telegram Staff</b>\n\n✅ Collegamento riuscito! Le notifiche delle nuove comande e prenotazioni arriveranno in questo gruppo in tempo reale.",
          parse_mode: "HTML",
        }),
      });

      const tg = await res.json();
      if (tg.ok) {
        setTestResult({
          ok: true,
          message: "Messaggio di prova inviato con successo nel gruppo dello Staff!",
        });
      } else {
        setTestResult({
          ok: false,
          message: `Telegram ha restituito un errore: ${tg.description || "Impossibile recapitare il messaggio"}`,
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || "Errore di rete durante l'invio del messaggio di prova." });
    } finally {
      setTestingStaff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intestazione Sezione */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-500" />
            <span>Telegram Hub &amp; Canali Staff</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ricevi le comande e le prenotazioni in tempo reale sul gruppo Telegram del tuo staff e invia notifiche gratuite ai clienti.
          </p>
        </div>

        {/* Toggle Abilitazione Generale */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="text-xs font-bold text-slate-700">
            {data.enabled ? "Canale Attivo" : "Canale Disattivato"}
          </span>
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => onChange({ ...data, enabled: e.target.checked })}
            className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Feedback Alert */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            testResult.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Guida Passo-Passo BotFather */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
          <Bot className="w-4 h-4 text-sky-600" />
          <span>Come Creare il Tuo Bot Telegram in 3 Passi (Gratuito e Senza Limiti)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1">
            <span className="font-bold text-sky-700">1. Cerca @BotFather</span>
            <p className="text-[11px] text-slate-500">
              Apri Telegram, cerca l&apos;utente ufficiale <b>@BotFather</b> (con la spunta blu) e avvia la chat.
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1">
            <span className="font-bold text-sky-700">2. Invia /newbot</span>
            <p className="text-[11px] text-slate-500">
              Digita <code>/newbot</code>, inserisci il nome del tuo locale e uno username che finisca con &ldquo;bot&rdquo; (es. <i>MecoRistoranteBot</i>).
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-sky-100 space-y-1">
            <span className="font-bold text-sky-700">3. Copia il Token API</span>
            <p className="text-[11px] text-slate-500">
              BotFather ti fornirà un codice segreto (es. <code>789123:ABC...</code>). Incollalo nel campo qui sotto.
            </p>
          </div>
        </div>
      </div>

      {/* Configurazione Bot Token */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <span>Token del Tuo Bot Telegram</span>
        </h3>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={data.botToken}
              onChange={(e) => onChange({ ...data, botToken: e.target.value })}
              placeholder="es. 8192837465:AAFx9_Zg..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVerifyToken}
              disabled={verifying || !data.botToken}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verifica Bot</span>
            </button>
          </div>

          {data.botUsername && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Bot attivo e verificato: <b>@{data.botUsername}</b></span>
              <a
                href={`https://t.me/${data.botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-sky-600 hover:underline flex items-center gap-1 font-bold text-[11px]"
              >
                <span>Apri su Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Configurazione Canale Staff (Gruppo Cucina / Sala) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Gruppo o Chat dello Staff (Ricezione Comande &amp; Notifiche)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Aggiungi il tuo bot al gruppo Telegram del personale (es. <i>&ldquo;Comande Cucina&rdquo;</i> o <i>&ldquo;Staff Sala&rdquo;</i>) e inserisci qui l&apos;ID della chat o del gruppo.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={data.staffChatId}
              onChange={(e) => onChange({ ...data, staffChatId: e.target.value })}
              placeholder="es. -1001234567890 oppure il tuo ID utente personale"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTestStaffMessage}
              disabled={testingStaff || !data.botToken || !data.staffChatId}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {testingStaff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Invia Notifica di Prova</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            💡 <b>Come trovare l&apos;ID del gruppo?</b> Aggiungi il bot <code>@myidbot</code> o inoltra un messaggio del gruppo al bot <code>@userinfobot</code> su Telegram. Gli ID dei gruppi iniziano solitamente con il segno meno (es. <code>-100...</code>).
          </div>
        </div>
      </div>
    </div>
  );
}
