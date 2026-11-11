"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { CustomerData, CustomerInput, createCustomer, deleteCustomer } from "@/lib/customer-actions";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Tag,
  Award,
  ShoppingBag,
  MessageCircle,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Save,
  Sparkles,
  Shirt,
  Footprints,
  Heart,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CustomersClientProps {
  initialCustomers: CustomerData[];
  storeName?: string;
}

export default function CustomersClient({ initialCustomers, storeName = "Vendoly Store" }: CustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modale Registrazione Nuovo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formState, setFormState] = useState<CustomerInput>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    fiscalCode: "",
    clothingSize: "",
    shoeSize: "",
    preferredBrands: "",
    notes: "",
    loyaltyPoints: 0,
  });

  // Modale Dettaglio / Storico Ordini
  const [historyCustomer, setHistoryCustomer] = useState<CustomerData | null>(null);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.ordersCount, 0);
    const avgOrders = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : "0";

    return { totalCustomers, totalRevenue, totalLoyaltyPoints, avgOrders };
  }, [customers]);

  // Clienti filtrati
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;

    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.preferredBrands && c.preferredBrands.toLowerCase().includes(q)) ||
        (c.clothingSize && c.clothingSize.toLowerCase().includes(q)) ||
        (c.shoeSize && c.shoeSize.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    setFormState({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      fiscalCode: "",
      clothingSize: "",
      shoeSize: "",
      preferredBrands: "",
      notes: "",
      loyaltyPoints: 0,
      birthDate: "",
      marketingConsent: false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.firstName.trim()) {
      showFeedback("Il nome è obbligatorio", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await createCustomer(formState);
      if (res.success && res.customer) {
        setCustomers((prev) => [res.customer!, ...prev]);
        showFeedback("Nuovo cliente registrato con successo!");
        setIsModalOpen(false);
      } else {
        showFeedback(res.error || "Errore durante la creazione", "error");
      }
    } catch {
      showFeedback("Errore di connessione", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: CustomerData) => {
    if (
      !confirm(
        `Sei sicuro di voler eliminare la scheda cliente di ${customer.firstName} ${customer.lastName || ""}?`
      )
    ) {
      return;
    }

    try {
      const res = await deleteCustomer(customer.id);
      if (res.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        showFeedback("Cliente rimosso dall'anagrafica");
      } else {
        showFeedback("Impossibile eliminare il cliente", "error");
      }
    } catch {
      showFeedback("Errore durante l'eliminazione", "error");
    }
  };

  const getWhatsAppChatUrl = (customer: CustomerData) => {
    const raw = customer.phone.replace(/\D/g, "");
    const name = customer.firstName;
    const msg = `👋 Ciao ${name}! Ti contattiamo da ${storeName}. Come possiamo aiutarti?`;
    return `https://wa.me/${raw}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* 1. Header Principale */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>👥 CRM & Anagrafica Negozio</span>
            <span>•</span>
            <span>Clientela & Preferenze</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Clienti &amp; Storico Acquisti
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestisci anagrafica acquirenti, numeri WhatsApp, taglie preferite, brand cercati e punti fedeltà.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuovo Cliente</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clienti Registrati</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpiStats.totalCustomers}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Anagrafiche attive in rubrica</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Spesa Cumulativa (LTV)</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(kpiStats.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Valore totale generato</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Punti Fedeltà</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpiStats.totalLoyaltyPoints}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Saldo attivo fidelizzazione</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Media Ordini</span>
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpiStats.avgOrders}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Acquisti medi per cliente</p>
        </div>
      </div>

      {/* 3. Barra di Ricerca Rapida */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cerca per nome, cellulare, email, taglia (es. 42, L) o brand preferito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. Griglia Card Clienti */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <h3 className="text-base font-bold text-slate-700">Nessun cliente trovato</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "Nessun cliente corrisponde ai criteri di ricerca impostati. Prova a modificare la parola chiave."
              : "Non è ancora presente alcun cliente registrato. Inserisci il primo cliente con il pulsante in alto a destra."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Azzera Ricerca
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* VISTA MOBILE: RIGHE COMPATTE */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredCustomers.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900">
                      {c.firstName} {c.lastName || ""}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="font-semibold text-emerald-700">{c.phone}</span>
                      <a
                        href={getWhatsAppChatUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WA
                      </a>
                    </div>
                    {c.email && <div className="text-[11px] text-slate-500 truncate">{c.email}</div>}
                    {c.address && <div className="text-[11px] text-slate-400 truncate">{c.address}</div>}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                      {c.loyaltyPoints} pt
                    </span>
                    <div className="text-[11px] font-bold text-slate-700">
                      {c.ordersCount} ord. · <span className="text-emerald-600">{formatCurrency(c.totalSpent)}</span>
                    </div>
                  </div>
                </div>

                {(c.clothingSize || c.shoeSize || c.preferredBrands || c.notes) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {c.clothingSize && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        <Shirt className="w-3 h-3" />
                        {c.clothingSize}
                      </span>
                    )}
                    {c.shoeSize && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        <Footprints className="w-3 h-3" />
                        {c.shoeSize}
                      </span>
                    )}
                    {c.preferredBrands && (
                      <span className="text-slate-600 truncate max-w-full">
                        ❤️ {c.preferredBrands}
                      </span>
                    )}
                    {c.notes && (
                      <span className="text-amber-800 truncate max-w-full">
                        📝 {c.notes}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Dal {formatDate(c.createdAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHistoryCustomer(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Visualizza storico acquisti"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/dashboard/clienti/${c.id}`}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Scheda →
                    </Link>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Elimina cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VISTA DESKTOP: TABELLA A RIGHE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Contatti</th>
                  <th className="px-5 py-3">Taglie &amp; Preferenze</th>
                  <th className="px-5 py-3">Fedeltà &amp; Ordini</th>
                  <th className="px-5 py-3 text-right">Dettagli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 align-top">
                      <div className="font-semibold text-slate-900">
                        {c.firstName} {c.lastName || ""}
                      </div>
                      {c.address && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[240px] mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Dal {formatDate(c.createdAt)}</span>
                        {c.fiscalCode && <span className="font-mono">· {c.fiscalCode}</span>}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800">{c.phone}</span>
                        <a
                          href={getWhatsAppChatUrl(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Avvia chat WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      {c.email && (
                        <div className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">
                          {c.email}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 align-top space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.clothingSize && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                            <Shirt className="w-3 h-3 text-purple-500" />
                            <span>{c.clothingSize}</span>
                          </span>
                        )}
                        {c.shoeSize && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                            <Footprints className="w-3 h-3 text-blue-500" />
                            <span>{c.shoeSize}</span>
                          </span>
                        )}
                      </div>
                      {c.preferredBrands && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate max-w-[240px]">
                          <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{c.preferredBrands}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="text-[11px] text-amber-800 truncate max-w-[240px]" title={c.notes}>
                          📝 {c.notes}
                        </div>
                      )}
                      {!c.clothingSize && !c.shoeSize && !c.preferredBrands && !c.notes && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{c.loyaltyPoints} pt</span>
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        {c.ordersCount} ord. ·{" "}
                        <span className="text-emerald-600">{formatCurrency(c.totalSpent)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setHistoryCustomer(c)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Visualizza storico acquisti"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/dashboard/clienti/${c.id}`}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          title="Apri scheda completa e tessera punti"
                        >
                          Scheda →
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Elimina cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

      {/* 5. Modale Form Nuovo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] !mt-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto px-6 pb-6 pt-0 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Registra Nuovo Cliente
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inserimento rapido anagrafica cassa e marketplace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dati Anagrafici */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Mario"
                    value={formState.firstName}
                    onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Rossi"
                    value={formState.lastName || ""}
                    onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Telefono (WhatsApp) & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cellulare (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 340 1234567"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.it"
                    value={formState.email || ""}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Indirizzo & Codice Fiscale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Indirizzo di Spedizione / Sede
                  </label>
                  <input
                    type="text"
                    placeholder="Via Roma 12, 20121 Milano (MI)"
                    value={formState.address || ""}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CF o P.IVA
                  </label>
                  <input
                    type="text"
                    placeholder="RSSMRA80A..."
                    value={formState.fiscalCode || ""}
                    onChange={(e) => setFormState({ ...formState, fiscalCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono uppercase"
                  />
                </div>
              </div>

              {/* Preferenze Taglie & Moda (Specifiche per Vendoly) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-purple-600" />
                  Profilo Taglie &amp; Preferenze Capi
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Taglia Abbigliamento
                    </label>
                    <input
                      type="text"
                      placeholder="Es. M / 48 IT"
                      value={formState.clothingSize || ""}
                      onChange={(e) => setFormState({ ...formState, clothingSize: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Taglia Scarpe / Sneakers
                    </label>
                    <input
                      type="text"
                      placeholder="Es. 42 EU"
                      value={formState.shoeSize || ""}
                      onChange={(e) => setFormState({ ...formState, shoeSize: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Punti Fedeltà
                    </label>
                    <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 leading-tight">
                      <div className="text-sm font-black text-slate-900">{formState.loyaltyPoints ?? 0} pt</div>
                      <a href="/dashboard/fedelta" className="text-[10px] font-semibold text-emerald-700 underline">
                        Gestisci in cassa fedeltà
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data di nascita (facoltativa, per il buono compleanno)
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={formState.birthDate || ""}
                      onChange={(e) => setFormState({ ...formState, birthDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-slate-700 sm:mt-5">
                    <input
                      type="checkbox"
                      checked={Boolean(formState.marketingConsent)}
                      onChange={(e) => setFormState({ ...formState, marketingConsent: e.target.checked })}
                    />
                    Consenso a comunicazioni promozionali (es. buono compleanno per email)
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Brand &amp; Marche Preferite
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Nike, Stone Island, Carhartt, Gucci Vintage"
                    value={formState.preferredBrands || ""}
                    onChange={(e) => setFormState({ ...formState, preferredBrands: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Note / Wishlist Capi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Private &amp; Capi Ricercati (Wishlist)
                </label>
                <textarea
                  rows={2}
                  placeholder="Annota richieste specifiche, capi che cerca o abitudini di acquisto..."
                  value={formState.notes || ""}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Bottoni Salvataggio */}
              <div className="py-3 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 px-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvataggio...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Crea Cliente</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modale Storico Ordini Cliente */}
      {historyCustomer && (
        <div className="fixed inset-0 z-[60] !mt-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>
                    Storico Acquisti: {historyCustomer.firstName} {historyCustomer.lastName || ""}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Totale speso: <strong className="text-emerald-600">{formatCurrency(historyCustomer.totalSpent)}</strong> • {historyCustomer.ordersCount} ordini
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {historyCustomer.orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                  Nessun ordine registrato finora per questo cliente.
                </div>
              ) : (
                historyCustomer.orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                        <span>#{o.orderNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-sans text-slate-600 font-semibold">
                          {o.channel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(o.createdAt)} • Stato:{" "}
                        <span className="font-bold text-slate-700">{o.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-emerald-600 block">
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
