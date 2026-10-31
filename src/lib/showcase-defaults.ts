export interface TrustBadgeItem {
  id: string;
  icon: "star" | "shield" | "award" | "clock" | "check";
  text: string;
}

export interface GalleryPhotoItem {
  id: string;
  url: string;
  caption?: string;
}

export interface ShowcaseContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  hoursWeekday?: string;
  hoursSaturday?: string;
  hoursSunday?: string;
  storeBadge?: string;
  storeDescription?: string;
  notes?: string;
}

export interface ShowcaseConfig {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;

  // Sezione Hero
  hero: {
    badgeText: string;
    title: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaSecondaryText: string;
    coverImageUrl?: string | null;
    overlayOpacity: number; // 0 - 100
  };

  // Trust Badges
  trustBadges: TrustBadgeItem[];

  // Sezione Chi Siamo / Storia della Boutique
  about: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageUrl?: string | null;
    quoteText?: string;
    quoteAuthor?: string;
  };

  // Galleria Fotografica Boutique / Showroom
  gallery: {
    enabled: boolean;
    title: string;
    subtitle: string;
    images: GalleryPhotoItem[];
  };

  // Visibilità Sezioni
  sections: {
    showHero: boolean;
    showTrustBadges: boolean;
    showChannels: boolean;
    showCatalog: boolean;
    showGallery: boolean;
    showAbout: boolean;
    showHours: boolean;
    showContact: boolean;
  };

  contactInfo?: ShowcaseContactInfo;

  // Etichette Personalizzate


  customLabels: {
    catalogTitle: string;
    catalogSubtitle: string;
    hoursTitle: string;
    contactTitle: string;
  };
}

export const DEFAULT_VENDOLY_CONTACT_INFO: ShowcaseContactInfo = {
  phone: "+39 02 8901 5678",
  whatsapp: "+39 02 8901 5678",
  email: "ordini@vendoly.it",
  address: "Sede operativa del negozio (contattaci per dettagli)",
  hoursWeekday: "09:30 – 13:00 / 15:30 – 19:30",
  hoursSaturday: "09:30 – 19:30 (Continuato)",
  hoursSunday: "Chiuso",
  storeBadge: "Punto Vendita Fisico",
  storeDescription: "Tutti i capi del catalogo possono essere provati e ritirati direttamente al banco senza costi di spedizione. Puoi anche riservare un capo online e ritirarlo entro 24 ore.",
  notes: "WhatsApp attivo per info e disponibilità immediata",
};

export const DEFAULT_VENDOLY_SHOWCASE_CONFIG: ShowcaseConfig = {
  brandName: "Vendoly Boutique & Store",
  primaryColor: "#0f172a",
  accentColor: "#059669",
  logoUrl: null,
  faviconUrl: null,

  hero: {
    badgeText: "✨ Nuova Collezione & Pezzi Unici • Spedizione Rapida 24/48h",
    title: "Capi Selezionati & Oggetti Esclusivi, sempre sincronizzati.",
    subtitle:
      "Scopri la nostra selezione ricercata di abbigliamento, calzature e accessori d'autore. Ordina online con protezione marketplace o prenota con ritiro gratuito in negozio.",
    ctaPrimaryText: "Esplora la Collezione ✨",
    ctaSecondaryText: "Chiedi su WhatsApp",
    coverImageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1280&q=80",
    overlayOpacity: 75,
  },

  trustBadges: [
    { id: "tb1", icon: "shield", text: "100% Capi Verificati & Autentici" },
    { id: "tb2", icon: "clock", text: "Spedizione Rapida in 24/48h" },
    { id: "tb3", icon: "award", text: "Reso Facile 14 Giorni Garantito" },
  ],

  about: {
    enabled: true,
    title: "La Nostra Boutique & Ricerca Stile",
    subtitle: "Passione per i tessuti, cura sartoriale e selezione senza compromessi",
    description:
      "Nata dall'amore per il design e la moda autentica, la nostra boutique seleziona capi unici, sneaker ricercate e accessori senza tempo. Ogni pezzo presente in catalogo viene controllato, sanificato e descritto con la massima trasparenza.",
    imageUrl:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
    quoteText:
      "Vestire bene non significa farsi notare, ma farsi ricordare attraverso la qualità autentica di ogni dettaglio.",
    quoteAuthor: "Direzione Stile & Buyer — Vendoly Store",
  },

  gallery: {
    enabled: true,
    title: "Scorci della Nostra Boutique & Corner",
    subtitle: "Un ambiente accogliente dove toccare con mano la qualità dei tessuti e scoprire novità settimanali",
    images: [
      {
        id: "g1",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        caption: "Corner centrale abbigliamento e novità della stagione",
      },
      {
        id: "g2",
        url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80",
        caption: "Esposizione accessori, pelletteria e calzature selezionate",
      },
      {
        id: "g3",
        url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
        caption: "Zona accoglienza e consulenza outfit personalizzata",
      },
      {
        id: "g4",
        url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
        caption: "Dettagli sartoriali e tessuti naturali certificati",
      },
    ],
  },

  sections: {
    showHero: true,
    showTrustBadges: true,
    showChannels: true,
    showCatalog: true,
    showGallery: true,
    showAbout: true,
    showHours: true,
    showContact: true,
  },


  contactInfo: DEFAULT_VENDOLY_CONTACT_INFO,

  customLabels: {
    catalogTitle: "Catalogo Capi & Articoli",
    catalogSubtitle: "Filtra per canale marketplace, brand o cerca il capo perfetto per il tuo stile.",
    hoursTitle: "Orari Boutique & Ritiro al Banco",
    contactTitle: "Contatti Diretti & Punto Cassa",
  },
};

/**
 * Parsing sicuro con deep-merge dei valori mancanti con i default
 */
export function parseShowcaseConfig(raw: string | null | undefined): ShowcaseConfig {
  if (!raw || typeof raw !== "string" || raw.trim() === "" || raw === "{}") {
    return { ...DEFAULT_VENDOLY_SHOWCASE_CONFIG };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_VENDOLY_SHOWCASE_CONFIG,
      ...parsed,
      hero: {
        ...DEFAULT_VENDOLY_SHOWCASE_CONFIG.hero,
        ...(parsed.hero || {}),
      },
      trustBadges: Array.isArray(parsed.trustBadges)
        ? parsed.trustBadges
        : DEFAULT_VENDOLY_SHOWCASE_CONFIG.trustBadges,
      about: {
        ...DEFAULT_VENDOLY_SHOWCASE_CONFIG.about,
        ...(parsed.about || {}),
      },
      gallery: {
        ...DEFAULT_VENDOLY_SHOWCASE_CONFIG.gallery,
        ...(parsed.gallery || {}),
        images: Array.isArray(parsed.gallery?.images)
          ? parsed.gallery.images
          : DEFAULT_VENDOLY_SHOWCASE_CONFIG.gallery.images,
      },
      sections: {
        ...DEFAULT_VENDOLY_SHOWCASE_CONFIG.sections,
        ...(parsed.sections || {}),
      },
    
  customLabels: {
        ...DEFAULT_VENDOLY_SHOWCASE_CONFIG.customLabels,
        ...(parsed.customLabels || {}),
      },
    };
  } catch {
    return { ...DEFAULT_VENDOLY_SHOWCASE_CONFIG };
  }
}
