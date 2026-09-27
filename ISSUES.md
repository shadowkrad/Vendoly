# 📋 Vendoly — Issue & Feature Tracker

Registro ufficiale delle issue, feature request e standard di piattaforma del gestionale e cassa **Vendoly**.

---

## 🟢 Issue Attive / In Backlog

### 📌 Issue #PWA-1: Shortcut App Desktop/Mobile integrata nel Menu Laterale (Standard Suite Taaaac)
- **Modulo:** `Dashboard > UI/UX & PWA` (Standard suite Taaaac)
- **Priorità:** Alta
- **Stato:** 📝 Pianificata / In Backlog

#### Descrizione & Principi UX
Implementare la funzionalità PWA cross-platform (testata e perfezionata su Schedly) per consentire all'esercente di utilizzare Vendoly (punto cassa e vendite) come un'applicazione nativa a tutto schermo sul proprio registratore di cassa, tablet Android/iPad o computer desktop.

#### Linee Guida di Design & Requisiti
1. **Zero Banner Invasivi sulla Schermata Operativa**:
   - Nessun banner fisso o barra in cima alla pagina: la testata del menu e l'area di cassa/vendita devono mantenere il **100% dell'altezza dello schermo** senza ingombri visivi.
2. **Integrazione Pulita nel Drawer Laterale (`☰`)**:
   - Inserire la voce *"📲 Installa App · Aggiungi a Home / Desktop [PWA]"* all'interno del menu laterale a scomparsa.
   - Se l'applicazione è già aperta in modalità autonoma (`display-mode: standalone`), il pulsante si nasconde automaticamente.
3. **Modale Guidato Centrato a Tutto Schermo (`createPortal`)**:
   - Al tocco di *"Installa App"*, il drawer si chiude e il modale compare **immediatamente al centro dello schermo** sopra a tutto (`createPortal` su `document.body`, `z-[9999]`), senza rimanere schiacciato o vincolato alla colonna del menu.
   - **iOS / Safari**: guida grafica a 3 passaggi (Condividi ➔ Aggiungi alla schermata Home).
   - **Android / Chrome**: prompt nativo immediato di sistema (`beforeinstallprompt`).
   - **Desktop**: istruzioni per installazione da barra degli indirizzi Chrome/Edge.
