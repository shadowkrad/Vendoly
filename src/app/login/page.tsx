"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Lock,
  ArrowRight,
  Fingerprint,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [brandName, setBrandName] = useState("Vendoly Store");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [hasBiometricSupport, setHasBiometricSupport] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Rileva se ambiente demo (Vercel o branch demo)
    if (typeof window !== "undefined") {
      const hn = window.location.hostname.toLowerCase();
      const isDemoDomain =
        hn.includes("vercel.app") ||
        hn.includes("cliente-demo") ||
        hn.includes("-demo") ||
        hn.startsWith("demo.");
      setIsDemo(isDemoDomain);
    }

    // 2. Recupera nome brand del negozio
    fetch("/api/impostazioni")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.brandName) setBrandName(d.brandName);
      })
      .catch(() => {});

    // 3. Supporto WebAuthn / Biometria
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          .then((avail) => setHasBiometricSupport(avail))
          .catch(() => setHasBiometricSupport(true));
      } else {
        setHasBiometricSupport(true);
      }
    }
  }, []);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore durante l'accesso demo");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Errore accesso demo");
      setDemoLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setErrorMsg(null);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const optRes = await fetch("/api/auth/device/login-options", { method: "POST" });
      if (!optRes.ok) {
        const errJson = await optRes.json();
        throw new Error(errJson.error || "Nessun dispositivo registrato per questo negozio. Accedi prima con password.");
      }
      const options = await optRes.json();
      const authResp = await startAuthentication(options);

      const verifyRes = await fetch("/api/auth/device/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Sblocco non riuscito");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setErrorMsg("Sblocco biometrico annullato dall'utente");
      } else {
        setErrorMsg(err.message || "Dispositivo non riconosciuto o non registrato. Inserisci la password.");
      }
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Inserisci la password di accesso.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Password non corretta");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Password errata");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100/90">
      <div className="w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna alla Vetrina Negozio</span>
        </Link>
      </div>

      <div className="max-w-sm w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-xs mb-4">
          <Store className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {brandName}
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Area Riservata Esercente & Cassa</span>
        </p>

        {/* 1-Click Demo Box (Solo su ambienti demo Vercel) */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Modalità Demo Attiva</span>
            </div>
            <p className="text-[11px] text-indigo-700">
              Esplora la gestione ordini e cassa con un singolo click, senza credenziali.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {demoLoading ? "Accesso in corso..." : "👉 Accedi alla Demo (1-Click)"}
            </button>
          </div>
        )}

        {/* Accesso Rapido Biometrico Passkey (Se supportato dal browser) */}
        {hasBiometricSupport && (
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={loading || biometricLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Fingerprint className={`w-4 h-4 text-emerald-400 ${biometricLoading ? "animate-spin" : ""}`} />
              <span>{biometricLoading ? "Verifica biometrica in corso..." : "Sblocco con FaceID / Impronta / PIN"}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Dispositivo registrato • Face ID • Touch ID • PIN
            </p>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">oppure con password</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        {/* Feedback Errore */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Password Master */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password Gestionale
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password"
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading || biometricLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Verifica in corso..." : "Accedi alla Cassa & Gestione"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Per abilitare lo sblocco rapido con FaceID o PIN su questo telefono, effettua l'accesso e registra il dispositivo in <strong className="text-slate-600">Impostazioni &gt; Dispositivi PWA</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
