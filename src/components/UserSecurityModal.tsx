"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  Lock,
} from "lucide-react";

interface TrustedDevice {
  id: string;
  deviceName: string;
  ipAddress: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface AccessLog {
  id: string;
  esito: string;
  ipAddress: string;
  deviceType: string;
  userAgent: string | null;
  mfaUsed: boolean;
  createdAt: string;
}

interface UserSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function UserSecurityModal({ isOpen, onClose, userEmail }: UserSecurityModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"mfa" | "devices" | "logs">("mfa");
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);

  // Setup MFA state
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "confirming">("idle");
  const [secret, setSecret] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Disable MFA state
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSecurityStatus();
    } else {
      resetSetup();
    }
  }, [isOpen]);

  function resetSetup() {
    setSetupStep("idle");
    setSecret("");
    setQrCodeDataUrl("");
    setBackupCodes([]);
    setVerifyCode("");
    setShowDisableConfirm(false);
    setDisablePassword("");
    setMessage(null);
  }

  async function loadSecurityStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/security");
      if (res.ok) {
        const data = await res.json();
        setMfaEnabled(data.mfaEnabled);
        setDevices(data.trustedDevices || []);
        setLogs(data.accessLogs || []);
      }
    } catch (e) {
      console.error("Errore caricamento sicurezza:", e);
    } finally {
      setLoading(false);
    }
  }

  async function startMfaSetup() {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore inizializzazione MFA");

      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setBackupCodes(data.backupCodes || []);
      setSetupStep("qr");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmMfaEnable() {
    if (!verifyCode.trim()) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          secret,
          code: verifyCode,
          backupCodes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore attivazione MFA");

      setMfaEnabled(true);
      setSetupStep("idle");
      setMessage({ type: "success", text: "Autenticazione a Due Fattori attivata con successo!" });
      loadSecurityStatus();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisableMfa() {
    if (!disablePassword) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/security/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore disattivazione MFA");

      setMfaEnabled(false);
      setShowDisableConfirm(false);
      setDisablePassword("");
      setMessage({ type: "success", text: "Autenticazione a Due Fattori disattivata." });
      loadSecurityStatus();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  async function revokeDevice(id: string) {
    if (!confirm("Vuoi rimuovere questo dispositivo dai dispositivi fidati?")) return;
    try {
      const res = await fetch(`/api/user/security/device/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDevices(devices.filter((d) => d.id !== id));
        setMessage({ type: "success", text: "Dispositivo rimosso con successo." });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function revokeAllSessions() {
    if (
      !confirm(
        "Attenzione: questa azione disconnetterà immediatamente tutti gli altri computer, tablet e smartphone su cui è aperto il tuo account. Confermi?"
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/user/security", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        loadSecurityStatus();
      } else {
        throw new Error(data.error || "Errore revoca");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  }

  function copyToClipboard(text: string, isBackup: boolean = false) {
    navigator.clipboard.writeText(text);
    if (isBackup) {
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modale */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sicurezza & Autenticazione</h3>
              <p className="text-xs text-slate-500 font-medium">Gestisci MFA, dispositivi autorizzati e log di accesso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab di Navigazione Interni */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab("mfa")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "mfa"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>2FA (MFA)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                mfaEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab("devices")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "devices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Dispositivi Fidati ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "logs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cronologia Accessi</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Contenuto Schede */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span>Caricamento impostazioni di sicurezza...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: MFA */}
              {activeTab === "mfa" && (
                <div className="space-y-6">
                  {/* Stato Attuale */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          mfaEnabled
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        {mfaEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Autenticazione a Due Fattori (TOTP)</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              mfaEnabled
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {mfaEnabled ? "Attiva e Protetta" : "Disattivata"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {mfaEnabled
                            ? "Il tuo account è protetto con codice monouso generato dal tuo smartphone (Google Authenticator, Apple o Authy)."
                            : "Proteggi il tuo account richiedendo un codice a 6 cifre ad ogni nuovo accesso."}
                        </p>
                      </div>
                    </div>

                    {!mfaEnabled ? (
                      setupStep === "idle" && (
                        <button
                          onClick={startMfaSetup}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all shrink-0 cursor-pointer"
                        >
                          Attiva 2FA
                        </button>
                      )
                    ) : (
                      !showDisableConfirm && (
                        <button
                          onClick={() => setShowDisableConfirm(true)}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                        >
                          Disattiva
                        </button>
                      )
                    )}
                  </div>

                  {/* Wizard di Attivazione 2FA */}
                  {setupStep === "qr" && (
                    <div className="p-6 rounded-3xl border border-blue-200 bg-blue-50/40 space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 font-mono">
                            STEP 1 DI 2 • SCANSIONA IL QR CODE
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">
                            Inquadra con la tua App di Autenticazione
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Apri Google Authenticator, Apple Portachiavi o Authy e inquadra il codice sottostante.
                          </p>
                        </div>
                        <button
                          onClick={resetSetup}
                          className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
                        >
                          Annulla
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        {/* Immagine QR Code */}
                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="QR Code TOTP"
                              className="w-44 h-44 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                              Generazione QR Code...
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                            Standard TOTP (RFC 6238)
                          </p>
                        </div>

                        {/* Chiave Manuale & Istruzioni */}
                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              Non puoi inquadrare? Inserisci la chiave:
                            </span>
                            <div className="flex items-center gap-2">
                              <code className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 text-xs tracking-wider flex-1 select-all truncate">
                                {secret}
                              </code>
                              <button
                                onClick={() => copyToClipboard(secret)}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shrink-0"
                                title="Copia Chiave"
                              >
                                {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* 8 Codici di Recupero (Backup Codes) */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-slate-700">
                                🔑 Codici di Emergenza (Salvali ora):
                              </span>
                              <button
                                onClick={() => copyToClipboard(backupCodes.join("\n"), true)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                {copiedBackupCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedBackupCodes ? "Copiati!" : "Copia tutti"}</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                              {backupCodes.map((code, idx) => (
                                <div key={idx} className="tracking-wider">
                                  {code}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Conservali in un luogo sicuro. Ti permetteranno di accedere se perdi il telefono.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* STEP 2: Inserisci il primo codice di verifica */}
                      <div className="pt-4 border-t border-blue-200/80">
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Inserisci il codice a 6 cifre mostrato sull'App per confermare l'attivazione:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                            className="w-40 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          />
                          <button
                            onClick={confirmMfaEnable}
                            disabled={actionLoading || verifyCode.length !== 6}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            {actionLoading ? "Verifica in corso..." : "Completa Attivazione"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Disattivazione con Password */}
                  {showDisableConfirm && (
                    <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                          Conferma Disattivazione 2FA
                        </h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                          Inserisci la tua password attuale per confermare la rimozione della protezione a due fattori:
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="password"
                          placeholder="La tua password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          className="bg-white border border-rose-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 flex-1 max-w-xs focus:outline-none focus:border-rose-600"
                        />
                        <button
                          onClick={handleDisableMfa}
                          disabled={actionLoading || !disablePassword}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          {actionLoading ? "Conferma..." : "Disattiva 2FA"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDisableConfirm(false);
                            setDisablePassword("");
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DISPOSITIVI FIDATI & KILL-SWITCH */}
              {activeTab === "devices" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Dispositivi Autorizzati</h4>
                      <p className="text-xs text-slate-500">
                        Dispositivi e browser che possono accedere senza far scattare l'allarme email.
                      </p>
                    </div>

                    <button
                      onClick={revokeAllSessions}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Disconnetti Tutte le Altre Sessioni</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {devices.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Nessun dispositivo memorizzato.</p>
                    ) : (
                      devices.map((d) => (
                        <div
                          key={d.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              {d.deviceName.toLowerCase().includes("smartphone") ||
                              d.deviceName.toLowerCase().includes("iphone") ? (
                                <Smartphone className="w-4 h-4" />
                              ) : d.deviceName.toLowerCase().includes("tablet") ? (
                                <Tablet className="w-4 h-4" />
                              ) : (
                                <Laptop className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{d.deviceName}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                IP: {d.ipAddress || "Sconosciuto"} • Ultimo accesso:{" "}
                                {new Date(d.lastSeenAt).toLocaleString("it-IT", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => revokeDevice(d.id)}
                            title="Rimuovi dispositivo"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: LOG DEGLI ACCESSI (AUDIT LOG) */}
              {activeTab === "logs" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Registro Ultimi Accessi</h4>
                      <p className="text-xs text-slate-500">Storico dei tentativi di login riusciti o respinti.</p>
                    </div>
                    <button
                      onClick={loadSecurityStatus}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Aggiorna</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-slate-50 font-bold text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <div className="col-span-3">Data e Ora</div>
                      <div className="col-span-3">Esito</div>
                      <div className="col-span-3">Indirizzo IP</div>
                      <div className="col-span-3">Dispositivo</div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {logs.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">Nessun log recente registrato.</div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-slate-50/70">
                            <div className="col-span-3 font-mono text-[11px] text-slate-600">
                              {new Date(log.createdAt).toLocaleString("it-IT", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="col-span-3">
                              {log.esito === "SUCCESS" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Riuscito {log.mfaUsed ? "(2FA)" : ""}</span>
                                </span>
                              ) : log.esito === "BLOCKED_BRUTE_FORCE" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  <AlertTriangle className="w-3 h-3 text-purple-600" />
                                  <span>Bloccato Bot</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>{log.esito === "FAILED_MFA" ? "MFA Errata" : "Pass Errata"}</span>
                                </span>
                              )}
                            </div>
                            <div className="col-span-3 font-mono text-slate-800">{log.ipAddress}</div>
                            <div className="col-span-3 text-slate-500 truncate" title={log.userAgent || ""}>
                              {log.deviceType}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
