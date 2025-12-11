/**
 * SCRIPT MIGRARE: Adăugare câmp isSystemCategory
 *
 * EXPLICAȚIE:
 * Acest script adaugă coloana `is_system_category` în tabela `categories`.
 * Rulează acest script manual când actualizezi schema bazei de date.
 *
 * RULARE:
 * npx tsx scripts/migrate-add-system-categories.ts
 */

import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "sqlite.db");
const db = new Database(dbPath);

console.log("🔧 Începem migrarea...");

try {
  // Verificăm dacă coloana există deja
  const tableInfo = db.pragma("table_info(categories)");
  const columnExists = tableInfo.some(
    (col: any) => col.name === "is_system_category"
  );

  if (columnExists) {
    console.log("✅ Coloana is_system_category există deja!");
  } else {
    console.log("📝 Adăugăm coloana is_system_category...");

    // Adăugăm coloana (SQLite nu suportă ALTER TABLE cu DEFAULT, trebuie să o adăugăm manual)
    db.exec(`
      ALTER TABLE categories
      ADD COLUMN is_system_category INTEGER NOT NULL DEFAULT 0;
    `);

    console.log("✅ Coloana is_system_category adăugată cu succes!");
  }

  console.log("🎉 Migrare completă!");
} catch (error) {
  console.error("❌ Eroare la migrare:", error);
  process.exit(1);
} finally {
  db.close();
}
