/**
 * SCRIPT: Add December 2025 transactions to existing user
 *
 * Rulează: npx tsx scripts/add-december-to-existing-user.ts your@email.com
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createId } from "@paralleldrive/cuid2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "..", "local.db");
const db = new Database(dbPath);

const userEmail = process.argv[2];

if (!userEmail) {
  console.log("❌ Specifică email-ul utilizatorului!");
  console.log("   Exemplu: npx tsx scripts/add-december-to-existing-user.ts your@email.com");
  process.exit(1);
}

const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(userEmail) as any;

if (!user) {
  console.log(`❌ Nu există utilizator cu email-ul: ${userEmail}`);
  console.log("\n📋 Utilizatori disponibili:");
  const users = db.prepare("SELECT email FROM users").all() as any[];
  users.forEach(u => console.log(`   - ${u.email}`));
  process.exit(1);
}

console.log(`✅ Adăugăm tranzacții pentru: ${user.email}\n`);

const categories = db.prepare("SELECT id, name FROM categories WHERE user_id = ?").all(user.id) as any[];
const banks = db.prepare("SELECT id FROM banks WHERE user_id = ? LIMIT 1").get(user.id) as any;

if (!banks) {
  console.log("❌ Nu există bănci pentru acest user. Creează una mai întâi!");
  process.exit(1);
}

const categoryMap = new Map(categories.map(c => [c.name, c.id]));
const defaultCategory = categories[0]?.id;

const transactions = [
  { description: "Salariu decembrie", amount: 8500, date: "2025-12-01", categoryName: "Salariu" },
  { description: "Bonus Crăciun", amount: 2000, date: "2025-12-05", categoryName: "Salariu" },
  { description: "Chirie", amount: -2500, date: "2025-12-01", categoryName: "Chirie/Casă" },
  { description: "Energie electrică", amount: -350, date: "2025-12-02", categoryName: "Utilități" },
  { description: "Kaufland", amount: -420, date: "2025-12-02", categoryName: "Mâncare & Băuturi" },
  { description: "Restaurant", amount: -180, date: "2025-12-06", categoryName: "Restaurant & Cafea" },
  { description: "Benzină", amount: -280, date: "2025-12-02", categoryName: "Transport" },
  { description: "Cadouri Crăciun", amount: -770, date: "2025-12-05", categoryName: "Shopping" },
  { description: "Netflix", amount: -45, date: "2025-12-01", categoryName: "Divertisment" },
  { description: "Economii", amount: -1500, date: "2025-12-05", categoryName: "Economii" },
];

const insertStmt = db.prepare(`
  INSERT INTO transactions (id, user_id, bank_id, category_id, date, description, amount, currency)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;

for (const tx of transactions) {
  const categoryId = categoryMap.get(tx.categoryName) || defaultCategory;
  try {
    insertStmt.run(
      createId(),
      user.id,
      banks.id,
      categoryId,
      tx.date,
      tx.description,
      tx.amount,
      'RON'
    );
    inserted++;
    console.log(`✅ ${tx.date} | ${tx.description}`);
  } catch (err) {}
}

console.log(`\n🎉 Adăugate ${inserted} tranzacții!`);
db.close();
