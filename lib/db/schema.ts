/**
 * SCHEMA BAZĂ DE DATE - Vibe Budget
 *
 * EXPLICAȚIE: Acesta este "planul" bazei noastre de date.
 * Definim ce tabele avem și ce informații stocăm în fiecare.
 *
 * E ca un formular: fiecare coloană este un câmp de completat.
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * TABELA 1: USERS (Utilizatori)
 *
 * CE STOCĂM:
 * - id: Identificator unic (ca un CNP digital)
 * - email: Adresa de email (pentru login)
 * - password: Parola criptată (nimeni nu o vede în clar)
 * - name: Numele utilizatorului
 * - nativeCurrency: Moneda nativă (RON sau MDL)
 * - createdAt: Când s-a înregistrat
 */
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()), // Generează automat un ID unic
  email: text("email").notNull().unique(), // Email-ul trebuie să fie unic
  password: text("password").notNull(), // Parola (criptată cu bcrypt)
  name: text("name").notNull(),
  nativeCurrency: text("native_currency").notNull().default("RON"), // RON sau MDL

  // EMAIL VERIFICATION
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  verificationToken: text("verification_token"),

  // PASSWORD RESET
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * TABELA 2: BANKS (Bănci)
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține banca (legătura cu tabela users)
 * - name: Numele băncii (ING, BCR, Revolut, etc)
 * - color: Culoare pentru identificare vizuală (opțional)
 * - createdAt: Când a fost adăugată
 *
 * EXEMPLU: User Dan adaugă "ING Bank" și "Revolut"
 */
export const banks = sqliteTable("banks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Dacă ștergi userul, se șterg și băncile lui
  name: text("name").notNull(),
  color: text("color"), // #FF5733 (hex color)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * TABELA 3: CURRENCIES (Valute)
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține valuta
 * - code: Codul valutar (RON, EUR, USD, MDL)
 * - symbol: Simbolul (lei, €, $)
 * - isNative: Dacă e moneda nativă (true/false)
 * - createdAt: Când a fost adăugată
 *
 * EXEMPLU: User adaugă RON (nativă), EUR, USD
 */
export const currencies = sqliteTable("currencies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // RON, EUR, USD, MDL
  symbol: text("symbol").notNull(), // lei, €, $
  isNative: integer("is_native", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * TABELA 4: CATEGORIES (Categorii)
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține categoria
 * - name: Numele categoriei (Salariu, Chirie, Mâncare, etc)
 * - type: Tipul (income = venit, expense = cheltuială, savings = economii)
 * - color: Culoare pentru grafice
 * - icon: Emoji sau nume de icon (opțional)
 * - isSystemCategory: Dacă e categorie predefinită (nu se poate șterge)
 * - createdAt: Când a fost creată
 *
 * EXEMPLE:
 * - Salariu (income) 💰 [SYSTEM]
 * - Chirie (expense) 🏠 [SYSTEM]
 * - Mâncare (expense) 🍔 [SYSTEM]
 * - Economii (savings) 🐷 [CUSTOM]
 */
export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "income" | "expense" | "savings"
  color: text("color"),
  icon: text("icon"), // Emoji sau nume icon
  description: text("description"), // Explicația categoriei (ex: "Benzină, taxi, metrou, parcări")
  isSystemCategory: integer("is_system_category", { mode: "boolean" }).default(
    false
  ), // false = categorie custom, true = categorie predefinită (NOT NULL implicit)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * TABELA 5: TRANSACTIONS (Tranzacții)
 *
 * CEA MAI IMPORTANTĂ TABELĂ - aici se stochează toate tranzacțiile din extrasele bancare
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține tranzacția
 * - bankId: Din ce bancă vine (nullable - poate fi PayPal, cash, etc)
 * - categoryId: În ce categorie e (nullable - la început e null, user o categorizează)
 * - date: Data tranzacției (din extras bancar)
 * - description: Descrierea (ce scrie în extrasul bancar)
 * - amount: Suma (cât s-a plătit sau încasat)
 * - currency: Valuta (RON, EUR, USD, etc)
 * - type: Tipul (debit = cheltuială, credit = venit)
 * - source: De unde vine (csv, excel, pdf, manual)
 * - originalData: Datele originale din fișier (JSON) - păstrăm pentru referință
 * - isCategorized: Dacă a fost categorizată de user (true/false)
 * - aiSuggestion: Sugestia AI pentru categorie (opțional)
 * - createdAt: Când a fost importată
 *
 * EXEMPLU de tranzacție:
 * {
 *   date: "2025-01-15",
 *   description: "MEGA IMAGE 123",
 *   amount: -45.50,
 *   currency: "RON",
 *   type: "debit",
 *   categoryId: null (încă nu e categorizată)
 * }
 */
export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankId: text("bank_id").references(() => banks.id, { onDelete: "set null" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  date: integer("date", { mode: "timestamp" }).notNull(), // Data tranzacției
  description: text("description").notNull(), // "MEGA IMAGE 123"
  amount: real("amount").notNull(), // -45.50 (negativ = cheltuială, pozitiv = venit)
  currency: text("currency").notNull().default("RON"), // RON, EUR, USD
  type: text("type").notNull(), // "debit" sau "credit"
  source: text("source").notNull().default("csv"), // csv, excel, pdf, manual
  originalData: text("original_data"), // JSON cu datele originale din fișier
  isCategorized: integer("is_categorized", { mode: "boolean" })
    .notNull()
    .default(false),
  aiSuggestion: text("ai_suggestion"), // Categoria sugerată de AI (JSON)
  notes: text("notes"), // Note adăugate de user
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * TIPURI TYPESCRIPT
 *
 * Acestea ne ajută să folosim datele în cod cu autocompletare.
 * TypeScript verifică automat că nu facem greșeli.
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Bank = typeof banks.$inferSelect;
export type NewBank = typeof banks.$inferInsert;

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
