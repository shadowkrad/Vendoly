"use client";

import React, { useState, useMemo } from "react";
import { CustomerData, CustomerInput, createCustomer, updateCustomer, deleteCustomer } from "@/lib/customer-actions";
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
  Edit2,
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

  // Modale Aggiungi/Modifica
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
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
    setEditingCustomer(null);
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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setFormState({
      firstName: customer.firstName,
      lastName: customer.lastName || "",
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      fiscalCode: customer.fiscalCode || "",
      clothingSize: customer.clothingSize || "",
      shoeSize: customer.shoeSize || "",
      preferredBrands: customer.preferredBrands || "",
      notes: customer.notes || "",
      loyaltyPoints: customer.loyaltyPoints,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.firstName.trim() || !formState.phone.trim()) {
      showFeedback("Nome e Recapito Cellulare/WhatsApp sono obbligatori", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        // Update
        const res = await updateCustomer(editingCustomer.id, formState);
        if (res.success) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === editingCustomer.id
                ? {
                    ...c,
                    ...formState,
                    lastName: formState.lastName || null,
                    email: formState.email || null,
                    address: formState.address || null,
                    fiscalCode: formState.fiscalCode || null,
                    clothingSize: formState.clothingSize || null,
                    shoeSize: formState.shoeSize || null,
                    preferredBrands: formState.preferredBrands || null,
                    notes: formState.notes || null,
                    loyaltyPoints: formState.loyaltyPoints ?? c.loyaltyPoints,
                  }
                : c
            )
          );
          showFeedback("Cliente aggiornato con successo!");
          setIsModalOpen(false);
        } else {
          showFeedback(res.error || "Errore durante l'aggiornamento", "error");
        }
      } else {
        // Create
        const res = await createCustomer(formState);
        if (res.success && res.customer) {
          setCustomers((prev) => [res.customer!, ...prev]);
          showFeedback("Nuovo cliente registrato con successo!");
          setIsModalOpen(false);
        } else {
          showFeedback(res.error || "Errore durante la creazione", "error");
        }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header card: Nome + Punti fedeltà */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {c.firstName} {c.lastName || ""}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Registrato il {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold shrink-0">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{c.loyaltyPoints} pt</span>
                  </div>
                </div>

                {/* Recapiti Contatto */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </span>
                    <a
                      href={getWhatsAppChatUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2 py-0.5 rounded-lg transition-colors"
                      title="Avvia chat WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {c.email && (
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}

                  {c.address && (
                    <div className="flex items-start gap-1.5 text-slate-500 text-[11px] leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.address}</span>
                    </div>
                  )}

                  {c.fiscalCode && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                      <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>CF/P.IVA: {c.fiscalCode}</span>
                    </div>
                  )}
                </div>

                {/* Taglie & Brand Preferiti */}
                {(c.clothingSize || c.shoeSize || c.preferredBrands) && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {c.clothingSize && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                          <Shirt className="w-3 h-3 text-purple-500" />
                          <span>Taglia: {c.clothingSize}</span>
                        </span>
                      )}
                      {c.shoeSize && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                          <Footprints className="w-3 h-3 text-blue-500" />
                          <span>Scarpe: {c.shoeSize}</span>
                        </span>
                      )}
                    </div>
                    {c.preferredBrands && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-700">Brand:</span>
                        <span className="truncate">{c.preferredBrands}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Note / Wishlist Capi */}
                {c.notes && (
                  <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
                      Note &amp; Wishlist Capi
                    </p>
                    <p className="text-[11px] line-clamp-2 leading-relaxed">{c.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer card: Storico ordini + Azioni */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Acquisti / LTV</span>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>{c.ordersCount} ord.</span>
                    <span>•</span>
                    <span className="text-emerald-600">{formatCurrency(c.totalSpent)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryCustomer(c)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Visualizza storico acquisti"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Modifica scheda cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Elimina cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Modale Form Nuovo/Modifica Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  {editingCustomer ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCustomer ? "Modifica Scheda Cliente" : "Registra Nuovo Cliente"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCustomer
                      ? `Aggiorna i recapiti e le preferenze di ${editingCustomer.firstName}`
                      : "Inserimento rapido anagrafica cassa e marketplace"}
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
                    Cellulare (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
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
                    <input
                      type="number"
                      min={0}
                      value={formState.loyaltyPoints ?? 0}
                      onChange={(e) =>
                        setFormState({ ...formState, loyaltyPoints: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    />
                  </div>
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
              <div className="pt-2 flex items-center justify-end gap-2.5">
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
                      <span>{editingCustomer ? "Salva Modifiche" : "Crea Cliente"}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
    </div>
  );
}
