/**
 * SCRIPT: Create Test User with Sample Data
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "..", "local.db");
const db = new Database(dbPath);

console.log("👤 Creăm utilizator de test...\n");

const userId = createId();
const email = "test@vibe-budget.com";
const password = "password123";
const name = "Test User";

// Hash password
const passwordHash = bcrypt.hashSync(password, 10);

try {
  // Insert user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, native_currency)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, email, passwordHash, name, "RON");

  console.log(`✅ User creat:`);
  console.log(`   Email: ${email}`);
  console.log(`   Parolă: ${password}`);
  console.log(`   ID: ${userId}\n`);

  // Create sample banks
  const banks = [
    { id: createId(), name: "ING", color: "#FF6200" },
    { id: createId(), name: "BRD", color: "#FFD200" },
    { id: createId(), name: "BCR", color: "#0066CC" },
  ];

  for (const bank of banks) {
    db.prepare(`
      INSERT INTO banks (id, user_id, name, color)
      VALUES (?, ?, ?, ?)
    `).run(bank.id, userId, bank.name, bank.color);
  }

  console.log(`🏦 Bănci create: ${banks.length}`);

  // Create sample categories
  const categories = [
    { id: createId(), name: "Salariu", icon: "💰", color: "#10b981", isSystem: 1 },
    { id: createId(), name: "Chirie/Casă", icon: "🏠", color: "#ef4444", isSystem: 1 },
    { id: createId(), name: "Utilități", icon: "⚡", color: "#f59e0b", isSystem: 1 },
    { id: createId(), name: "Mâncare & Băuturi", icon: "🍔", color: "#84cc16", isSystem: 1 },
    { id: createId(), name: "Restaurant & Cafea", icon: "☕", color: "#a855f7", isSystem: 1 },
    { id: createId(), name: "Transport", icon: "🚗", color: "#06b6d4", isSystem: 1 },
    { id: createId(), name: "Shopping", icon: "🛍️", color: "#ec4899", isSystem: 1 },
    { id: createId(), name: "Divertisment", icon: "🎬", color: "#8b5cf6", isSystem: 1 },
    { id: createId(), name: "Sănătate", icon: "💊", color: "#14b8a6", isSystem: 1 },
    { id: createId(), name: "Educație", icon: "📚", color: "#3b82f6", isSystem: 1 },
    { id: createId(), name: "Economii", icon: "💎", color: "#10b981", isSystem: 1 },
    { id: createId(), name: "Altele", icon: "📦", color: "#6b7280", isSystem: 1 },
  ];

  for (const cat of categories) {
    db.prepare(`
      INSERT INTO categories (id, user_id, name, icon, color, is_system_category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(cat.id, userId, cat.name, cat.icon, cat.color, cat.isSystem);
  }

  console.log(`📁 Categorii create: ${categories.length}\n`);

  console.log(`🎉 Setup complet! Acum poți rula:`);
  console.log(`   npx tsx scripts/generate-december-2025-transactions.ts\n`);

} catch (error: any) {
  if (error.code === 'SQLITE_CONSTRAINT') {
    console.log(`⚠️  Utilizatorul ${email} există deja!`);
    console.log(`   Parolă: password123\n`);
  } else {
    console.error(`❌ Eroare: ${error.message}`);
  }
}

db.close();
