/**
 * SCRIPT: Generate December 2025 Test Transactions
 *
 * Generează tranzacții de test pentru decembrie 2025 pentru a testa AI Insights
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "..", "local.db");
const db = new Database(dbPath);

console.log("🎄 Generăm tranzacții pentru decembrie 2025...\n");

// Obținem primul user din DB
const user = db.prepare("SELECT id, email FROM users LIMIT 1").get() as any;

if (!user) {
  console.log("❌ Nu există utilizatori în DB. Loghează-te mai întâi!");
  process.exit(1);
}

console.log(`👤 User: ${user.email} (${user.id})\n`);

// Obținem categoriile
const categories = db.prepare("SELECT id, name FROM categories WHERE user_id = ?").all(user.id) as any[];
const banks = db.prepare("SELECT id, name FROM banks WHERE user_id = ?").all(user.id) as any[];

console.log(`📁 Categorii: ${categories.length}`);
console.log(`🏦 Bănci: ${banks.length}\n`);

if (categories.length === 0 || banks.length === 0) {
  console.log("❌ Nu există categorii sau bănci. Creează-le mai întâi!");
  process.exit(1);
}

// Helper pentru generare date în decembrie 2025
function randomDate(start: number, end: number): string {
  const date = new Date(2025, 11, Math.floor(Math.random() * (end - start + 1)) + start);
  return date.toISOString().split('T')[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Tranzacții tipice pentru decembrie 2025
const transactions = [
  // VENITURI (1-5 decembrie)
  { description: "Salariu decembrie", amount: 8500, date: "2025-12-01", categoryName: "Salariu", isIncome: true },
  { description: "Bonus de Crăciun", amount: 2000, date: "2025-12-05", categoryName: "Salariu", isIncome: true },

  // CHELTUIELI RECURENTE
  { description: "Chirie decembrie", amount: -2500, date: "2025-12-01", categoryName: "Chirie/Casă" },
  { description: "Factură energie electrică", amount: -350, date: "2025-12-02", categoryName: "Utilități" },
  { description: "Factură gaz", amount: -280, date: "2025-12-02", categoryName: "Utilități" },
  { description: "Internet Digi", amount: -50, date: "2025-12-03", categoryName: "Utilități" },
  { description: "Telefon Orange", amount: -60, date: "2025-12-03", categoryName: "Utilități" },

  // MÂNCARE & BĂUTURI
  { description: "Kaufland - cumpărături săptămânale", amount: -420, date: "2025-12-02", categoryName: "Mâncare & Băuturi" },
  { description: "Carrefour", amount: -280, date: "2025-12-04", categoryName: "Mâncare & Băuturi" },
  { description: "Piață fructe și legume", amount: -85, date: "2025-12-05", categoryName: "Mâncare & Băuturi" },
  { description: "Lidl - cumpărături", amount: -195, date: "2025-12-06", categoryName: "Mâncare & Băuturi" },
  { description: "Mega Image", amount: -120, date: "2025-12-08", categoryName: "Mâncare & Băuturi" },
  { description: "Kaufland", amount: -380, date: "2025-12-09", categoryName: "Mâncare & Băuturi" },

  // RESTAURANT & CAFEA
  { description: "Starbucks", amount: -42, date: "2025-12-03", categoryName: "Restaurant & Cafea" },
  { description: "Cină restaurant", amount: -180, date: "2025-12-06", categoryName: "Restaurant & Cafea" },
  { description: "Ted's Coffee", amount: -25, date: "2025-12-07", categoryName: "Restaurant & Cafea" },
  { description: "Dejun cu colegii", amount: -95, date: "2025-12-09", categoryName: "Restaurant & Cafea" },
  { description: "McDonald's", amount: -48, date: "2025-12-10", categoryName: "Restaurant & Cafea" },

  // TRANSPORT
  { description: "Benzină OMV", amount: -280, date: "2025-12-02", categoryName: "Transport" },
  { description: "RCA asigurare auto", amount: -450, date: "2025-12-04", categoryName: "Transport" },
  { description: "Benzină Petrom", amount: -240, date: "2025-12-08", categoryName: "Transport" },
  { description: "Uber", amount: -35, date: "2025-12-09", categoryName: "Transport" },
  { description: "Parcare mall", amount: -15, date: "2025-12-10", categoryName: "Transport" },

  // SHOPPING & CADOURI CRĂCIUN
  { description: "Cadou Crăciun mama", amount: -350, date: "2025-12-05", categoryName: "Shopping" },
  { description: "Cadou Crăciun tata", amount: -420, date: "2025-12-05", categoryName: "Shopping" },
  { description: "Decorațiuni Crăciun", amount: -180, date: "2025-12-06", categoryName: "Shopping" },
  { description: "Zara - haine noi", amount: -280, date: "2025-12-07", categoryName: "Shopping" },
  { description: "Cadouri colegi", amount: -250, date: "2025-12-08", categoryName: "Shopping" },
  { description: "H&M", amount: -150, date: "2025-12-09", categoryName: "Shopping" },

  // DIVERTISMENT
  { description: "Netflix abonament", amount: -45, date: "2025-12-01", categoryName: "Divertisment" },
  { description: "Spotify Premium", amount: -25, date: "2025-12-01", categoryName: "Divertisment" },
  { description: "Cinema bilete", amount: -85, date: "2025-12-07", categoryName: "Divertisment" },
  { description: "Party Crăciun companie", amount: -120, date: "2025-12-10", categoryName: "Divertisment" },

  // SĂNĂTATE
  { description: "Farmacie - medicamente", amount: -95, date: "2025-12-04", categoryName: "Sănătate" },
  { description: "Dentist - control", amount: -250, date: "2025-12-06", categoryName: "Sănătate" },

  // EDUCAȚIE & DEZVOLTARE
  { description: "Curs online Udemy", amount: -180, date: "2025-12-03", categoryName: "Educație" },
  { description: "Cărți Amazon", amount: -120, date: "2025-12-08", categoryName: "Educație" },

  // ECONOMII
  { description: "Transfer la economii", amount: -1500, date: "2025-12-05", categoryName: "Economii" },

  // ALTELE (ultimele zile)
  { description: "Colete de Crăciun", amount: -85, date: "2025-12-11", categoryName: "Altele" },
  { description: "Donație caritate", amount: -100, date: "2025-12-11", categoryName: "Altele" },
  { description: "Cadou secret santa", amount: -75, date: "2025-12-12", categoryName: "Altele" },
];

// Mapăm categoriile
const categoryMap = new Map(categories.map(c => [c.name, c.id]));
const defaultCategory = categories[0].id;
const defaultBank = banks[0].id;

// Inserăm tranzacțiile
const insertStmt = db.prepare(`
  INSERT INTO transactions
  (user_id, bank_id, category_id, date, description, amount, currency, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

let inserted = 0;
let skipped = 0;

for (const tx of transactions) {
  const categoryId = categoryMap.get(tx.categoryName) || defaultCategory;
  const amount = tx.amount;

  try {
    insertStmt.run(
      user.id,
      defaultBank,
      categoryId,
      tx.date,
      tx.description,
      amount,
      'RON'
    );
    inserted++;
    console.log(`✅ ${tx.date} | ${tx.description.padEnd(35)} | ${amount > 0 ? '+' : ''}${amount} RON`);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      skipped++;
    } else {
      console.error(`❌ Eroare: ${error.message}`);
    }
  }
}

console.log(`\n📊 REZULTATE:`);
console.log(`   ✅ Inserate: ${inserted}`);
console.log(`   ⏭️  Omise (duplicate): ${skipped}`);
console.log(`   📈 Total încercat: ${transactions.length}`);

// Afișăm statistici
const stats = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as venituri,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as cheltuieli,
    SUM(amount) as balanta
  FROM transactions
  WHERE user_id = ? AND date >= '2025-12-01' AND date <= '2025-12-31'
`).get(user.id) as any;

console.log(`\n💰 STATISTICI DECEMBRIE 2025:`);
console.log(`   🔢 Total tranzacții: ${stats.total}`);
console.log(`   💚 Venituri: +${Math.round(stats.venituri)} RON`);
console.log(`   💸 Cheltuieli: -${Math.round(stats.cheltuieli)} RON`);
console.log(`   📊 Balanță: ${stats.balanta > 0 ? '+' : ''}${Math.round(stats.balanta)} RON`);

db.close();

console.log(`\n🎉 Gata! Acum poți testa AI Insights cu date din decembrie 2025!`);
console.log(`   👉 Mergi la: http://localhost:3000/dashboard/ai-insights\n`);
