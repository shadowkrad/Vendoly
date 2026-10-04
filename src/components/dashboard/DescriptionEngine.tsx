"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Search,
  FileText,
  Ruler,
  Layers,
  ArrowRight,
  Tag,
  AlertCircle,
  Shirt,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface SimilarProductCandidate {
  id: string;
  title: string;
  description: string;
  brand?: string | null;
  category: string;
  condition: string;
  price: number;
  comparePrice?: number | null;
  images?: string;
  size?: string | null;
  sku?: string | null;
  conditionNotes?: string | null;
}

interface DescriptionEngineProps {
  product: {
    id?: string;
    title: string;
    brand?: string | null;
    category: string;
    condition: string;
    conditionNotes?: string | null;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    price: number;
    comparePrice?: number | null;
    sku?: string | null;
  };
  existingProducts?: SimilarProductCandidate[];
  onDescriptionSelect: (description: string) => void;
}

// Template di settore arricchiti specifici per Vintage, Second-hand e Streetwear
const INDUSTRY_TEMPLATES = [
  {
    id: "vintage-90s-y2k",
    name: "Vintage '90s / Y2K Heritage",
    category: "Abbigliamento Vintage",
    badge: "Vintage Lover",
    text: `✨ PEZZO UNICO VINTAGE '90s / Y2K ✨

🏷️ Articolo: {{titolo}}
Marca: {{brand}}
Condizioni: {{condizione}} (Capo vintage originale e autenticato)
Taglia indicata: {{taglia}}
Colore: {{colore}}
Composizione/Tessuto: {{materiale}}
{{misure}}
{{note_difetti}}

🔍 DETTAGLI & STILE:
Capo iconico dal fit caratteristico vintage, perfetto per outfit streetwear o nostalgici. Tessuto resistente di prima manifattura con dettagli d'epoca intatti. Lavato e sanificato prima della messa in vendita.

💰 Prezzo: {{prezzo}} {{prezzo_confronto_text}}
🔖 Codice Identificativo: {{sku}}
📦 Spedizione tracciata e rapida in 24/48h o ritiro al banco in boutique.`,
  },
  {
    id: "sneakers-hype",
    name: "Sneakers & Hype Drops",
    category: "Scarpe & Sneakers",
    badge: "Streetwear & Sneakers",
    text: `👟 SNEAKERS ORIGINALI: {{titolo}}

Brand: {{brand}}
Taglia: {{taglia}} (EU)
Colore: {{colore}}
Stato di conservazione: {{condizione}}
{{note_difetti}}

🔍 DETTAGLI MODELLO:
- Modello 100% autentico e garantito, sottoposto a verifica al banco.
- Suola e tomaia in stato {{condizione_basso}}, perfetta per uso quotidiano o collezione.
- Include etichetta identificativa negozio [SKU: {{sku}}].

💰 Prezzo speciale: {{prezzo}} {{prezzo_confronto_text}}
🚚 Spedizione protetta a doppio imballo (Double Box) o consegna a mano.`,
  },
  {
    id: "denim-workwear",
    name: "Denim & Pantaloni Workwear",
    category: "Abbigliamento",
    badge: "Denim & Workwear",
    text: `👖 DENIM & JEANS VINTAGE: {{titolo}}

Marchio: {{brand}}
Modello / Taglia etichetta: {{taglia}}
Materiale: {{materiale}} (Denim robusto 100% cotone)
Lavaggio / Tonalità: {{colore}}
Stato usura: {{condizione}}
{{misure}}
{{note_difetti}}

🧵 CARATTERISTICHE:
Fit autentico con lavaggio naturale e usura caratteristica che ne esalta la storicità. Nessun danno strutturale, cerniera/bottoni originali e funzionanti.

💰 Prezzo: {{prezzo}}
🔖 SKU Prodotto: {{sku}}`,
  },
  {
    id: "giacche-outerwear",
    name: "Giacche, Giubbotti & Outerwear",
    category: "Abbigliamento",
    badge: "Outerwear & Windbreaker",
    text: `🧥 OUTERWEAR & GIACCA: {{titolo}}

Brand: {{brand}}
Taglia: {{taglia}}
Colore principale: {{colore}}
Tessuto: {{materiale}}
Condizioni generali: {{condizione}}
{{misure}}
{{note_difetti}}

📌 PARTICOLARI:
Capo ideale per mezza stagione o freddo. Chiusure a zip e automatici perfettamente efficienti. Tasche capienti, elastici e fodera in condizioni ottime.

💰 Prezzo proposto: {{prezzo}} {{prezzo_confronto_text}}
🔖 Codice: {{sku}}`,
  },
  {
    id: "luxury-designer",
    name: "Luxury & Firme Vintage",
    category: "Abbigliamento",
    badge: "High End & Designer",
    text: `💎 SELEZIONE LUXURY / FIRMA: {{titolo}}

Maison / Brand: {{brand}}
Condizioni: {{condizione}}
Taglia: {{taglia}}
Materiale pregiato: {{materiale}}
Colorazione: {{colore}}
{{note_difetti}}

🛡️ GARANZIA DI AUTENTICITÀ:
Articolo controllato nei minimi dettagli da personale specializzato. Cuciture sartoriali, etichette originali e finiture di altissima manifattura.

💰 Prezzo outlet boutique: {{prezzo}} (Valore di listino stimato: {{prezzo_confronto}})
🔖 ID Archiviazione: {{sku}}
Disponibili per ulteriori scatti fotografici e dettagli su richiesta.`,
  },
  {
    id: "borse-accessori",
    name: "Borse, Zaini & Pelletteria",
    category: "Borse & Zaini",
    badge: "Accessori",
    text: `👜 BORSA & ACCESSORI: {{titolo}}

Marca: {{brand}}
Materiale: {{materiale}}
Colore: {{colore}}
Stato: {{condizione}}
{{misure}}
{{note_difetti}}

Dettagli:
- Hardware metallico integro e scorrevole.
- Interno pulito e scomparti perfettamente utilizzabili.
- Tracolla / manici in ottimo stato di conservazione.

💰 Prezzo: {{prezzo}} {{prezzo_confronto_text}}
SKU: {{sku}}`,
  },
  {
    id: "elettronica-retro",
    name: "Elettronica, Audio & Retro-Gaming",
    category: "Elettronica & Audio",
    badge: "Tech & Audio",
    text: `🎧 ARTICOLO ELETTRONICA & AUDIO: {{titolo}}

Produttore: {{brand}}
Condizione estetica e funzionale: {{condizione}}
{{note_difetti}}

🔧 COLLAUDO AL BANCO:
Articolo testato accuratamente e funzionante al 100%. Pulito e pronto all'uso immediato.

💰 Prezzo: {{prezzo}}
🔖 SKU: {{sku}}
Disponibile per prova al banco o spedizione protetta con pluriball ad alta densità.`,
  },
  {
    id: "casual-essenziale",
    name: "Casual Rapido & Essenziale",
    category: "Abbigliamento",
    badge: "Quick Seller",
    text: `🏷️ {{titolo}}
Brand: {{brand}} | Taglia: {{taglia}} | Colore: {{colore}}
Condizioni: {{condizione}}
{{note_difetti}}

💰 Prezzo: {{prezzo}}
📦 Spedizione immediata in 24h o ritiro di persona. Codice: {{sku}}`,
  },
];

