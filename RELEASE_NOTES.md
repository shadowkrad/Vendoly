# 🏪 Vendoly — Release Notes

## Novità della Versione 1.0.3

### 1. 🖼️ Sistema Brand & Vetrina Adattiva (Zero Deformazioni)
Standardizzazione completa degli asset grafici per il Punto Vendita / Store con salvataggio, compressione automatica client-side WebP e proporzioni protette su qualsiasi dispositivo:
- **Logo Navbar, Header & Ricevute Cassa (`logoUrl`)**:
  - **Dimensione consigliata**: `400 × 100 px` (aspect ratio 4:1 o 3:1).
  - **Vincoli & Rendering**: altezza massima bloccata a 80 px con proprietà CSS `object-contain`, assicurando massima leggibilità e nitidezza senza stiramenti o deformazioni sia su schermi mobile che su monitor da banco cassa.
  - **Formato raccomandato**: PNG con sfondo trasparente o SVG vettoriale.
- **Favicon Browser Ultra-Visibile (`faviconUrl`)**:
  - **Dimensione consigliata**: `128 × 128 px` o `256 × 256 px` (rapporto 1:1 quadrato).
  - **Resa grafica**: sagoma ad alto contrasto con margine di sicurezza per renderla immediatamente distinguibile a 16×16 px sulla tab del browser sia in Dark Mode che in Light Mode. Funge da icona ufficiale per la Web App installata sui dispositivi POS.
- **Logo Insegna / Banner Principale Hero (`logoHeroUrl` + `mostraLogoInHero`)**:
  - Possibilità di sostituire il testo del nome del negozio con un'insegna grafica o banner promozionale al centro della vetrina prodotti.
  - **Dimensione consigliata**: `800 × 240 px` (insegna orizzontale) oppure `400 × 400 px` (marchi, stemmi o loghi tondi).
  - **Adattamento fluido**: auto-scale fino all'85vw su smartphone e massimo 480 px su desktop con proporzioni protette. Fallback automatico sul logo navbar in assenza di insegna separata.
- **Immagine Copertina Vetrina (Hero Background) (`fotoHeroUrl`)**:
  - **Dimensione consigliata**: `1920 × 800 px` (panoramica 16:9 / 21:9).
  - **Formato raccomandato**: JPG o WebP compresso (peso massimo 2 MB).
  - **Resa grafica**: sfondo panoramico a tutta larghezza con filtro protettivo scuro/sfumato (`bg-gradient-to-t` da nero/60% a nero/30%), per garantire il massimo contrasto per titoli, categorie in vetrina, pulsanti d'acquisto e insegna del negozio.

### 2. 🏷️ Esperienza 100% White-Label (Nessun Riferimento al Modulo)
- **Titolo scheda browser dinamico (`generateMetadata`)**: visualizzazione esclusiva di `{Nome Negozio} — {Slogan / Categoria}` nella homepage e nel catalogo, eliminando ogni traccia del nome gestionale o piattaforma.
- **Sottopagine con template coerente**: `{Nome Prodotto / Pagina} | {Nome Negozio}` per un'esperienza d'acquisto totalmente personalizzata.
- **Footer e interfacce clienti pulite**: rimozione totale di link a terze parti o diciture "Powered by". Footer con dicitura istituzionale `© 2026 {Nome Negozio}. Tutti i diritti riservati.`
- **Accesso Staff & Cassa**: dicitura neutrale e professionale `"Area Riservata Staff"`.

### 3. 🎨 Motore Colori Brand Dinamici & Caricamento Drag & Drop
- Sincronizzazione in tempo reale del colore Primario e di Accento direttamente applicati su pulsanti di cassa, carrello, schede prodotto e badge promozionali.
- Pannello impostazioni brand aggiornato con caricamento drag & drop fino a 16 MB con compressione WebP e badge con dimensioni ottimali raccomandate.

