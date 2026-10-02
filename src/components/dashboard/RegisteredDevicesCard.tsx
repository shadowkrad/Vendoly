"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Tablet,
  Laptop,
  Fingerprint,
  Shield,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Lock,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

interface RegisteredDeviceItem {
  id: string;
  deviceName: string;
  deviceType: string;
  status: "ACTIVE" | "REVOKED";
  lastIp?: string;
  userAgent?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export default function RegisteredDevicesCard() {
  const [devices, setDevices] = useState<RegisteredDeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/devices");
      const data = await res.json();
      if (res.ok && data.devices) {
        setDevices(data.devices);
      }
    } catch (err: any) {
      console.error("Errore caricamento dispositivi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setActionMessage(null);

    try {
      // 1. Richiedi opzioni challenge al server
      const optRes = await fetch("/api/auth/device/register-options", { method: "POST" });
      if (!optRes.ok) {
        const errData = await optRes.json();
        throw new Error(errData.error || "Impossibile avviare registrazione");
      }
      const options = await optRes.json();

      // 2. Chiedi al dispositivo sblocco nativo (FaceID / Impronta / PIN)
      const regResponse = await startRegistration(options);

      // 3. Invia risposta al server per validazione e salvataggio
      const verifyRes = await fetch("/api/auth/device/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: regResponse,
          deviceName: deviceNameInput.trim() || undefined,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Verifica dispositivo fallita");
      }

      showToast(verifyData.message || "Dispositivo collegato con successo!", "success");
      setShowRegisterForm(false);
      setDeviceNameInput("");
      await loadDevices();
    } catch (err: any) {
      showToast(err.message || "Errore durante la registrazione", "error");
    } finally {
      setRegistering(false);
    }
  };

  const handleRevokeDevice = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler scollegare "${name}" da remoto? Il dispositivo non potrà più accedere con biometria o PIN.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/devices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Dispositivo scollegato!", "success");
        await loadDevices();
      } else {
        showToast(data.error || "Errore durante lo scollegamento", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Errore di connessione", "error");
    }
  };

  const getDeviceIcon = (type: string, userAgent?: string) => {
    const ua = (userAgent || "").toLowerCase();
    if (type === "tablet" || ua.includes("ipad") || ua.includes("tablet")) {
      return <Tablet className="w-5 h-5 text-indigo-600" />;
    }
    if (type === "mobile" || ua.includes("iphone") || ua.includes("android")) {
      return <Smartphone className="w-5 h-5 text-emerald-600" />;
    }
    return <Laptop className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Dispositivi e Accessi Rapidi (PWA)</h2>
            <p className="text-xs text-slate-500">
              Sblocca Vendoly da smartphone o tablet con FaceID, impronta o PIN del dispositivo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDevices}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition cursor-pointer"
            title="Aggiorna lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowRegisterForm((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Collega Questo Dispositivo
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Form di Registrazione Dispositivo Corrente */}
      {showRegisterForm && (
        <form
          onSubmit={handleRegisterDevice}
          className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              Registra Questo Dispositivo come Fidato
            </span>
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Assegna un nome riconoscibile a questo dispositivo (es. <em>"iPhone Cassa Bancone"</em>, <em>"iPad Magazzino"</em>).
            Al salvataggio, il tuo browser ti chiederà di confermare con FaceID, impronta o PIN del dispositivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nome dispositivo (es. iPhone 15 di Alessio)"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              required
            />
            <button
              type="submit"
              disabled={registering}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Fingerprint className="w-4 h-4" />
              {registering ? "Conferma sul dispositivo..." : "Attiva Sblocco Biometrico"}
            </button>
          </div>
        </form>
      )}

      {/* Lista Dispositivi Registrati */}
      <div className="space-y-3">
        {loading && devices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Caricamento dispositivi autorizzati...
          </div>
        ) : devices.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-2">
            <Fingerprint className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Nessun dispositivo mobile registrato</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Collega il tuo smartphone o tablet per accedere istantaneamente con FaceID/impronta senza digitare ogni volta il PIN.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {devices.map((d) => (
              <div
                key={d.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 mt-0.5">
                    {getDeviceIcon(d.deviceType, d.userAgent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{d.deviceName}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          d.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {d.status === "ACTIVE" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attivo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" /> Scollegato
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap font-mono">
                      <span>Registrato: {new Date(d.createdAt).toLocaleDateString("it-IT")}</span>
                      {d.lastUsedAt && (
                        <span>
                          Ultimo uso: {new Date(d.lastUsedAt).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </span>
                      )}
                      {d.lastIp && <span>IP: {d.lastIp}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {d.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => handleRevokeDevice(d.id, d.deviceName)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                      title="Scollega da remoto: il dispositivo non potrà più accedere"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Scollega Dispositivo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Sicurezza Remota:</strong> Se un collaboratore smarrisce il telefono o si dimette, clicca su{" "}
          <em>"Scollega Dispositivo"</em>. L'autorizzazione verrà revocata all'istante e il telefono non potrà più sbloccare il gestionale.
        </span>
      </div>
    </div>
  );
}
