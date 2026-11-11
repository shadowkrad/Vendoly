# 🚀 Vendoly — Release Notes

## Novità della Versione 1.1.3 (Patch)

### 🧭 Menu Gestionale e Impostazioni Riorganizzati in Gruppi
- **Menu laterale più ordinato (`SidebarGruppi.tsx`, `DashboardSidebar.tsx`)**: le voci vendite/cassa/canali sono raccolte nel gruppo apribile *Vendite* con apertura automatica sulla pagina attiva.
- **Impostazioni raggruppate per area e salvataggio comodo su mobile (`/dashboard/impostazioni`)**: le sezioni sono riunite in 5 gruppi chiari (*Negozio*, *Notifiche*, *Fidelity e buoni*, *Aspetto e dominio*, *Dispositivi*; *Fidelity e buoni* visibile solo se attiva dal Portale) con barra fissa **Salva modifiche** su mobile.

### 👤 CRM & Scheda Cliente Unificata in Stile Schedly con Gestione Punti e Invio Tessera
- **Elenco CRM a tabella per righe (`CustomersClient`)**: sostituita la griglia a card quadrate con la vista a righe compatte in stile Schedly/Taskly (tabella su desktop e lista compatta su mobile), mostrando per ciascun cliente anagrafica/indirizzo, contatti + WhatsApp rapido, taglie abiti/scarpe/brand preferiti/note, punti fedeltà + ordini/spesa e azioni (`Storico`, `Scheda →`, `Elimina`).
- **Modifica cliente accorpata nella scheda dedicata (`/dashboard/clienti/[id]`) e fix overlay modali**: rimosso il tasto matita *Modifica* dalle card in `CustomersClient` (ora tutte le modifiche avvengono da **Scheda →**, mantenendo in lista solo il modale per *Registra Nuovo Cliente* e la vista rapida storico acquisti); spostati i modali fuori dal contenitore `space-y-6` con `!mt-0 z-[60]` e `max-h-[90vh] overflow-y-auto` per eliminare la fascia chiara superiore.
- **Nuova scheda dettaglio cliente (`/dashboard/clienti/[id]`) e endpoint `GET /api/clienti/[id]`**: dalla lista CRM (`CustomersClient`) il tasto diretto **Scheda →** apre la pagina completa con anagrafica, taglie/brand, codice fiscale, consenso marketing, buoni attivi e storico ordini.
- **Gestione punti nel profilo e invio manuale tessera (`ClienteFedeltaPanel`)**: nella scheda cliente si possono accreditare punti da spesa (€) o punti extra manuali, riscattare premi disponibili, aprire/copiare la tessera digitale (`/tessera/[token]`) e generare il testo precompilato per inviare manualmente la scheda punti via **WhatsApp (`wa.me`)** o **Email (`mailto:`)**.

### 📱 Icona dell'App e della Scheda Browser Sempre Nitida e Aggiornata
- **Aggiornamento immediato al cambio logo/icona**: ogni volta che il titolare carica una nuova icona o un nuovo logo nello Studio/Impostazioni, l'indirizzo dell'icona nella pagina e nel manifesto PWA include automaticamente un codice di versione univoco (`&v=`). In questo modo browser e smartphone scaricano subito la nuova immagine senza restare bloccati sulla vecchia copia in memoria.
- **Formato e dimensioni perfetti per ogni schermo (`sharp`)**: l'endpoint `/api/pwa-icon` e l'icona della tessera fedeltà digitale (`/tessera/[token]/icona`) convertono e ridimensionano sempre l'immagine in un **PNG quadrato reale** alle misure esatte richieste (`32×32`, `180×180`, `192×192`, `512×512`), partendo anche da immagini WebP, JPEG o SVG.
- **Icona iPhone su fondo opaco e icona Android adattiva (`maskable`)**: per iPhone (`180×180`) le trasparenze vengono appiattite su sfondo bianco evitando il riquadro nero di iOS; per Android (`maskable=1`) il logo viene centrato con margine di sicurezza del 10% per lato sul colore del negozio così da non venire tagliato dalle icone tonde o a goccia.

