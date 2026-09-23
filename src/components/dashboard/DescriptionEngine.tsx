"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Sparkles, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DescriptionEngineProps {
  product: {
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
  onDescriptionSelect: (description: string) => void;
}

const TEMPLATES = [
  {
    id: "abbigliamento-standard",
    name: "Abbigliamento - Standard",
    category: "Abbigliamento",
    text: "Bellissimo capo d'abbigliamento {{titolo}} firmato {{brand}}.\nCondizioni: {{condizione}}.\nTaglia: {{taglia}}\nColore: {{colore}}\nMateriale: {{materiale}}\n\n{{note_difetti}}\n\nPrezzo affare: {{prezzo}} (Valore originale: {{prezzo_confronto}}).\nCodice: {{sku}}"
  },
  {
    id: "sneakers-hype",
    name: "Sneakers - Hype/Collezione",
    category: "Scarpe & Sneakers",
    text: "🔥 {{titolo}} - {{brand}} 🔥\n\nStato: {{condizione}}\nTaglia: {{taglia}}\n\nModello imperdibile per appassionati. {{note_difetti}}\n\nPrezzo: {{prezzo}}.\nSpedizione veloce e tracciata. Codice articolo: {{sku}}"
  },
  {
    id: "borse-lusso",
    name: "Borse - Lusso/Vintage",
    category: "Borse & Zaini",
    text: "Eleganza senza tempo: {{titolo}} di {{brand}}.\n\nMateriale: {{materiale}}\nCondizioni: {{condizione}}\nColore: {{colore}}\n\n{{note_difetti}}\n\nPrezzo eccezionale di {{prezzo}} invece di {{prezzo_confronto}}.\nDisponibile per ulteriori foto o informazioni. [SKU: {{sku}}]"
  },
  {
    id: "elettronica-dettagliato",
    name: "Elettronica - Dettagliato",
    category: "Elettronica & Audio",
    text: "💻 {{titolo}} 💻\n\nMarca: {{brand}}\nCondizioni funzionali ed estetiche: {{condizione}}.\n\n{{note_difetti}}\n\nPerfettamente funzionante e testato. Prezzo di vendita: {{prezzo}}.\nContattami per dettagli. SKU: {{sku}}"
  },
  {
    id: "casa-minimal",
    name: "Casa - Minimal",
    category: "Casa & Benessere",
    text: "Articolo per la casa: {{titolo}}.\nCondizioni: {{condizione}}\nColore: {{colore}} | Materiale: {{materiale}}\n\n{{note_difetti}}\n\nPrezzo: {{prezzo}}.\nOttimo affare, vendo per inutilizzo. SKU: {{sku}}"
  },
  {
    id: "generico",
    name: "Generico - Veloce",
    category: "Altro",
    text: "{{titolo}} in condizioni: {{condizione}}.\nBrand: {{brand}}.\n{{note_difetti}}\n\nPrezzo: {{prezzo}}.\nPer info scrivetemi. SKU: {{sku}}"
  }
];

const CHANNEL_TIPS = [
  {
    channel: "Subito",
    tips: ["Usa parole chiave locali nel titolo", "Specifica se accetti la spedizione o solo ritiro a mano", "Sii chiaro se il prezzo è trattabile o no"]
  },
  {
    channel: "Vinted",
    tips: ["Fai tante foto alla luce naturale", "Aggiungi misure esatte (spalle, lunghezza)", "Usa hashtag pertinenti al brand e stile"]
  },
  {
    channel: "eBay",
    tips: ["Inserisci tutti i dettagli tecnici", "Usa un tono professionale", "Menziona politiche di reso e garanzia"]
  },
  {
    channel: "Facebook",
    tips: ["Usa emoji per attirare l'attenzione", "Sii amichevole e rispondi velocemente", "Condividi anche nei gruppi locali di compravendita"]
  }
];

export default function DescriptionEngine({ product, onDescriptionSelect }: DescriptionEngineProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);

  const compileTemplate = (templateText: string) => {
    let text = templateText;
    text = text.replace(/{{titolo}}/g, product.title || "N/A");
    text = text.replace(/{{brand}}/g, product.brand || "Non specificato");
    text = text.replace(/{{condizione}}/g, product.condition.replace(/_/g, " "));
    text = text.replace(/{{taglia}}/g, product.size || "Non specificata");
    text = text.replace(/{{colore}}/g, product.color || "Non specificato");
    text = text.replace(/{{materiale}}/g, product.material || "Non specificato");
    text = text.replace(/{{prezzo}}/g, formatCurrency(product.price));
    text = text.replace(/{{prezzo_confronto}}/g, product.comparePrice ? formatCurrency(product.comparePrice) : "");
    text = text.replace(/{{sku}}/g, product.sku || "");
    
    if (product.conditionNotes && product.condition !== "NUOVO") {
      text = text.replace(/{{note_difetti}}/g, `Note sulle condizioni: ${product.conditionNotes}`);
    } else {
      text = text.replace(/{{note_difetti}}/g, "");
    }

    return text.trim().replace(/\n{3,}/g, '\n\n');
  };

  const compiledText = useMemo(() => compileTemplate(selectedTemplate.text), [selectedTemplate, product]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Generatore Descrizione</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                selectedTemplate.id === t.id 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 min-h-[120px] text-sm text-slate-700 whitespace-pre-wrap font-mono">
          {compiledText}
        </div>

        <button
          type="button"
          onClick={() => onDescriptionSelect(compiledText)}
          className="taaaac-btn-accent w-full flex items-center justify-center gap-2 py-2"
        >
          <Check className="w-4 h-4" />
          Usa Questo Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHANNEL_TIPS.map(channel => (
          <div key={channel.channel} className="taaaac-card bg-white p-4">
            <h4 className="font-semibold text-sm mb-2 text-slate-800 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              Best Practice {channel.channel}
            </h4>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              {channel.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
