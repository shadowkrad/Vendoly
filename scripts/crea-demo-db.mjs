// Crea il database della DEMO di Vendoly (prisma/demo.db) con dati di fantasia: clienti (anche con telefono fisso),
// punti fedelta' sulla spesa, buoni di ogni tipo e buoni compleanno gia' pronti.
// Prodotti e ordini della demo restano quelli di esempio gia' previsti dal gestionale (se il database e' vuoto li usa lui).
// Le date sono relative a OGGI: si rigenera quando la demo invecchia.
//
// Uso:  node scripts/crea-demo-db.mjs      (oppure: npm run demo:rigenera)
// REGOLE: i link di tessere e buoni sono derivati da nomi/codici (sempre uguali), cosi' una rigenerazione
// non rompe i link gia' inviati. Mai dati demo nei database dei clienti veri.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "prisma", "demo.db");
const schemaTmp = path.join(root, "prisma", ".schema-demo.prisma");

// 1) Database nuovo con le tabelle esatte dello schema (stesso schema, altro file)
for (const f of [out, `${out}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);
const schema = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8").replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = "file:./demo.db"');
fs.writeFileSync(schemaTmp, schema);
try {
  execSync(`npx prisma db push --schema "${schemaTmp}" --skip-generate --accept-data-loss`, { cwd: root, stdio: "pipe" });
} finally {
  fs.rmSync(schemaTmp, { force: true });
}

const { PrismaClient } = await import("@prisma/client");
const sharp = (await import("sharp")).default;
const prisma = new PrismaClient({ datasources: { db: { url: `file:${out}` } } });

const tokenStabile = (seme) => createHash("sha256").update(`vendoly-demo:${seme}`).digest("base64url").slice(0, 24);

let seed = 20261106;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const oggi = new Date();
const giorno = (offset, ora = 0, min = 0) => new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + offset, ora, min, 0, 0);
const nascita = (anni, offsetGiorni) => {
  const t = giorno(offsetGiorni);
  return new Date(Date.UTC(t.getFullYear() - anni, t.getMonth(), t.getDate()));
};

async function main() {
  // ---- Logo di fantasia ----
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><circle cx="200" cy="200" r="190" fill="#0f172a"/><circle cx="200" cy="200" r="165" fill="none" stroke="#10b981" stroke-width="8"/><text x="200" y="235" text-anchor="middle" font-family="Georgia, serif" font-size="120" fill="#10b981">VS</text></svg>`;
  const logoDemo = "data:image/png;base64," + (await sharp(Buffer.from(logoSvg)).png().toBuffer()).toString("base64");

  // ---- Impostazioni locali ----
  await prisma.tenantLocalCache.create({
    data: {
      id: "singleton",
      domain: "vendoly-demo.taaaac.eu",
      licenseStatus: "ATTIVO",
      enabledModules: JSON.stringify(["LOYALTY_CARD", "GIFT_CARDS", "VENDOLY_CHANNEL_MANAGER", "WHATSAPP_REMINDERS"]),
      brandName: "Vendoly Store",
      logoUrl: logoDemo,
      primaryColor: "#0f172a",
      accentColor: "#059669",
      contactEmail: "info@vendoly.taaaac.eu",
      phone: "0575 000400",
      indirizzo: "Corso Italia 21 — Arezzo (AR)",
      fidelityEnabled: true,
      fidelityRules: JSON.stringify({
        enabled: true,
        pointsPerEuro: 1,
        welcomeBonusPoints: 10,
        minPointsToRedeem: 50,
        rewardVoucherMonths: 6,
        compleanno: { enabled: true, tipoValore: "PERCENTUALE", percentuale: 15, giorniAnticipo: 7, validitaGiorni: 30, spesaMinima: 40, inviaEmail: true },
        rewards: [
          { id: "rew_v1", name: "Buono Sconto 5€ sul Prossimo Acquisto", pointsRequired: 50, rewardType: "DISCOUNT", discountAmount: 5 },
          { id: "rew_v2", name: "Buono Sconto 15€ alla Cassa", pointsRequired: 100, rewardType: "DISCOUNT", discountAmount: 15 },
          { id: "rew_v3", name: "Gift Card Negozio 30€ o Capo Omaggio", pointsRequired: 200, rewardType: "FREE_ITEM", freeItemName: "Gift Card da 30€ spendibile in store o capo della selezione" },
        ],
      }),
    },
  });

  // ---- Clienti (numeri finti; alcuni fissi, formati misti, compleanni vicini) ----
  const clienti = [
    ["Laura", "Ferrari", "3201000101", "laura.ferrari@example.com", nascita(34, 2), "M", "40"],
    ["Chiara", "Conti", "3201000102", "chiara.conti@example.com", nascita(29, 6), "S", "38"],
    ["Elisa", "Greco", "3201000103", "elisa.greco@example.com", nascita(41, 12), "M", "39"],
    ["Francesca", "Marino", "3201000104", null, nascita(37, 25), "L", "40"],
    ["Valentina", "Gallo", "3201000106", null, nascita(26, -3), "S", "37"],
    ["Giorgia", "Santoro", "3201000109", "giorgia.santoro@example.com", nascita(31, 40), "M", "38"],
    ["Paola", "Rinaldi", "3201000111", "paola.rinaldi@example.com", nascita(52, 90), "L", "41"],
    ["Sofia", "Ferrara", "3201000113", null, nascita(23, 150), "XS", "36"],
    ["Camilla", "Leone", "3201000116", null, nascita(28, 200), "M", "39"],
    ["Teresa", "Vitale", "3201000120", null, nascita(47, 300), "L", "40"],
    ["Nadia", "Bindi", "3201000130", "nadia.bindi@example.com", nascita(39, 1), "M", "38"],
    ["Marco", "Bianchi", "3331122334", "marco.bianchi@example.com", nascita(44, 33), "L", "43"],
    ["Davide", "Moretti", "3499988776", "d.moretti@example.com", nascita(36, 75), "M", "42"],
    ["Federico", "Galli", "3285544332", "fedegalli@example.com", null, "L", "44"],
    ["Simone", "Fabbri", "3201000107", null, null, "M", "42"],
    ["Andrea", "Costa", "3201000108", "andrea.costa@example.com", nascita(28, 150), "M", "42"],
    ["Riccardo", "Giuliani", "3201000110", null, null, "XL", "45"],
    ["Stefano", "Marchetti", "3201000112", "stefano.m@example.com", nascita(52, 300), "L", "43"],
    ["Maria", "Bartolini", "0575100201", null, nascita(71, 18), "M", "38"],
    ["Rosa", "Cecchi", "0575100202", null, nascita(68, 60), "S", "37"],
    ["Franco", "Lucherini", "0575100203", null, nascita(75, 5), "L", "42"],
    ["Mario", "Pieri", "0575100204", "mario.pieri@example.com", nascita(66, 220), "L", "43"],
    ["Tommaso", "Rossetti", "+39 320 100 0121", "tommaso.r@example.com", nascita(27, 130), "M", "42"],
    ["Filippo", "Conti", "0039 3201000122", null, null, "M", "41"],
    ["Daniele", "Mancini", "320-1000123", "daniele.m@example.com", null, "L", "43"],
    ["Claudio", "Ferri", "3201000124", null, null, "L", "44"],
    ["Alberto", "Rinaldi", "3201000125", "alberto.r@example.com", nascita(38, 33), "M", "42"],
    ["Michele", "Donati", "3201000126", null, null, "M", "41"],
    ["Enrico", "Bellini", "3201000127", "enrico.bellini@example.com", nascita(35, 180), "L", "43"],
    ["Fabio", "Lombardi", "32010", null, null, null, null], // numero incompleto: "Da verificare"
  ];
  const creati = [];
  for (const [firstName, lastName, phone, email, birthDate, clothingSize, shoeSize] of clienti) {
    creati.push(
      await prisma.customer.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          birthDate,
          clothingSize,
          shoeSize,
          preferredBrands: pick(["Nike, Carhartt", "Levi's, Adidas", "Patagonia", null, null]),
          marketingConsent: rnd() > 0.4,
          loyaltyPoints: 0,
          loyaltyToken: tokenStabile(`tessera:${firstName}|${lastName}`),
        },
      })
    );
  }

  // ---- Punti fedelta' sulla spesa (cassa) ----
  for (const c of creati) {
    let tot = 0;
    const acquisti = Math.floor(rnd() * 5);
    for (let i = 0; i < acquisti; i++) {
      const spesa = Math.round((20 + rnd() * 140) * 10) / 10;
      const p = Math.floor(spesa);
      tot += p;
      await prisma.movimentoPunti.create({
        data: {
          clienteId: c.id,
          punti: p,
          tipo: "ACCREDITO",
          origine: "SPESA",
          importo: spesa,
          saldoDopo: tot,
          operatore: "Staff",
          descrizione: `Cassa: spesa ${spesa.toFixed(2)} € (+${p} pt)`,
          createdAt: giorno(-(1 + Math.floor(rnd() * 45)), 17),
        },
      });
    }
    if (tot >= 120 && rnd() > 0.5) {
      await prisma.movimentoPunti.create({
        data: { clienteId: c.id, punti: 50, tipo: "RISCATTO", origine: "PREMIO", premioId: "rew_v1", saldoDopo: tot - 50, operatore: "Staff", descrizione: "Premio: Buono Sconto 5€ sul Prossimo Acquisto", createdAt: giorno(-3) },
      });
      tot -= 50;
    }
    await prisma.customer.update({ where: { id: c.id }, data: { loyaltyPoints: tot } });
  }

  // ---- Buoni di esempio ----
  const buoni = [
    ["BUO-DEMO1-REGAL", "REGALO", "IMPORTO", 50, 50, null, null, 120, null, "Giulia Moretti", "Marco Rossi", "Buon compleanno!", null, true, null, "ATTIVA"],
    ["BUO-DEMO2-REGAL", "REGALO", "IMPORTO", 100, 60, null, null, 90, null, "Paola Rinaldi", "Andrea Ferrara", "Per te, con affetto", null, true, null, "ATTIVA"],
    ["BUO-DEMO3-COMPE", "COMPENSAZIONE", "IMPORTO", 15, 15, null, null, null, 2, "", "", null, null, false, "Spedizione arrivata in ritardo", "ATTIVA"],
    ["BUO-DEMO5-SERVI", "GESTO_COMMERCIALE", "SERVIZIO", 0, 0, null, "Accessorio in omaggio fino a 25 €", 60, 7, "", "", null, null, false, "Cliente fedele da 3 anni", "ATTIVA"],
    ["BUO-DEMO6-PUNTI", "PREMIO_PUNTI", "IMPORTO", 5, 5, null, null, 14, 9, "", "", null, null, false, "Premio punti: Buono Sconto 5€ (50 punti)", "ATTIVA"],
    ["BUO-DEMO7-SCADU", "SCONTO", "PERCENTUALE", 0, 0, 10, null, -10, null, "", "", null, 30, false, "Saldi di ottobre", "ATTIVA"],
    ["BUO-DEMO8-USATO", "REGALO", "IMPORTO", 30, 0, null, null, 200, null, "Anna Neri", "Luca Verdi", null, null, true, null, "RISCATTATA"],
  ];
  for (const [codice, motivo, tipoValore, importo, residuo, percentuale, servizio, giorniScad, idx, acquirente, beneficiario, messaggio, spesaMinima, usoParziale, nota, stato] of buoni) {
    const cl = idx != null ? creati[idx] : null;
    const g = await prisma.giftCard.create({
      data: {
        codice,
        tokenPubblico: tokenStabile(`buono:${codice}`),
        motivo,
        tipoValore,
        importoIniziale: importo,
        saldoResiduo: residuo,
        percentuale,
        descrizioneServizio: servizio,
        clienteId: cl ? cl.id : null,
        spesaMinima,
        usoParziale,
        note: nota,
        acquirenteNome: acquirente,
        beneficiarioNome: beneficiario || (cl ? `${cl.firstName} ${cl.lastName ?? ""}`.trim() : ""),
        beneficiarioMessaggio: messaggio,
        dataScadenza: giorniScad == null ? null : giorno(giorniScad),
        stato,
        creatoDa: "Staff",
      },
    });
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: g.id, tipo: "EMISSIONE", importo, saldoDopo: importo, operatore: "Staff", note: "Emesso", createdAt: giorno(-20) },
    });
    if (tipoValore === "IMPORTO" && residuo < importo) {
      await prisma.movimentoGiftCard.create({
        data: { giftCardId: g.id, tipo: "USO", importo: importo - residuo, saldoDopo: residuo, operatore: "Staff", note: `Sconto di ${(importo - residuo).toFixed(2)} € in cassa`, createdAt: giorno(-8) },
      });
    }
  }

  // ---- Buoni compleanno "automatici" gia' creati per chi compie gli anni nei prossimi 7 giorni ----
  // (nella demo ogni copia del database e' separata: creandoli qui restano uguali ovunque e l'automatismo non crea doppioni)
  for (const c of creati) {
    if (!c.birthDate) continue;
    const inizioOggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
    let comp = new Date(oggi.getFullYear(), c.birthDate.getUTCMonth(), c.birthDate.getUTCDate());
    if (comp < inizioOggi) comp = new Date(oggi.getFullYear() + 1, c.birthDate.getUTCMonth(), c.birthDate.getUTCDate());
    if (comp > new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 7)) continue;
    const codice = `BUO-COMP-${c.firstName.slice(0, 3).toUpperCase()}${comp.getFullYear()}`;
    const g = await prisma.giftCard.create({
      data: {
        codice,
        tokenPubblico: tokenStabile(`buono:${codice}`),
        motivo: "COMPLEANNO",
        tipoValore: "PERCENTUALE",
        importoIniziale: 0,
        saldoResiduo: 0,
        percentuale: 15,
        clienteId: c.id,
        spesaMinima: 40,
        usoParziale: false,
        note: `Buono compleanno ${comp.getFullYear()} (automatico)`,
        acquirenteNome: "Attività",
        beneficiarioNome: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        dataScadenza: new Date(comp.getTime() + 30 * 86400000),
        stato: "ATTIVA",
        creatoDa: "Automatico",
      },
    });
    await prisma.movimentoGiftCard.create({
      data: { giftCardId: g.id, tipo: "EMISSIONE", importo: 0, saldoDopo: 0, operatore: "Automatico", note: "Emesso: Buono compleanno", createdAt: giorno(-1) },
    });
    if (c.email && c.marketingConsent) {
      await prisma.movimentoGiftCard.create({
        data: { giftCardId: g.id, tipo: "INVIO", importo: 0, saldoDopo: 0, operatore: "Automatico", note: `Email simulata (demo) a ${c.email}`, createdAt: giorno(-1) },
      });
    }
  }

  const [nc, nm, nb] = await Promise.all([prisma.customer.count(), prisma.movimentoPunti.count(), prisma.giftCard.count()]);
  console.log(`Demo creata: ${out}`);
  console.log(`Clienti ${nc} | Movimenti punti ${nm} | Buoni ${nb}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
