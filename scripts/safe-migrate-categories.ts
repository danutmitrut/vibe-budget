/**
 * SCRIPT MIGRARE SIGURĂ: Adăugare is_system_category fără pierdere date
 *
 * Pași:
 * 1. Salvăm categoriile existente
 * 2. Recreăm tabela cu noua coloană
 * 3. Restaurăm categoriile (toate vor fi custom = false inițial)
 */

import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "sqlite.db");
const db = new Database(dbPath);

console.log("🔧 Începem migrarea sigură...");

try {
  // Verificăm dacă există tabela categories
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    )
    .all();

  if (tables.length === 0) {
    console.log("⚠️  Tabela categories nu există. Folosește npm run db:push");
    process.exit(0);
  }

  // Verificăm dacă coloana există deja
  const tableInfo: any[] = db.pragma("table_info(categories)") as any;
  const columnExists = tableInfo.some(
    (col: any) => col.name === "is_system_category"
  );

  if (columnExists) {
    console.log("✅ Coloana is_system_category există deja!");
    process.exit(0);
  }

  // 1. Salvăm categoriile existente
  console.log("📦 Salvăm categoriile existente...");
  const existingCategories = db
    .prepare("SELECT * FROM categories")
    .all() as any[];

  console.log(`   Găsite ${existingCategories.length} categorii`);

  // 2. Adăugăm coloana nouă cu valoare default
  console.log("📝 Adăugăm coloana is_system_category...");
  db.exec(`
    ALTER TABLE categories
    ADD COLUMN is_system_category INTEGER DEFAULT 0;
  `);

  console.log("✅ Migrare completă!");
  console.log(
    `   Toate cele ${existingCategories.length} categorii au fost păstrate (is_system_category = 0)`
  );
} catch (error: any) {
  console.error("❌ Eroare la migrare:", error.message);
  process.exit(1);
} finally {
  db.close();
}
