# Vendoly 🛍️ (Ecosistema Taaaac)

Modulo verticale indipendente di gestione **Cassa Touch (POS)**, vendite al banco, catalogo prodotti e **fidelizzazione clienti (Loyalty Card)**, sviluppato all'interno dell'ecosistema modulare **Taaaac** gestito da Alessio Guidelli ([@shadowkrad](https://github.com/shadowkrad)).

---

## 🎯 Architettura & Ruolo del Progetto

Vendoly opera in sinergia diretta con la console centrale **Taaaac Core** (`https://taaaac.eu`).
All'avvio o in runtime, interroga:
```http
GET https://taaaac.eu/api/public/tenant-config?domain=[domain]&token=[token]
```
Ricevendo:
1. **Stato della licenza**: `ATTIVO`, `SOSPESO`, `IN_SCADENZA`
2. **Moduli Add-on abilitati**: es. `WHATSAPP_REMINDERS`, `LOYALTY_CARD`, `VENDOLY_CHANNEL_MANAGER`, `ONLINE_CATALOG`
3. **Personalizzazione del brand**: Palette colori (`--brand-primary`, `--brand-accent`), denominazione attività e logo.

In caso di mancata connettività verso Taaaac Core, il sistema adotta un **fallback resiliente con cache locale SQLite**, garantendo operatività offline continua alla cassa del negozio.

---

## 🛠️ Stack Tecnologico

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server & Client Components)
- **UI & Design**: React 19, TypeScript, [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Design System**: *Taaaac Design System* (sfondo `bg-slate-50`, card `border-slate-200/90 rounded-2xl shadow-xs`, pulsanti `rounded-xl font-semibold`)
- **Database**: [Prisma ORM](https://www.prisma.io/) con database SQLite isolato per singolo tenant
- **Container**: Dockerfile standalone multi-stage + `docker-compose.yml` integrato con Traefik Reverse Proxy & Let's Encrypt SSL

---

## 🚀 Avvio Rapido Locale

1. **Installazione dipendenze**:
   ```bash
   npm install
   ```

2. **Inizializzazione database e seed dimostrativo**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

3. **Avvio server di sviluppo**:
   ```bash
   npm run dev
   ```
   L'applicativo sarà accessibile su `http://localhost:3000`.

---

## 🌐 Distribuzione & Deployment

### 1. Vercel (Anteprime `cliente-demo`)
Il progetto è configurato per la sincronizzazione continua:
```bash
npm run release:cliente
```
Effettua il push automatico sul branch `cliente-demo` collegato al deployment Vercel.

### 2. VPS Aruba con Traefik SSL (`*.taaaac.eu`)
Ogni tenant viene isolato in un container Docker con persistenza dei dati su volume:
```bash
SUBDOMAIN=cliente1 TAAAAC_TENANT_TOKEN=token_segreto docker compose up -d --build
```
Traefik intercetta automaticamente `cliente1.taaaac.eu` generando il certificato HTTPS Let's Encrypt.
