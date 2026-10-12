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