### 🔄 Sincronizzazione Canali Più Chiara
- **Sincronizzazione canali più chiara**: se il servizio centrale non risponde per un momento, la scheda dice "stato non disponibile, riprova tra poco" invece di far credere che Google e Facebook non siano collegati, e non blocca la sincronizzazione.

#### 💡 Guida per Aggiornare l'Icona già Salvata sulla Schermata Home dello Smartphone
Le app web (PWA) già aggiunte in precedenza sulla schermata Home del telefono conservano la vecchia icona perché i sistemi operativi mobili (iOS Safari e Android Chrome) salvano l'immagine in una memoria permanente del telefono al momento del primo salvataggio. Per vedere subito la nuova icona ad alta definizione:
1. **Su iPhone (Safari)**:
   - Tieni premuto il dito sulla vecchia icona dell'app nella schermata Home e tocca **Elimina segnalibro** (oppure **Rimuovi app**).
   - Apri **Safari**, vai all'indirizzo del gestionale (o della tua tessera fedeltà), tocca il pulsante **Condividi** (il quadrato con la freccia verso l'alto in basso) e scegli **Aggiungi alla schermata Home**.
2. **Su Android (Chrome)**:
   - Tieni premuto il dito sulla vecchia icona nella schermata Home e trascinala su **Rimuovi** / **Disinstalla**.
   - Apri **Chrome**, visita l'indirizzo del gestionale (o della tua tessera fedeltà), tocca il menu **⋮** in alto a destra e seleziona **Aggiungi a schermata Home** (oppure **Installa app**).


---

### 🛠 Avviso di Assistenza e Buoni Regalo
- **Avviso "Assistenza Taaaac connessa" più discreto**: al cliente compare una striscia sottile (non più un grosso riquadro fisso sopra i contenuti), che si può chiudere, e sparisce da sola pochi minuti dopo che l'operatore è uscito, anche se non ha premuto "Termina".
- **Buoni e biglietti senza contatto**: se il buono non ha un cliente con email o cellulare, il modulo lo segnala, propone di creare la scheda cliente e, prima di emettere, chiede conferma (senza contatto il buono si può solo stampare). Nella consegna il pulsante WhatsApp mancante ora ha una spiegazione.
- **Riscatto rapido dall'elenco buoni**: ogni buono attivo ha il pulsante "Riscatta" direttamente nella riga (dove si vede il codice): per i servizi basta confermare, per gli importi si scrive la spesa del cliente e si vede lo sconto prima di confermare.

### 🖨 Stampa dei Buoni
- **Niente biglietto da visita nel buono**: stampando il cartoncino non compare più il riquadro con gli orari: sul foglio c'è solo il buono. "Stampa buono A4" è ora il primo pulsante e usa la grafica dell'attività.
- **Testi dentro le caselle**: titolo, destinatario, messaggio e codice si rimpiccioliscono da soli quando sono lunghi, senza uscire dai riquadri né finire sotto il QR code.

### 💬 Messaggi WhatsApp ai Clienti
- **Numero sempre completo di prefisso**: i pulsanti WhatsApp (clienti, buoni, tessera, ordini e prenotazioni) ora aggiungono da soli il prefisso +39 ai cellulari salvati senza, e non lo raddoppiano per quelli che già lo hanno. Prima un cliente salvato come "334 776 4925" apriva WhatsApp con un numero sbagliato.

## Novità della Versione 1.1.2 (Patch)