### 4. ⚡ Integrazione Vinted Quick-Bridge & Estensione Vendoly Assistant (Cross-Listing 1-Click)
Nuovo ecosistema a due livelli per la pubblicazione rapida dei capi su **Vinted** a commissione 0%:
- **PWA Native Quick-Bridge (Opzione 2 - Zero Installazioni)**:
  - Funziona al 100% da qualsiasi dispositivo (smartphone PWA, iPad/tablet, desktop).
  - Su **smartphone/tablet PWA**: integrazione con la *Web Share API* nativa (`navigator.share`) per trasferire foto in alta definizione e descrizione formattata direttamente nella schermata di nuovo annuncio dell'app ufficiale Vinted in soli 2 tocchi.
  - Su **desktop web**: download rapido sequenziale delle foto numerate e apertura automatica di `vinted.it/items/new` con testo e hashtag già negli appunti.
- **Calcolo Automatico Formato Pacco Vinted**:
  - Determinazione intelligente del formato di spedizione: **Pacco Piccolo** (<500g: top, accessori, intimo), **Pacco Medio** (<1kg: maglioni, pantaloni, felpe, scarpe) e **Pacco Grande** (<2kg: giacche, cappotti, stivali).
- **Protezione Kill-Switch Anti-Doppia Vendita**:
  - Possibilità di associare l'URL dell'annuncio Vinted a Vendoly: alla vendita di un pezzo unico al banco cassa o tramite altro marketplace, il gestionale segnala immediatamente il de-listing e fornisce il link diretto per rimuovere il capo da Vinted.
- **Vendoly Assistant (Estensione Chrome / Edge Manifest V3)**:
  - Repository dedicato `https://github.com/shadowkrad/vendoly-assistant.git` nella cartella `Vendoly Assistant`.
  - Iniezione automatica delle foto tramite `DataTransfer` e compilazione 1-click di titolo, descrizione, prezzo e formati pacco sul sito Vinted con Review Mode per il controllo preventivo.

---

## Novità della Versione 1.0.2

### 1. ✍️ Generatore Descrizioni Intelligenti & Copy Annunci Marketplace
- Scrittura assistita annunci per capi, accessori e articoli con stili e formattazioni ottimizzate per **Vinted**, **Wallapop**, **eBay** e **Subito**.
- Suggerimento automatico titoli persuasivi, condizioni capo, tag e punti chiave per aumentare la conversione e il ranking nelle ricerche.

### 2. 📡 Radar Tracciamento Spedizioni & Notifiche WhatsApp
- Monitoraggio unificato dei colli con autoriconoscimento corriere (GLS, BRT, DHL, Poste Italiane, SDA, UPS).
- Stato di consegna real-time e deep-link di tracciamento.
- **Notifica 1-Click su WhatsApp**: invio immediato al cliente del riepilogo spedizione e tracking link preformattato.

### 3. 📈 Price Discovery Engine & Simulatore Margini Canali
- Motore di stima prezzo di mercato basato su venduto e concorrenza (stile Keepa/Camel).
- Simulatore del guadagno netto per canale: visualizza subito il ricavo reale al netto delle commissioni trattenute da Vinted, eBay o POS.

### 4. 🏷️ Lettere di Vettura & Etichette Termiche 10x15cm (1-Click)
- Generazione istantanea etichette di spedizione in formato standard **100x150 mm** compatibili con tutte le stampanti termiche da banco.
- Codice a barre ad alta definizione (Code 128) per lettura immediata ai punti di ritiro/spedizione e richiesta ritiro corriere.

### 5. ⚡ Hub Multi-Listing Centralizzato & Kill-Switch Anti-Doppia Vendita
- Pannello unificato per monitorare e gestire le inserzioni attive sui vari marketplace.
- **Kill-Switch Istantaneo**: alla vendita di un pezzo unico in negozio fisico tramite il punto cassa Vendoly, la disponibilità online viene azzerata/disattivata per prevenire dispute e doppie vendite.

### 6. 🎨 Personalizzazione Logo Negozio & Favicon
- Caricamento rapido del logo aziendale con ottimizzazione WebP e favicon 128x128 personalizzata per le schede del browser e la vetrina pubblica.
