# 🏪 Vendoly — Release Notes v1.0.1

## Novità della Versione 1.0.1

### 1. 📲 Shortcut App per PC Cassa, Tablet POS e Smartphone (PWA)
- Aggiunta la voce *"📲 Installa App · Aggiungi a Home / Desktop"* nel menu laterale (`☰`), senza banner invasivi sul punto cassa.
- Modale guidato a schermo intero (`createPortal` su `document.body`, `z-[9999]`) con istruzioni dedicate per PC Cassa Desktop, iPad/Tablet da banco e smartphone Android.

### 2. ⚙️ Impostazioni Modulari a 5 Schede
- Riorganizzazione della sezione `/dashboard/impostazioni` con navigazione a schede:
  - 🏪 **Negozio & Vetrina**: Ragione sociale, P.IVA, insegna, recapiti e indirizzo;
  - 📦 **Vendita & Spedizioni**: Soglia spedizione gratuita, costi corriere, ritiro in sede e sincronizzazione automatica scorte;
  - 🌐 **Dominio & SSL**: Indirizzo vetrina pubblica, certificato Let's Encrypt e puntamenti DNS;
  - 📧 **Email & Notifiche**: Casella Taaaac Mail Engine e notifiche;
  - 🎨 **Aspetto & Brand**: Colore cassa POS, logo e messaggio di cortesia scontrino/ricevuta.

### 3. 📦 Sincronizzazione Scorte Multicanale (Marketplace)
- Allineamento automatico delle giacenze con canali esterni (Subito, Vinted, eBay) ogni volta che un ordine o uno scontrino viene saldato.
