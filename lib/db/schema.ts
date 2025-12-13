/**
 * SCHEMA BAZĂ DE DATE - Vibe Budget (PostgreSQL / Supabase)
 *
 * EXPLICAȚIE: Acesta este "planul" bazei noastre de date.
 * Definim ce tabele avem și ce informații stocăm în fiecare.
 *
 * E ca un formular: fiecare coloană este un câmp de completat.
 */

import { pgTable, text, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
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
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()), // Generează automat un ID unic
  email: text("email").notNull().unique(), // Email-ul trebuie să fie unic
  password: text("password").notNull(), // Parola (criptată cu bcrypt)
  name: text("name").notNull(),
  nativeCurrency: text("native_currency").notNull().default("RON"), // RON sau MDL

  // EMAIL VERIFICATION
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),

  // PASSWORD RESET
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
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
export const banks = pgTable("banks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // Dacă ștergi userul, se șterg și băncile lui
  name: text("name").notNull(),
  color: text("color").default("#6366f1"), // #FF5733 (hex color)
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

/**
 * TABELA 3: CURRENCIES (Valute)
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține valuta
 * - code: Codul valutar (RON, EUR, USD, MDL)
 * - symbol: Simbolul (lei, €, $)
 * - name: Numele complet (Romanian Leu, Euro, etc)
 * - createdAt: Când a fost adăugată
 *
 * EXEMPLU: User adaugă RON (nativă), EUR, USD
 */
export const currencies = pgTable("currencies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // RON, EUR, USD, MDL
  name: text("name").notNull(), // Romanian Leu, Euro, US Dollar
  symbol: text("symbol").notNull(), // lei, €, $
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

/**
 * TABELA 4: CATEGORIES (Categorii)
 *
 * CE STOCĂM:
 * - id: Identificator unic
 * - userId: La cine aparține categoria
 * - name: Numele categoriei (Salariu, Chirie, Mâncare, etc)
 * - type: Tipul (income = venit, expense = cheltuială)
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
export const categories = pgTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("expense"), // "income" | "expense"
  color: text("color").default("#6366f1"),
  icon: text("icon").default("📁"), // Emoji sau nume icon
  description: text("description"), // Explicația categoriei (ex: "Benzină, taxi, metrou, parcări")
  isSystemCategory: boolean("is_system_category").default(false), // false = categorie custom, true = categorie predefinită
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
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
 * - createdAt: Când a fost importată
 *
 * EXEMPLU de tranzacție:
 * {
 *   date: "2025-01-15",
 *   description: "MEGA IMAGE 123",
 *   amount: -45.50,
 *   currency: "RON"
 * }
 */
export const transactions = pgTable("transactions", {
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
  date: timestamp("date").notNull(), // Data tranzacției
  description: text("description").notNull(), // "MEGA IMAGE 123"
  amount: decimal("amount", { precision: 10, scale: 2, mode: 'number' }).notNull(), // -45.50 (negativ = cheltuială, pozitiv = venit)
  currency: text("currency").notNull().default("RON"), // RON, EUR, USD
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
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
