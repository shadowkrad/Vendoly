// ---------------------------------------------------------------------------
// Seed Templates — Template descrizione e referenze prezzo per Quick Lister
// ---------------------------------------------------------------------------

export interface SeedDescriptionTemplate {
  name: string;
  category: string;
  channel: string | null; // null = universale
  templateText: string;
  isDefault: boolean;
}

export interface SeedPriceReference {
  category: string;
  brand: string | null;
  condition: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

// ---------------------------------------------------------------------------
// Template Descrizione
// ---------------------------------------------------------------------------

export const DEFAULT_DESCRIPTION_TEMPLATES: SeedDescriptionTemplate[] = [
  // ── 1. Abbigliamento — universale ──────────────────────────────────────────
  {
    name: "Abbigliamento Generico",
    category: "Abbigliamento",
    channel: null,
    isDefault: true,
    templateText: `🏷️ {{titolo}}

📌 Condizioni: {{condizione}}
👕 Brand: {{brand}}
📐 Taglia: {{taglia}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Capo autentico in perfette condizioni, ideale per ogni stagione. Cuciture rinforzate e tessuto resistente ai lavaggi.{{note_difetti}}

📦 Spedizione rapida e tracciata in tutta Italia.`,
  },

  // ── 2. Abbigliamento Vintage — universale ──────────────────────────────────
  {
    name: "Abbigliamento Vintage",
    category: "Abbigliamento Vintage",
    channel: null,
    isDefault: true,
    templateText: `✨ {{titolo}} — Pezzo Vintage Autentico

📌 Condizioni: {{condizione}}
🏛️ Brand: {{brand}}
📐 Taglia: {{taglia}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Capo d'epoca selezionato a mano dalla nostra collezione. Il vintage di qualità non passa mai di moda: tessuti, rifiniture e dettagli tipici dell'era originale.{{note_difetti}}

🛍️ Ogni capo è pezzo unico — una volta venduto non sarà più disponibile.
📦 Spedizione accurata con imballo protettivo.`,
  },

  // ── 3. Scarpe & Sneakers — universale ──────────────────────────────────────
  {
    name: "Scarpe & Sneakers",
    category: "Scarpe & Sneakers",
    channel: null,
    isDefault: true,
    templateText: `👟 {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
📐 Taglia / Misura: {{taglia}}
🎨 Colorway: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Calzatura originale al 100%, con suola integra e tomaia in ottime condizioni. Vestibilità regolare.{{note_difetti}}

📦 Spedizione con doppio imballo per proteggere la scatola originale.`,
  },

  // ── 4. Borse & Zaini — universale ─────────────────────────────────────────
  {
    name: "Borse & Zaini",
    category: "Borse & Zaini",
    channel: null,
    isDefault: true,
    templateText: `👜 {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Borsa / zaino autentico con hardware originale, cerniere funzionanti e interno pulito. Perfetto per uso quotidiano o occasioni speciali.{{note_difetti}}

📦 Spedizione con imballo rinforzato e protezione antiurto.`,
  },

  // ── 5. Accessori — universale ─────────────────────────────────────────────
  {
    name: "Accessori",
    category: "Accessori",
    channel: null,
    isDefault: true,
    templateText: `🕶️ {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Accessorio originale, selezionato e verificato dal nostro team. Dettagli curati e materiali di qualità.{{note_difetti}}

📦 Spedizione sicura e tracciata.`,
  },

  // ── 6. Orologi & Gioielli — universale ────────────────────────────────────
  {
    name: "Orologi & Gioielli",
    category: "Orologi & Gioielli",
    channel: null,
    isDefault: true,
    templateText: `⌚ {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
🎨 Colore / Finitura: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Pezzo autentico con meccanismo funzionante e cassa in perfetto stato. Vetro privo di graffi visibili. Garanzia di originalità inclusa.{{note_difetti}}

📦 Spedizione assicurata con imballo antiurto dedicato.`,
  },

  // ── 7. Elettronica & Audio — universale ───────────────────────────────────
  {
    name: "Elettronica & Audio",
    category: "Elettronica & Audio",
    channel: null,
    isDefault: true,
    templateText: `🎧 {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Dispositivo funzionante e testato al 100%. Batteria efficiente e connettività verificata. Accessori originali inclusi dove disponibili.{{note_difetti}}

📦 Spedizione con imballo antistatico e protezione dedicata.`,
  },

  // ── 8. Casa & Benessere — universale ──────────────────────────────────────
  {
    name: "Casa & Benessere",
    category: "Casa & Benessere",
    channel: null,
    isDefault: true,
    templateText: `🏡 {{titolo}}

📌 Condizioni: {{condizione}}
🏷️ Brand: {{brand}}
🎨 Colore: {{colore}}
🧵 Materiale: {{materiale}}
🔖 SKU: {{sku}}
💰 Prezzo: € {{prezzo}}{{prezzo_confronto}}

📝 Prodotto per la casa selezionato per qualità e design. Funzionante al 100%, ideale per rendere più confortevole il tuo ambiente.{{note_difetti}}

📦 Spedizione con imballo protettivo rinforzato.`,
  },

  // ── 9. Abbigliamento — Vinted (casual, emoji, hashtag) ────────────────────
  {
    name: "Abbigliamento per Vinted",
    category: "Abbigliamento",
    channel: "VINTED",
    isDefault: true,
    templateText: `✨ {{titolo}} ✨

Stato: {{condizione}}
Brand: {{brand}}
Taglia: {{taglia}}
Colore: {{colore}}
Materiale: {{materiale}}

€ {{prezzo}} 💸{{prezzo_confronto}}

Capo bellissimo, perfetto per completare il tuo outfit! 🔥 Indossato pochissime volte, come si vede dalle foto reali 📸{{note_difetti}}

📦 Spedisco subito con imballo curato!
🛍️ Guarda il mio armadio per sconti su set!

#{{brand}} #{{colore}} #outfit #style #secondhand #{{sku}}`,
  },

  // ── 10. Scarpe & Sneakers — eBay (formale, specifiche tecniche) ───────────
  {
    name: "Scarpe & Sneakers per eBay",
    category: "Scarpe & Sneakers",
    channel: "EBAY",
    isDefault: true,
    templateText: `══════════════════════════════════════════════
  {{titolo}}
══════════════════════════════════════════════

SPECIFICHE TECNICHE:
• Codice Prodotto / SKU: {{sku}}
• Condizioni: {{condizione}}
• Marca: {{brand}}
• Taglia EU: {{taglia}}
• Colore primario: {{colore}}
• Materiale tomaia: {{materiale}}

PREZZO DI VENDITA: € {{prezzo}}{{prezzo_confronto}}

DESCRIZIONE DETTAGLIATA:
Calzatura originale al 100% con garanzia di autenticità. Suola, tomaia e cuciture in perfette condizioni. La taglia corrisponde a quella dichiarata; si consiglia di consultare la tabella taglie del brand.{{note_difetti}}

SPEDIZIONE & RESI:
- Spedizione con Corriere Espresso Tracciabile (GLS / DHL / Poste)
- Evasione entro 24h lavorative dal pagamento
- Imballaggio con doppio cartone per proteggere la scatola originale
- Documento fiscale incluso

DIRITTO DI RECESSO:
Reso garantito entro 14 giorni dalla ricezione secondo normativa europea.`,
  },

  // ── 11. Accessori — Subito (locale, prezzo non trattabile) ────────────────
  {
    name: "Accessori per Subito",
    category: "Accessori",
    channel: "SUBITO",
    isDefault: true,
    templateText: `🏷️ {{titolo}}

📌 CONDIZIONI: {{condizione}}
🏷️ BRAND: {{brand}}
🎨 COLORE: {{colore}}
🧵 MATERIALE: {{materiale}}
🔖 CODICE / SKU: {{sku}}
💰 PREZZO: € {{prezzo}} — FISSO, NON TRATTABILE{{prezzo_confronto}}

📝 DESCRIZIONE:
Accessorio originale, verificato e garantito. Materiali di prima scelta e finiture curate nei dettagli.{{note_difetti}}

📍 CONSEGNA & SPEDIZIONE:
- Ritiro a mano presso il nostro punto vendita
- Spedizione sicura e tracciata con TuttoSubito (24/48h)

⚠️ Prezzo fisso e non trattabile — include la garanzia di autenticità.
Massima serietà. Disponibili per foto aggiuntive su richiesta.`,
  },

  // ── 12. Elettronica — Facebook (social, engagement) ───────────────────────
  {
    name: "Elettronica per Facebook",
    category: "Elettronica & Audio",
    channel: "FACEBOOK",
    isDefault: true,
    templateText: `🔥🔥 {{titolo}} 🔥🔥

✨ OFFERTA SPECIALE ✨

Stato: {{condizione}}
Brand: {{brand}}
Colore: {{colore}}
Materiale: {{materiale}}
Codice: {{sku}}

💰 Solo € {{prezzo}}!{{prezzo_confronto}}

Dispositivo testato al 100% e pronto all'uso! 🚀 Batteria efficiente, accessori inclusi e garanzia di funzionamento.{{note_difetti}}

📍 Ritiro immediato in negozio — niente attese!
🚚 Oppure spedizione rapida in tutta Italia

👉 Commenta "INFO" o scrivici in DM per bloccarlo subito! Non lasciarti sfuggire questo affare 💥

#Elettronica #Tech #Affare #{{brand}} #{{sku}} #Vendoly #Occasione`,
  },
];

// ---------------------------------------------------------------------------
// Referenze Prezzo
// ---------------------------------------------------------------------------

export const DEFAULT_PRICE_REFERENCES: SeedPriceReference[] = [
  // ── Abbigliamento ─────────────────────────────────────────────────────────
  {
    category: "Abbigliamento",
    brand: null,
    condition: "NUOVO",
    avgPrice: 45,
    minPrice: 15,
    maxPrice: 120,
  },
  {
    category: "Abbigliamento",
    brand: null,
    condition: "COME_NUOVO",
    avgPrice: 30,
    minPrice: 10,
    maxPrice: 80,
  },
  {
    category: "Abbigliamento",
    brand: null,
    condition: "OTTIMO",
    avgPrice: 20,
    minPrice: 5,
    maxPrice: 50,
  },

  // ── Scarpe & Sneakers ─────────────────────────────────────────────────────
  {
    category: "Scarpe & Sneakers",
    brand: null,
    condition: "NUOVO",
    avgPrice: 85,
    minPrice: 30,
    maxPrice: 250,
  },
  {
    category: "Scarpe & Sneakers",
    brand: null,
    condition: "COME_NUOVO",
    avgPrice: 55,
    minPrice: 20,
    maxPrice: 150,
  },

  // ── Borse & Zaini ─────────────────────────────────────────────────────────
  {
    category: "Borse & Zaini",
    brand: null,
    condition: "NUOVO",
    avgPrice: 70,
    minPrice: 25,
    maxPrice: 300,
  },
  {
    category: "Borse & Zaini",
    brand: null,
    condition: "COME_NUOVO",
    avgPrice: 45,
    minPrice: 15,
    maxPrice: 180,
  },

  // ── Accessori ─────────────────────────────────────────────────────────────
  {
    category: "Accessori",
    brand: null,
    condition: "NUOVO",
    avgPrice: 40,
    minPrice: 10,
    maxPrice: 100,
  },

  // ── Orologi & Gioielli ────────────────────────────────────────────────────
  {
    category: "Orologi & Gioielli",
    brand: null,
    condition: "NUOVO",
    avgPrice: 150,
    minPrice: 50,
    maxPrice: 500,
  },
  {
    category: "Orologi & Gioielli",
    brand: null,
    condition: "COME_NUOVO",
    avgPrice: 100,
    minPrice: 30,
    maxPrice: 350,
  },

  // ── Elettronica & Audio ───────────────────────────────────────────────────
  {
    category: "Elettronica & Audio",
    brand: null,
    condition: "NUOVO",
    avgPrice: 100,
    minPrice: 20,
    maxPrice: 400,
  },
  {
    category: "Elettronica & Audio",
    brand: null,
    condition: "COME_NUOVO",
    avgPrice: 65,
    minPrice: 15,
    maxPrice: 250,
  },

  // ── Casa & Benessere ──────────────────────────────────────────────────────
  {
    category: "Casa & Benessere",
    brand: null,
    condition: "NUOVO",
    avgPrice: 35,
    minPrice: 10,
    maxPrice: 80,
  },

  // ── Abbigliamento Vintage ─────────────────────────────────────────────────
  {
    category: "Abbigliamento Vintage",
    brand: null,
    condition: "OTTIMO",
    avgPrice: 35,
    minPrice: 10,
    maxPrice: 90,
  },
];
