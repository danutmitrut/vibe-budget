/**
 * CONEXIUNE LA BAZA DE DATE
 *
 * EXPLICAȚIE:
 * Aici creăm "podul" dintre aplicația noastră și baza de date SQLite.
 * SQLite = o bază de date locală (un fișier pe disk).
 *
 * CONCEPTE:
 * - Database = Fișierul unde sunt stocate datele (vibe-budget.db)
 * - Drizzle = Biblioteca care ne ajută să vorbim cu baza de date
 * - Singleton pattern = Creăm o singură conexiune și o refolosim
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * PASUL 1: Cream fișierul bazei de date
 *
 * Dacă fișierul nu există, better-sqlite3 îl creează automat.
 * Localul: în folderul proiectului va apărea "vibe-budget.db"
 */
const sqlite = new Database("vibe-budget.db");

/**
 * PASUL 2: Conectăm Drizzle la SQLite
 *
 * Drizzle = traducătorul nostru
 * Noi scriem în TypeScript, Drizzle traduce în SQL (limbajul bazei de date)
 */
export const db = drizzle(sqlite, { schema });

/**
 * EXPORT pentru a folosi în toată aplicația
 *
 * UTILIZARE în alte fișiere:
 * import { db } from '@/lib/db';
 * const users = await db.select().from(schema.users);
 */
export { schema };