- Il pallino WhatsApp compare solo nella vetrina pubblica del sito: non piu' nelle pagine interne, nelle tessere e nei buoni dei clienti (prima bastava una pagina non prevista per vederlo).
### 1. 🔒 Anagrafica Clienti Protetta
- **Accesso riservato**: l'elenco, la creazione, la modifica e la cancellazione dei clienti tramite indirizzo `/api/clienti` ora richiedono l'accesso del titolare (prima rispondevano a chiunque conoscesse l'indirizzo).

### 2. 👤 Scheda Cliente Rinnovata
- **Un numero, un cliente**: lo stesso telefono (anche scritto con spazi, trattini o +39) è sempre la stessa scheda: se esiste già il gestionale lo segnala.
- **Cellulare o fisso**: i numeri fissi restano ammessi ma non ricevono WhatsApp né messaggi automatici.
- **Data di nascita** facoltativa e **consenso promozionale**, base per il buono compleanno.
- **Punti non più a mano**: la rettifica libera del saldo è stata tolta; ogni variazione resta registrata.
- **Telefono ed email facoltativi**: per ora per registrare un cliente basta il nome (in attesa di decidere come comunicare con gli altri sistemi). La finestra della scheda ora sta sempre nello schermo, scorre al suo interno e tiene titolo e pulsanti sempre visibili.

### 3. 🎟️ Fedeltà a Punti Vera
- **Punti sulla spesa**: quando un ordine risulta pagato (pagato, pronto al ritiro, spedito, consegnato o completato) il cliente con la scheda guadagna i punti secondo la regola del titolare, una sola volta per ordine e con storno se l'ordine viene annullato.
- **Cassa fedeltà**, premi scelti dal titolare e **tessera digitale** con logo e colori del negozio (link privato con QR), aggiungibile alla schermata Home del telefono con il logo come icona. Le pagine Fedeltà e Buoni non sono più schermate di esempio: lavorano sui dati veri del negozio.

### 4. 🎁 Buoni Completi, Invio e Stampa
- **Un buono per ogni motivo**: regalo, sconto, compensazione, gesto commerciale, premio punti, compleanno, promozione; valore in euro, percentuale o articolo in omaggio; scadenza facoltativa, spesa minima, uso in più volte o unico.
- **Cassa con anteprima**, annullo con motivo e movimenti registrati. **Email** (di default, dal servizio Taaaac), **WhatsApp a scelta dell'esercente** (mai in automatico, mai verso i fissi), pagina del buono con QR, **stampa A4 o ricevuta da 80 mm** e ristampa con lo stesso codice.

### 5. 🎂 Compleanno e Premi che Diventano Buoni
- **Buono compleanno automatico**, una volta per cliente e per anno, con email solo a chi ha dato il consenso. Parte quando si apre la pagina Buoni o da `/api/cron/compleanni`.
- **Premio punti → buono**: riscattando un premio si scalano i punti e nasce un buono intestato al cliente, nella stessa operazione.

### 6. 🏪 Dati del Negozio e Orari in un Solo Posto
- **Una sola scheda**: nome, indirizzo, telefono, email, **descrizione** e **orari** del negozio si modificano solo in Impostazioni > Negozio. Vetrina, piè di pagina, Google, Facebook e Instagram leggono da lì: gli orari sono sempre identici ovunque, giorni di chiusura e ferie compresi.
- **Studio Aspetto**: mostra questi dati in sola lettura e decide solo cosa far vedere (interruttori per indirizzo, telefono, email, contatti rapidi). Colori e logo si cambiano solo nello Studio.
- Lo Studio non può più sovrascrivere i dati del negozio, nemmeno salvando una vecchia copia.
- **Orari facoltativi**: in Impostazioni > Negozio scegli se avere un negozio fisico (orari di apertura, inviati anche a Google e social), mostrare solo un orario di assistenza clienti (non inviato ai canali) oppure nessun orario, per chi vende solo online.


### 🎨 Studio Grafico Buoni Regalo & Biglietti da Visita (Solo Fronte o Fronte/Retro)
- **Dati di biglietti e buoni: ereditati, modificabili solo se vuoi**: nome, recapiti e orari stampati sono sempre quelli di Impostazioni. Nella scheda *5. Dati* dell'editor puoi, su tua scelta esplicita, usare testi diversi solo su biglietti e buoni ("Modifica solo qui") e tornare ai dati di Impostazioni con un clic ("Ripristina"). Nulla di un altro cliente compare più come esempio.
- **Editor Visivo in Tempo Reale**: in *Impostazioni → Biglietti & Buoni* (e direttamente dalla pagina *Buoni*) puoi personalizzare e vedere subito l'anteprima 1:1 del tuo **Biglietto da Visita (85 × 55 mm)** e dei **Buoni Regalo**, con guide dei margini di taglio attivabili.
- **5 Stili + Sfondo Personalizzato**: scegli tra *Botanico & Luxury* (con rami d'ulivo, stelline ✦ e filetti dorati), *Classico Elegante*, *Heritage & Artigianale*, *Moderno & Minimal* o *Sfondo Personalizzato Puro*. Puoi anche caricare una tua immagine/texture di sfondo distinta per Fronte, Retro e Buoni e regolare il **velo di contrasto** per mantenere le scritte sempre nitide.
- **Biglietto da Visita Solo Fronte oppure Fronte + Retro**:
  - **Solo Fronte**: stampa su un solo lato (1 pagina A4 da 10 biglietti), con opzione per mostrare una riga compatta degli orari o il QR di prenotazione direttamente sul fronte.
  - **Fronte + Retro**: fronte con medaglione/logo (mai ritagliato) e recapiti + retro compilato in automatico con gli **orari ufficiali dell'attività**, il QR Code di prenotazione o le righe promemoria prossimo appuntamento (2 pagine A4 a registro con 10 fronti + 10 retri, oppure formato singolo 1:1 per tipografia).
- **Nuovo Cartoncino Regalo per Busta**: oltre a *Stampa A4* e *Ricevuta 80 mm*, i buoni si stampano anche come **Cartoncino Regalo panoramico** da consegnare in busta regalo, coordinato al tema dell'attività.

---

## Novità della Versione 1.1.1 (Patch)

### 1. ✈️ Telegram Gestito da Taaaac Core (Hub Centralizzato)
- **Un solo posto per configurare Telegram**: il pannello Telegram locale è sostituito da una scheda di sola lettura (stato, bot, avvisi attivi) con il link al portale Taaaac, da cui si attiva o disattiva il canale.
- **Nessun token nel modulo**: token del bot e chat ID non vengono più inseriti né salvati nelle impostazioni del modulo, e il test non passa più dal browser.
- **Stato letto dal Core**: la scheda legge `telegram*` da `/api/public/tenant-config` (mai token né chat ID).

---

## Novità della Versione 1.1.0

### 1. 💬 Integrazione WhatsApp a 360° (Smart Link Gratuito & Connessione Taaaac Hub)
- **Floating WhatsApp Widget sulla Vetrina Store**: Aggiunto il pulsante galleggiante WhatsApp ufficiale in basso a destra su tutte le pagine dello storefront pubblico (FloatingWhatsAppWidget), consentendo ai visitatori di chattare con il negozio per info su disponibilità, foto dal vivo o spedizioni.
- **Perfezionamento Grafico Bollino WhatsApp Ufficiale**: integrato il tracciato vettoriale ufficiale Meta WhatsApp (fumetto solido bianco puro #FFFFFF ad alta definizione con cornetta verde #25D366 in risalto), eliminando il vecchio bordo vuoto wireframe e garantendo la massima nitidezza visiva su tutti i dispositivi.
- **Pulsante Notifiche Spedizione & Ordini 1-Click**: Nella gestione ordini della dashboard, l'esercente può inviare con 1-click la notifica di merce pronta per il ritiro in sede o il messaggio di tracking con link universale ParcelsApp / 17Track.
- **Client Standardizzato (@/lib/whatsapp-client & @/lib/whatsapp-server)**: Connessione diretta e leggera al micro-servizio centralizzato di Taaaac Core per le notifiche cloud.

### 2. 🌐 Hub Sincronizzazione Omnicanale (Google Maps, Meta Facebook & IG, WhatsApp Business)
- **Aggiornamento Orari Negozio All'Unisono con 1 Click**: Dalla scheda *Dashboard > Impostazioni > Negozio & Vetrina*, il pulsante 🚀 Salva e Sincronizza Orari Negozio su Google & Canali aggiorna simultaneamente gli orari di apertura ordinari sulla scheda Google Business Profile (Maps & Ricerca), sulle Pagine Meta (Facebook & Instagram) e sul profilo WhatsApp Business del negozio.
- **Badge di Stato Canali in Tempo Reale**: Nuova scheda visiva nella gestione negozio con indicatori live dello stato di connessione e sincronizzazione per Google Maps, Meta, WhatsApp Business e Google Review Booster.
- **Architettura Centralizzata Taaaac Core**: Gestione centralizzata e sicura di tutti i token di accesso e delle API dei canali esterni tramite Taaaac Core.

### 3. ⭐ Google Review Booster Automatico via Email (5 Stelle Intelligenti)
- **Email Post-Acquisto Automatica a Costo Zero**: Quando un ordine viene contrassegnato come COMPLETATO, il sistema invia in automatico un'email con 5 stelle interattive da 
oreply@taaaac.eu senza consumare la quota messaggi WhatsApp.
- **Routing Intelligente Reputazione**:
  - **4 e 5 Stelle (Acquisto Soddisfatto)**: Reindirizzano il cliente direttamente alla scheda Google Maps per pubblicare la recensione a 5 stelle verificata.
  - **1, 2 e 3 Stelle (Customer Care)**: Reindirizzano al modulo di feedback privato interno (/feedback) permettendo al merchant di risolvere privatamente qualsiasi dubbio o richiesta di assistenza.

---


## Novità della Versione 1.0.10 (Hotfix / Patch)

### 1. 💬 Pallino WhatsApp Unificato (Attivazione da Taaaac Core)
- **`FloatingWhatsAppWidget` allineato su tutta la flotta**: il pulsante galleggiante compare sulle pagine pubbliche solo se il modulo WhatsApp è attivo nella configurazione del tenant (`/api/public/tenant-config` di Taaaac Core).
- **Nascosto nelle aree gestionali**: non appare in `/dashboard`, `/admin` e `/login`.
- **Risposta del Core normalizzata**: lettura uniforme dei campi del tenant-config.

### 2. ⚙️ Pannelli Telegram/Fidelity Visibili & Salvataggio Istantaneo dei Toggle
- **Auto-save**: in `/dashboard/impostazioni` ogni interruttore salva subito nel database e aggiorna la vista, senza un secondo pulsante "Salva".
- **Pannelli dedicati**: i pannelli Telegram Hub e Fidelity sono ora sempre raggiungibili dalle impostazioni.

---

## Novità della Versione 1.0.8 (Hotfix / Patch)

### 1. 🏪 Vetrina Pubblica 100% Editabile & Zero Testi Hardcoded
- **Personalizzazione Totale del Punto Vendita**: Eliminato qualsiasi recapito o indirizzo di fallback cablato nel codice sorgente. L'esercente può ora modificare liberamente dalla dashboard ogni singolo elemento della propria vetrina:
  - Indirizzo esatto del negozio / punto vendita fisico.
  - Recapito telefonico di cassa e contatto WhatsApp per richieste e foto dal vivo.
  - Orari di apertura completi: dal lunedì al venerdì, sabato (anche con orario continuato) e festivi.
  - Badge della sede (es. "Punto Vendita Fisico") e descrizione delle modalità di ritiro al banco e prova capi.
- **Nuovo Tab "Orari & Negozio" nel Live Showcase Studio**: Aggiunta una scheda dedicata nell'editor visivo della vetrina con controlli in tempo reale e simulatore responsive istantaneo sia per smartphone che per desktop.
- **Contatti Dinamici nel Footer**: Il piè di pagina della vetrina pubblica si aggiorna automaticamente riflettendo i recapiti e l'indirizzo configurati, garantendo un'esperienza di acquisto trasparente e professionale per i clienti finali.

### 2. 🎨 Pulizia Estetica Navbar: Rimozione Badge Invasivi
- **Intestazione Minimale & Logo Protagonista**: Rimosso il micro-badge fisso "Hub Multi-Marketplace" accanto al nome del negozio nella barra di navigazione pubblica, rendendo la testata elegante e senza scritte ridondanti.

---

## Novità della Versione 1.0.7 (Hotfix / Patch)

### 1. 🔐 Autenticazione Distinta: Email + Password Titolare & PIN Staff Cassa
- **Accesso Titolare Diretto con Email e Password**: Il titolare del punto vendita accede inserendo l'indirizzo email e la password ricevuti al momento della registrazione o aggiornati nel proprio account Taaaac, eliminando la richiesta confusa del solo PIN/Password generica.
- **PIN Tastierino Touch Dedicato ai Collaboratori**: Il tastierino numerico PIN rapido è ora dedicato esclusivamente agli operatori di cassa e collaboratori del negozio per sbloccare rapidamente i tablet e le postazioni POS.
- **Centralizzazione Sicurezza e MFA su Taaaac Core**: Le impostazioni avanzate di sicurezza (2FA TOTP, codici di recupero, cambio password) sono centralizzate al 100% nella dashboard utente di Taaaac (taaaac.eu/portal), semplificando l'esperienza all'interno del modulo satellite.

---
## Novità della Versione 1.0.6 (Patch di Sicurezza e Hardening Accessi)

### 1. 🛡️ Autenticazione a Due Fattori (2FA / MFA Volontaria con Codici di Emergenza)
- **Supporto TOTP Universale**: Ogni commerciante o addetto alla cassa può abilitare liberamente l'autenticazione a due fattori scansionando il QR code con qualsiasi app Authenticator standard (Google Authenticator, Microsoft Authenticator, Apple Passwords, 1Password, Bitwarden).
- **8 Codici di Recupero di Emergenza**: Generazione di codici di backup monouso crittografati nel database, da conservare per accedere qualora lo smartphone non fosse momentaneamente disponibile.
- **Login Dinamico a 2 Step**: Interfaccia di accesso con verifica delle credenziali e passaggio immediato all'inserimento del codice a 6 cifre o di emergenza.

### 2. 📧 Allerta Immediata per Accesso da Nuovo Dispositivo
- **Riconoscimento Automatico Dispositivi**: Rilevamento di browser, sistema operativo e indirizzo IP ad ogni login.
- **Email di Sicurezza Automatica**: Al primo accesso da un nuovo computer, smartphone o POS, il sistema invia un'email di avviso con data, ora, dispositivo e indirizzo IP, per la massima tranquillità.

### 3. 📋 Centro di Controllo Sicurezza, Registro Accessi e Disconnessione Remota
- **Pannello "Sicurezza & 2FA" in Dashboard**: Accessibile direttamente dalla barra laterale della dashboard per verificare i dispositivi registrati e la cronologia degli accessi con esito dettagliato.
- **Disconnessione Remota Globale (Kill-Switch)**: Possibilità di revocare all'istante l'accesso da tutti i dispositivi remoti con un singolo clic.

### 4. 🛑 Protezione Anti Brute-Force e Honey-Pot Anti-Bot
- **Blocco Temporaneo Automatico**: Protezione attiva contro tentativi di indovinare la password; dopo 5 tentativi consecutivi errati dall'IP o sull'account, l'accesso viene sospeso per 15 minuti con timer di sblocco in tempo reale.
- **Honey-Pot Silenzioso**: Campo esca invisibile nel modulo di login che respinge all'istante bot automatizzati prima dell'elaborazione.

### 5. 🎄 Calendario Festività Nazionali, Aperture Straordinarie Shopping & Preavviso a 7 Giorni
- **Motore Festività Nazionali Italiane con Calcolo Pasqua**: Riconoscimento automatico delle 12 festività ufficiali italiane (Natale, Capodanno, Epifania, Pasqua, Lunedì dell'Angelo, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, Tutti i Santi, Immacolata, Santo Stefano) tramite algoritmo astronomico di Meeus/Jones/Butcher.
- **Nuovo Pannello "Orari & Festività" in Dashboard**: Gestione unificata degli orari del negozio fisico (feriali, sabato, domenica) e delle date speciali (chiusure per ferie, orari continuati o aperture straordinarie per lo shopping domenicale e saldi).
- **Banner Intelligente di Preavviso (7 Giorni di Anticipo)**: Banner interattivo in cima alla panoramica della dashboard che avvisa l'esercente con 7 giorni di anticipo sull'avvicinarsi di ogni festività, indicando se il negozio risulterà aperto o chiuso e fornendo una scorciatoia rapida 1-click per programmare aperture straordinarie.

---

## Novità della Versione 1.0.5 (Hotfix Produzione)

### 1. 📱 Fix Icone PWA per Smartphone (iOS & Android) & Supporto Favicon Personalizzata
- **Risoluzione Icone Vuote o Fallback su Mobile**: Risolto il problema per cui su iPhone e dispositivi Android le icone PWA apparivano come quadrati monocromatici vuoti o lettere di ripiego. iOS Safari richiede rigorosamente formati PNG raster per `apple-touch-icon`, scartando i file vettoriali SVG.
- **Logica Intelligente di Fallback**:
  - Se il cliente/tenant ha caricato un proprio logo o favicon personalizzato nelle impostazioni di brand (*Dashboard > Impostazioni > Aspetto & Brand*), la PWA su smartphone adotta automaticamente l'immagine del cliente.
  - Se il cliente non ha configurato una favicon, il sistema inietta l'icona ufficiale nativa in alta risoluzione (Shopping Bag moderna con badge cassa su Electric Indigo) con formati specifici (`apple-touch-icon.png` a 180x180 per Apple, `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` per Android).
- **Allineamento Universale Manifest**: Serviti contemporaneamente sia `/manifest.json` sia `/manifest.webmanifest` con MIME type standard e categorie W3C PWA valide.

### 2. 🧭 Fix Navigazione Menu Impostazioni su Smartphone & PWA (Risoluzione Schermata Singola)
- **Risoluzione Blocco Prima Pagina**: Risolto il problema per cui su smartphone e display mobile i pulsanti delle impostazioni occupavano il 100% della larghezza orizzontale nascondendo le altre sezioni e impedendo l'accesso alle schede successive (Spedizioni, Dominio, Email, Dispositivi, Brand).
- **Nuovo Selettore Nativo Mobile**: Introdotto un menu a tendina rapido nativo su smartphone (< lg) ancorato stabilmente sotto l'header (sticky). Consente di selezionare ed esplorare istantaneamente qualsiasi sezione con 1 tap, sfruttando il picker nativo di iOS e Android. Su desktop la barra di navigazione verticale completa rimane intatta.

### 3. 🔐 Autenticazione Master Qualificata & Accesso Rapido Passkey Biometrica (Zero Leak Credenziali)
- **Eliminazione Leak Password/PIN in Produzione**: Risolto il problema per cui sui container di produzione apparivano indicazioni di test a causa di un controllo invertito sull'ambiente demo. Rimosso ogni riferimento o credenziale in chiaro.
- **Autenticazione Master con Password Ufficiale**: L'accesso primario avviene tramite password del tenant (credenziali Taaaac ricevute alla registrazione), proteggendo la cassa e i dati del negozio da accessi non autorizzati.
- **Sblocco Rapido Quotidiano con Passkey (FaceID / Impronta / PIN Dispositivo)**: Registrando lo smartphone o il tablet cassa in *Impostazioni > Dispositivi PWA*, l'esercente può sbloccare l'applicazione in 1 secondo tramite biometria nativa o PIN del dispositivo, senza ridigitare la password master.
- **Accesso 1-Click per Ambiente Demo Vercel**: Nelle versioni di test/demo su Vercel è ora presente un pulsante dedicato `Accedi alla Demo (1-Click)` che consente a clienti e prospect di esplorare il gestionale all'istante senza attrito.

### 4. 📲 Guida Rapida per il Cliente: Come Aggiornare l'Icona sul Tuo Smartphone
> **⚠️ Nota Tecnica Importante sulla Cache dei Telefoni:**
> I sistemi operativi mobili (Apple iOS e Android) memorizzano l'icona dell'applicazione nella cache locale permanente al momento del primo salvataggio sulla schermata Home. Pertanto, **le app già aggiunte in precedenza continueranno a mostrare la vecchia icona finché non vengono registrate nuovamente**.

#### 🛠️ Istruzioni Passo-Passo per Sostituire la Vecchia Icona (30 secondi):
1. **Elimina la vecchia icona dalla schermata Home**:
   - Tieni premuto il dito sull'icona attuale dell'app sullo schermo del telefono fino a quando compare il menu a comparsa, quindi tocca **"Rimuovi app"** (oppure **"Elimina dalla schermata Home"**).
2. **Apri il tuo gestionale nel browser**:
   - Apri il browser dello smartphone (**Safari** su iPhone/iPad oppure **Chrome** su Android) e collegati all'indirizzo del tuo sito web.
3. **Aggiungi nuovamente l'app alla schermata Home**:
   - **Su iPhone (iOS / Safari)**: tocca l'icona di condivisione in basso al centro (il quadrato con la freccia verso l'alto ⬆️), scorri il menu verso il basso e tocca **"Aggiungi alla schermata Home"**, quindi conferma con **"Aggiungi"** in alto a destra.
   - **Su Android (Chrome)**: tocca il menu con i tre puntini in alto a destra (⋮), seleziona **"Aggiungi a schermata Home"** (o **"Installa applicazione"**), e conferma con **"Aggiungi"**.
4. **Fatto!** L'icona sulla schermata Home del tuo smartphone sarà ora perfettamente nitida, con la grafica dedicata o con il logo del tuo brand.

---

## Novità della Versione 1.0.4

### 1. 📦 Ottimizzazione Catalogo & Varianti Prodotti
- **Gestione Categorie e Varianti**: Creazione e modifica semplificata di prodotti con varianti di taglia/colore e gestione giacenze.
- **Prezzi e Promozioni**: Visualizzazione chiara dei prezzi originali e scontati nella vetrina pubblica.

### 2. 🛒 Carrello & Checkout Mobile-First
- **Esperienza d'Acquisto Fluida**: Carrello intuitivo per clienti da smartphone con calcolo automatico spese di spedizione o ritiro in sede.
- **Riepilogo Ordine 1-Click**: Schermata di riepilogo pulita e conferma immediata via email o WhatsApp.

### 3. 📊 Dashboard Venditore Semplificata
- **Monitoraggio Ordini in Entrata**: Avanzamento stato ordini (In Attesa, In Preparazione, Spedito, Consegnato) a 1-tap.
- **Filtri e Ricerca Rapida**: Ricerca ordini per cliente, data o codice spedizione.

---

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
  - **Pacchetto di installazione rapida integrato**: archivio ZIP scaricabile con 1 clic direttamente da Vendoly (`/downloads/vendoly-assistant.zip`).
  - **Rilevamento Live & Guida Interattiva**: monitoraggio in tempo reale dello stato dell'estensione (Attiva/Non rilevata) sia nella sezione Canali che nel modal Vinted Quick-Bridge, con guida passo-passo a 3 passaggi per Chrome, Edge e Brave.

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