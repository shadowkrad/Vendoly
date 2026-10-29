"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Lock,
  Mail,
  ArrowRight,
  Fingerprint,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Delete,
  ExternalLink,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Tab di selezione: Titolare (Email + Password) vs Staff Cassa (PIN rapido)
  const [loginMode, setLoginMode] = useState<"titolare" | "pin">("titolare");

  // Credenziali Titolare
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Credenziali Staff (PIN touch)
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sicurezza: Anti-Bot & Lockout
  const [botField, setBotField] = useState("");
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hn = window.location.hostname.toLowerCase();
      const isDemoDomain =
        hn.includes("vercel.app") ||
        hn.includes("cliente-demo") ||
        hn.includes("-demo") ||
        hn.startsWith("demo.");
      setIsDemo(isDemoDomain);
    }
  }, []);

  // Timer conto alla rovescia se bloccato per tentativi falliti
  useEffect(() => {
    if (lockoutRemaining && lockoutRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (!prev || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutRemaining]);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (loginMode === "titolare") {
      if (!email.trim() || !password) {
        setErrorMsg("Inserisci l'indirizzo email e la password dell'account.");
        return;
      }
    } else {
      if (!pin || pin.length < 4) {
        setErrorMsg("Inserisci il PIN di almeno 4 cifre per accedere.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = { botField };
      if (loginMode === "titolare") {
        payload.email = email.trim();
        payload.password = password;
      } else {
        payload.pin = pin;
      }

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.retryAfter) {
          setLockoutRemaining(data.retryAfter);
        }
        throw new Error(data.error || "Credenziali non valide.");
      }

      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Errore durante il login.");
      if (loginMode === "pin") setPin("");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setErrorMsg(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      if (!res.ok) throw new Error("Accesso demo non consentito.");
      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Errore demo");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Sfondo geometrico sfumato */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Link Torna al Negozio */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Vetrina Store
          </Link>
        </div>

        {/* Card di Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Accesso Gestionale
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Area riservata al titolare e al personale del negozio
            </p>
          </div>

          {/* Accesso Rapido Demo */}
          {isDemo && (
            <div className="mb-6 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Sparkles className="w-4 h-4" />
                Ambiente Demo Interattivo
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {demoLoading ? "Accesso in corso..." : "Entra come Titolare Demo (1-Click)"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner Errore / Blocco Temporaneo */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {errorMsg}
                {lockoutRemaining && (
                  <div className="mt-1 font-semibold text-rose-300">
                    Sblocco tra: {Math.floor(lockoutRemaining / 60)}m {lockoutRemaining % 60}s
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selettore Tab di Login */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/60 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMode("titolare");
                setErrorMsg(null);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === "titolare"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Titolare (Email)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("pin");
                setErrorMsg(null);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === "pin"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Staff Cassa (PIN)
            </button>
          </div>

          {/* FORM 1: TITOLARE CON EMAIL E PASSWORD */}
          {loginMode === "titolare" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Trappola Anti-Bot */}
              <input
                type="text"
                name="botField"
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Account Titolare
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="negozio@vendoly.it"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Boolean(lockoutRemaining && lockoutRemaining > 0)}
                className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? "Verifica in corso..." : "Accedi alla Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <a
                  href="https://taaaac.eu/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition"
                >
                  Password dimenticata o gestisci credenziali?
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          ) : (
            /* FORM 2: STAFF CASSA CON TASTIERINO PIN RAPIDO */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">
                  Inserisci il PIN rapido a 4 cifre per accedere alla cassa o ai tablet del punto vendita
                </p>

                {/* Pallini Cifre Mascherate */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border transition-all ${
                        pin.length > idx
                          ? "bg-indigo-500 border-indigo-500 scale-110 shadow-sm shadow-indigo-500/50"
                          : "border-slate-700 bg-slate-950"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tastierino Touch */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinDigit(digit)}
                    className="h-12 bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/60 rounded-xl text-base font-bold text-white transition flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin("")}
                  className="h-12 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition flex items-center justify-center cursor-pointer"
                >
                  Cancella
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit("0")}
                  className="h-12 bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/60 rounded-xl text-base font-bold text-white transition flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinDelete}
                  className="h-12 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 transition flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading || pin.length < 4}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {loading ? "Verifica PIN..." : "Sblocca Cassa"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Autenticazione protetta e monitorata con Taaaac Cloud Security.
        </div>
      </div>
    </div>
  );
}
