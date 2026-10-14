# Taaaac Suite — Linee Guida Operative & Regole di Sviluppo

Queste regole sono vincolanti per qualsiasi intervento, modifica o evoluzione del codice della piattaforma Taaaac e di tutti i suoi moduli satellite.

---

## 1. Chiarimento Preventivo Obbligatorio su Ogni Modifica (Gate SemVer)
Prima di eseguire modifiche al codice di qualsiasi modulo applicativo (`Schedly`, `Barberly`, `Tavoly`, `Taskly`, `Vendoly`), l'assistente DEVE **SEMPRE chiedere esplicitamente all'utente**:
1. **Tipo di Release Intenzionale**:
   - 🩹 **FIX / PATCH (`0.0.X`)**: correzione chirurgica a un problema/bug. Nessun restyling grafico non richiesto, nessuna email invasiva al cliente.
   - 🚀 **MINOR (`0.X.0`)**: nuova funzionalità, miglioramento visivo/grafico o evoluzione d'uso. Email automatica con le novità inviata al rilascio.
   - 👑 **MAJOR (`X.0.0`)**: riscrittura architetturale o cambio strutturale profondo.
2. **Versione Target di Destinazione**:
   - In quale release tra quelle attualmente aperte in sviluppo (`IN_DEVELOPMENT`) collocare l'intervento?
   - Se non vi è una versione appropriata aperta, concordare la creazione di una nuova release (es. nuova fix `1.0.5` o avanzamento minor).

---

## 2. Immutabilità delle Release Sigillate (`SEALED`)
- Quando una release viene marcata come **SIGILLATA (`SEALED`)**, essa diventa **congelata, ufficiale e immutabile**.
- **È SEVERAMENTE VIETATO** lavorare o effettuare commit su una versione sigillata (es. `1.0.4`).
- Se emergono segnalazioni o bug su una versione già sigillata, non si modifica la versione sigillata: si apre obbligatoriamente una **nuova FIX/PATCH** (es. `1.0.5`) oppure una nuova **MINOR/MAJOR**.

---

## 3. Indipendenza di Taaaac Core (`taaaac-core`)
- Il progetto **Taaaac Core** (SuperAdmin `admin.taaaac.eu`, dashboard devops, gestione tenant, API di provisioning, dispatcher email, fatturazione e database centrale) è **completamente indipendente** dai moduli dei tenant.
- Il Core viaggia con una propria logica, un proprio ciclo di versionamento e un proprio runtime separato dai template satellite. Le regole SemVer dei moduli non bloccano la manutenzione ordinaria dell'infrastruttura Core.

---

## 4. Tracciamento Obbligatorio nel Documento di Release
- **OGNI singola modifica** apportata a un modulo deve essere descritta e commentata dettagliatamente:
  - Nel file `RELEASE_NOTES.md` del relativo repository.
  - Nella tabella `ModuleRelease` del database di Taaaac (campo `changelog`), in modo da alimentare la console SuperAdmin e la comunicazione al cliente finale.
- I log devono indicare chiaramente: capitolo, motivazione, comportamento prima vs dopo e impatto sui tenant.

---

## 5. Strategia di Rilascio a Doppio Binario (Hotfix Produzione vs Demo Vercel)
Quando una nuova MINOR/MAJOR (es. `1.1.0`) è già aperta in sviluppo, ma occorre rilasciare un **HOTFIX / PATCH (es. `1.0.5`)** per i clienti già in produzione su una versione sigillata (es. `1.0.4`), si applica tassativamente il **doppio binario**:

1. **Canale Sviluppo & Demo Vercel (`main` & `cliente-demo`)**:
   - Mantiene la versione target più avanzata (**`1.1.0`**).
   - Contiene **SIA** le nuove feature della minor/major **SIA** tutti gli hotfix applicati nel tempo.
   - Vercel compila e serve sempre questo canale per mostrare sia le nuove funzionalità sia le correzioni.
   - La versione in `package.json` su `main` e `cliente-demo` **NON retrocede mai** (resta `1.1.0`).

2. **Canale Hotfix Clienti Produzione (`hotfix/1.0.X`)**:
   - Viene staccato direttamente dal tag sigillato di produzione precedente (es. `git checkout -b hotfix/1.0.5 v1.0.4`).
   - Contiene **SOLO** le correzioni chirurgiche richieste, escludendo le feature non ancora pronte della 1.1.0.
   - La versione in `package.json` su questo branch è impostata al numero di patch (es. **`1.0.5`**).
   - Quando l'utente decide di rilasciare la patch ai clienti reali su VPS (`bfestetica`, `littlecreations`, ecc.), il deploy avverrà prelevando il codice da questo branch isolato.
   - Ogni modifica apportata a `hotfix/1.0.X` deve essere contestualmente integrata (merge o cherry-pick) dentro `main` (sulla `1.1.0`), così che la versione futura erediti tutte le correzioni senza discrepanze.

---

## 6. Separazione Rigida dei Contenuti Documentati (Hotfix vs Minor/Major)
- Nelle note di rilascio (`RELEASE_NOTES.md`), nel database centrale (`ModuleRelease`) e nelle comunicazioni email:
  - **I contenuti degli Hotfix / Patch (`0.0.X`) NON devono mai essere fusi o presentati all'interno delle note di una MINOR (`0.X.0`) o MAJOR (`X.0.0`)**.
  - Ogni release documenta **esclusivamente** il proprio perimetro:
    - **Minor / Major**: solo le nuove feature, i miglioramenti grafici e le evoluzioni funzionali (es. WhatsApp Hub per la `1.1.0`).
    - **Patch / Hotfix**: solo le correzioni chirurgiche, bugfix mirati e guide tecniche di servizio (es. fix icone PWA per la `1.0.5`).
  - Su `main` e `cliente-demo`, la sezione `1.1.0` conterrà unicamente le feature della 1.1.0; le correzioni della 1.0.5 compaiono nel capitolo dedicato `## Novità della Versione 1.0.5 (Hotfix / Patch)` collocato subito sotto.
- **Guida Obbligatoria per Aggiornamento Icone PWA nei Hotfix**:
  - Qualsiasi hotfix che tocchi icone, PWA, manifest o asset grafici memorizzati nella cache client dei telefoni DEVE includere obbligatoriamente una guida per il cliente finale con:
    1. La spiegazione tecnica semplice che le app PWA già salvate sulla schermata Home mantengono la vecchia icona a causa della cache nativa permanente del dispositivo mobile (iOS Safari o Android Chrome).
    2. Le istruzioni dettagliate passo-passo per eliminare la vecchia icona e salvare nuovamente l'app dalla finestra del browser su iPhone (Safari) e Android (Chrome).

