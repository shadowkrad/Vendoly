const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 1. Assicura che DATABASE_URL non sia vuoto (risolve errore Prisma P1012 su Vercel)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
  process.env.DATABASE_URL = "file:./dev.db";
}

console.log("==> Prisma DATABASE_URL configurato:", process.env.DATABASE_URL);

// 2. Crea il file .env per Prisma se non presente nell'ambiente di build Vercel
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, `DATABASE_URL="${process.env.DATABASE_URL}"\n`);
  console.log("==> Creato file .env con DATABASE_URL di default per Vercel");
}

// 3. Esegui prisma generate
console.log("==> Esecuzione: prisma generate...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

// 4. Esegui prisma db push in modo protetto
console.log("==> Esecuzione: prisma db push --accept-data-loss...");
try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
} catch (err) {
  console.warn("⚠️ Avviso: prisma db push non è riuscito (normale su ambienti serverless Vercel):", err.message);
}

// 5. Esegui next build
console.log("==> Esecuzione: next build...");
execSync("npx next build", { stdio: "inherit", env: process.env });