// Helper per estrarre la prima immagine valida da JSON
function getFirstImage(imagesJson?: string): string | null {
  if (!imagesJson) return null;
  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed[0];
    }
  } catch {
    // stringa diretta
    if (imagesJson.startsWith("http")) return imagesJson;
  }
  return null;
}

export default function DescriptionEngine({
  product,
  existingProducts = [],
  onDescriptionSelect,
}: DescriptionEngineProps) {
  const [activeTab, setActiveTab] = useState<"similar" | "templates" | "measurements" | "channels">("similar");
  const [selectedTemplate, setSelectedTemplate] = useState(INDUSTRY_TEMPLATES[0]);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState("");
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [expandedSimilarId, setExpandedSimilarId] = useState<string | null>(null);

  // Misure opzionali rapide in cm
  const [measurements, setMeasurements] = useState({
    spalle: "",
    torace: "", // Pit-to-Pit
    lunghezza: "",
    vita: "",
    fondoGamba: "",
  });

  // Testo misure compilato
  const compiledMeasurementsBlock = useMemo(() => {
    const parts: string[] = [];
    if (measurements.spalle) parts.push(`• Spalle (cucitura a cucitura): ${measurements.spalle} cm`);
    if (measurements.torace) parts.push(`• Ascella-Ascella (Pit-to-Pit): ${measurements.torace} cm`);
    if (measurements.lunghezza) parts.push(`• Lunghezza totale: ${measurements.lunghezza} cm`);
    if (measurements.vita) parts.push(`• Vita / Waist: ${measurements.vita} cm`);
    if (measurements.fondoGamba) parts.push(`• Fondo gamba: ${measurements.fondoGamba} cm`);

    if (parts.length === 0) return "";
    return `\n📏 MISURE PRECISE (IN PIANO):\n${parts.join("\n")}`;
  }, [measurements]);

  // Calcolo Similarità con prodotti preesistenti
  const similarProducts = useMemo(() => {
    if (!existingProducts || existingProducts.length === 0) return [];

    const currentTitleWords = (product.title || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    const currentBrand = (product.brand || "").toLowerCase().trim();
    const currentCategory = (product.category || "").toLowerCase().trim();

    return existingProducts
      .filter((p) => {
        // Escludi il prodotto corrente se in modifica
        if (product.id && p.id === product.id) return false;
        // Considera solo prodotti con descrizione significativa
        return p.description && p.description.trim().length > 15;
      })
      .map((item) => {
        let score = 0;
        const reasons: string[] = [];

        const itemBrand = (item.brand || "").toLowerCase().trim();
        const itemCat = (item.category || "").toLowerCase().trim();
        const itemTitle = (item.title || "").toLowerCase();

        // 1. Corrispondenza Brand
        if (currentBrand && itemBrand && (currentBrand === itemBrand || itemBrand.includes(currentBrand))) {
          score += 45;
          reasons.push(`Stesso Brand (${item.brand})`);
        } else if (currentBrand && itemTitle.includes(currentBrand)) {
          score += 35;
          reasons.push(`Brand presente nel titolo`);
        }

        // 2. Corrispondenza Categoria
        if (currentCategory && itemCat && currentCategory === itemCat) {
          score += 25;
          reasons.push(`Stessa Categoria (${item.category})`);
        }

        // 3. Parole chiave in comune nel Titolo
        let matchingWords = 0;
        for (const w of currentTitleWords) {
          if (itemTitle.includes(w)) {
            matchingWords++;
          }
        }
        if (matchingWords > 0) {
          const wordBonus = Math.min(30, matchingWords * 10);
          score += wordBonus;
          reasons.push(`${matchingWords} parole chiave in comune`);
        }

        // Filtro ricerca manuale aggiuntivo se l'utente digita nella barra
        if (searchCatalogQuery.trim()) {
          const query = searchCatalogQuery.toLowerCase().trim();
          const matchesQuery =
            itemTitle.includes(query) ||
            itemBrand.includes(query) ||
            itemCat.includes(query) ||
            (item.sku && item.sku.toLowerCase().includes(query)) ||
            item.description.toLowerCase().includes(query);

          if (matchesQuery) {
            score += 50;
            reasons.push(`Corrisponde a "${searchCatalogQuery}"`);
          } else {
            // Se c'è una query esplicita e non matcha, riduci drasticamente
            score = -1;
          }
        }

        return {
          ...item,
          score,
          reasons,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [existingProducts, product, searchCatalogQuery]);

  // Compilatore di Template per Industry Templates
  const compileTemplate = (templateText: string) => {
    let text = templateText;
    text = text.replace(/{{titolo}}/g, product.title || "Capo Second-Hand / Vintage");
    text = text.replace(/{{brand}}/g, product.brand || "Originale");
    text = text.replace(/{{categoria}}/g, product.category || "Abbigliamento");
    text = text.replace(/{{condizione}}/g, (product.condition || "NUOVO").replace(/_/g, " "));
    text = text.replace(/{{condizione_basso}}/g, (product.condition || "NUOVO").toLowerCase().replace(/_/g, " "));
    text = text.replace(/{{taglia}}/g, product.size || "Vedi etichetta");
    text = text.replace(/{{colore}}/g, product.color || "Come da foto");
    text = text.replace(/{{materiale}}/g, product.material || "Tessuto di qualità");
    text = text.replace(/{{prezzo}}/g, formatCurrency(product.price));
    text = text.replace(/{{prezzo_confronto}}/g, product.comparePrice ? formatCurrency(product.comparePrice) : "");
    text = text.replace(
      /{{prezzo_confronto_text}}/g,
      product.comparePrice && product.comparePrice > product.price
        ? `(Prezzo di listino / retail: ${formatCurrency(product.comparePrice)})`
        : ""
    );
    text = text.replace(/{{sku}}/g, product.sku || "N/D");

    // Iniezione misure
    text = text.replace(/{{misure}}/g, compiledMeasurementsBlock);

    // Iniezione note difetti
    if (product.conditionNotes && product.condition !== "NUOVO") {
      text = text.replace(/{{note_difetti}}/g, `\n⚠️ DETTAGLI USURA / DIFETTI:\n${product.conditionNotes}\n`);
    } else {
      text = text.replace(/{{note_difetti}}/g, "");
    }

    return text.trim().replace(/\n{3,}/g, "\n\n");
  };

  const compiledTemplateText = useMemo(() => {
    return compileTemplate(selectedTemplate.text);
  }, [selectedTemplate, product, compiledMeasurementsBlock]);

  // Funzione per ADATTARE una descrizione preesistente ai dati del capo corrente
  const adaptExistingDescription = (originalDesc: string, originalItem: SimilarProductCandidate) => {
    let adapted = originalDesc;

    // Se l'originale aveva un brand noto diverso dal corrente, prova a sostituirlo
    if (originalItem.brand && product.brand && originalItem.brand.toLowerCase() !== product.brand.toLowerCase()) {
      const reg = new RegExp(originalItem.brand, "gi");
      adapted = adapted.replace(reg, product.brand);
    }

    // Sostituisci taglia se presente
    if (originalItem.size && product.size && originalItem.size.toLowerCase() !== product.size.toLowerCase()) {
      const regSize = new RegExp(`Taglia:?\\s*${originalItem.size}`, "gi");
      adapted = adapted.replace(regSize, `Taglia: ${product.size}`);
    }

    // Sostituisci SKU vecchio con SKU nuovo
    if (originalItem.sku && product.sku) {
      adapted = adapted.replace(new RegExp(originalItem.sku, "g"), product.sku);
    }

    // Sostituisci vecchio prezzo formattato con nuovo prezzo
    if (originalItem.price) {
      const oldPriceStr = originalItem.price.toFixed(2);
      const newPriceStr = product.price.toFixed(2);
      adapted = adapted.replace(new RegExp(`€\\s*${oldPriceStr}`, "g"), `€ ${newPriceStr}`);
    }

    // Aggiungi misure se l'utente le ha compilate nel modulo e non erano già incluse
    if (compiledMeasurementsBlock && !adapted.includes("MISURE PRECISE")) {
      adapted = `${adapted}\n\n${compiledMeasurementsBlock.trim()}`;
    }

    // Aggiungi note difetti se presenti per il capo attuale
    if (product.conditionNotes && !adapted.includes(product.conditionNotes)) {
      adapted = `${adapted}\n\n⚠️ Note usura: ${product.conditionNotes}`;
    }

    onDescriptionSelect(adapted.trim());
  };

  const copyToClipboard = (text: string, channelKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelKey);
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  // Ottimizzazione per canale specifico
  const channelCopies = useMemo(() => {
    const base = compiledTemplateText;
    const brandClean = (product.brand || "Vintage").replace(/[^a-zA-Z0-9]/g, "");
    const catClean = (product.category || "Style").replace(/[^a-zA-Z0-9]/g, "");

    const vintedTags = `#vintage #${brandClean.toLowerCase()} #${catClean.toLowerCase()} #secondhand #streetwear #affare`;

    return {
      vinted: `${base}\n\n🏷️ ${vintedTags}`,
      subito: `${base}\n\n📍 RITIRO A MANO disponibile in negozio oppure Spedizione Sicura e Tracciata con TuttoSubito (24/48h).`,
      ebay: `═══════════════════════════════════════\n📦 SCHEDA ARTICOLO - ${product.title.toUpperCase()}\n═══════════════════════════════════════\n\n${base}\n\n✅ VENDITORE PROFESSIONALE: Garanzia di autenticità al 100% e fattura/scontrino al banco.`,
      facebook: `🔥 DISPONIBILE IN NEGOZIO! 🔥\n\n${base}\n\n👉 Scrivici subito in privato per bloccare l'articolo o passa a provarlo di persona! Spedizione rapida in tutta Italia.`,
    };
  }, [compiledTemplateText, product]);

  return (
    <div className="mt-4 border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
      {/* Top Header & Mode Navigation */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-800">
            Assistente Descrizioni & Proposte Annunci
          </h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("similar")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "similar"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Capi Simili in Negozio
            {similarProducts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black">
                {similarProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "templates"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Template di Settore
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("measurements")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "measurements"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Misure (cm)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("channels")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "channels"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Ottimizzazione Canali
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ===================== TAB 1: CAPI SIMILI IN CATALOGO ===================== */}
        {activeTab === "similar" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-emerald-600" />
                  Descrizioni da Capi Preesistenti Simili
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confronta e riutilizza descrizioni già scritte per capi dello stesso brand, categoria o stile.
                </p>
              </div>

              {/* Barra Ricerca Manuale Rapida nel Catalogo */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchCatalogQuery}
                  onChange={(e) => setSearchCatalogQuery(e.target.value)}
                  placeholder="Cerca per brand, modello, SKU..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {similarProducts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Nessun capo simile trovato</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Non ci sono ancora altri articoli con descrizioni simili per brand o categoria. Puoi provare a cercare per parola chiave o utilizzare un template di settore qui a fianco.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {similarProducts.map((item) => {
                  const isExpanded = expandedSimilarId === item.id;
                  const thumb = getFirstImage(item.images);
                  const isHighScore = item.score >= 50;

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 bg-white transition-all shadow-2xs hover:shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <Shirt className="w-5 h-5 text-slate-400" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isHighScore
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {isHighScore ? "Alta Affinità 🔥" : "Correlato 📦"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {item.brand && <span className="font-semibold text-slate-700">{item.brand}</span>}
                              <span>•</span>
                              <span>{item.category}</span>
                              {item.size && (
                                <>
                                  <span>•</span>
                                  <span>Taglia: {item.size}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="font-bold text-slate-800">{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Motivazioni Affinità */}
                        <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-xs">
                          {item.reasons.slice(0, 2).map((r, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Snippet Descrizione */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700 font-mono relative">
                        <p className={isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}>
                          {item.description}
                        </p>
                        {item.description.length > 120 && (
                          <button
                            type="button"
                            onClick={() => setExpandedSimilarId(isExpanded ? null : item.id)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-sans font-bold flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Mostra meno
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> Leggi tutto
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Azioni di adozione */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onDescriptionSelect(item.description)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Usa Tale Quale
                        </button>

                        <button
                          type="button"
                          onClick={() => adaptExistingDescription(item.description, item)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Adatta al Capo Attuale
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: TEMPLATE DI SETTORE ===================== */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Template Preconfezionati di Settore
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Modelli strutturati ad alta conversione per second-hand, streetwear e pezzi vintage.
              </p>
            </div>

            {/* Griglia bottoni template */}
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    <span>{tmpl.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Anteprima Live Compilata */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Anteprima Testo con Dati Correnti:</span>
                <span className="font-mono text-[11px]">{compiledTemplateText.length} caratteri</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {compiledTemplateText}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDescriptionSelect(compiledTemplateText)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Applica Questo Template all'Articolo
            </button>
          </div>
        )}

        {/* ===================== TAB 3: MISURE FISICHE IN CM ===================== */}
        {activeTab === "measurements" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-indigo-600" />
                Specificatore Misure in cm (Fattore Chiave su Vinted & Second-Hand)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Gli acquirenti vintage scelgono i capi in base alle misure esatte in piano. Compilale per ridurre i resi e aumentare le vendite.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Spalle (cm)</label>
                <input
                  type="text"
                  value={measurements.spalle}
                  onChange={(e) => setMeasurements({ ...measurements, spalle: e.target.value })}
                  placeholder="Es. 48"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ascella-Ascella (cm)</label>
                <input
                  type="text"
                  value={measurements.torace}
                  onChange={(e) => setMeasurements({ ...measurements, torace: e.target.value })}
                  placeholder="Es. 54 (Pit to Pit)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Lunghezza (cm)</label>
                <input
                  type="text"
                  value={measurements.lunghezza}
                  onChange={(e) => setMeasurements({ ...measurements, lunghezza: e.target.value })}
                  placeholder="Es. 68"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vita / Waist (cm)</label>
                <input
                  type="text"
                  value={measurements.vita}
                  onChange={(e) => setMeasurements({ ...measurements, vita: e.target.value })}
                  placeholder="Es. 42"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fondo Gamba (cm)</label>
                <input
                  type="text"
                  value={measurements.fondoGamba}
                  onChange={(e) => setMeasurements({ ...measurements, fondoGamba: e.target.value })}
                  placeholder="Es. 21"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {compiledMeasurementsBlock && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-mono whitespace-pre-wrap">
                {compiledMeasurementsBlock}
              </div>
            )}

            <button
              type="button"
              disabled={!compiledMeasurementsBlock}
              onClick={() => {
                onDescriptionSelect(compiledTemplateText);
                setActiveTab("templates");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Inserisci Misure e Ricalcola Descrizione
            </button>
          </div>
        )}

        {/* ===================== TAB 4: OTTIMIZZAZIONE CANALI ===================== */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                Anteprima Copy Adattata per Singolo Canale
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Copia il testo formattato su misura per Vinted, Subito.it, eBay o Facebook Marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vinted */}
              <div className="border border-cyan-200 rounded-xl p-3.5 bg-cyan-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    Vinted (con Hashtag)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(channelCopies.vinted, "vinted")}
                    className="px-2.5 py-1 bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedChannel === "vinted" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedChannel === "vinted" ? "Copiato!" : "Copia Vinted"}
                  </button>
                </div>
                <div className="bg-white border border-cyan-100 rounded-lg p-2.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {channelCopies.vinted}
                </div>
              </div>

              {/* Subito.it */}
              <div className="border border-amber-200 rounded-xl p-3.5 bg-amber-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Subito.it (Ritiro & TuttoSubito)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(channelCopies.subito, "subito")}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedChannel === "subito" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedChannel === "subito" ? "Copiato!" : "Copia Subito"}
                  </button>
                </div>
                <div className="bg-white border border-amber-100 rounded-lg p-2.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {channelCopies.subito}
                </div>
              </div>

              {/* eBay */}
              <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    eBay (Strutturato & SKU)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(channelCopies.ebay, "ebay")}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedChannel === "ebay" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedChannel === "ebay" ? "Copiato!" : "Copia eBay"}
                  </button>
                </div>
                <div className="bg-white border border-blue-100 rounded-lg p-2.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {channelCopies.ebay}
                </div>
              </div>

              {/* Facebook / Instagram */}
              <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    Facebook / Instagram (Social & DM)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(channelCopies.facebook, "facebook")}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedChannel === "facebook" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedChannel === "facebook" ? "Copiato!" : "Copia Social"}
                  </button>
                </div>
                <div className="bg-white border border-indigo-100 rounded-lg p-2.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {channelCopies.facebook}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
