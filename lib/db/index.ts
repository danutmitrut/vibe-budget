/**
 * CONEXIUNE LA BAZA DE DATE - SUPABASE PostgreSQL
 *
 * EXPLICAȚIE:
 * Aici creăm "podul" dintre aplicația noastră și baza de date Supabase.
 * Supabase = PostgreSQL în cloud (pentru production).
 *
 * CONCEPTE:
 * - Database = PostgreSQL (mai puternic decât SQLite)
 * - Drizzle = Biblioteca care ne ajută să vorbim cu baza de date
 * - Connection string = URL-ul către baza de date Supabase
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * PASUL 1: Creăm conexiunea la Supabase PostgreSQL
 *
 * Connection string format:
 * postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const connectionString = process.env.DATABASE_URL;

/**
 * PASUL 2: Configurăm client-ul PostgreSQL
 *
 * prepare: false - necesar pentru Supabase connection pooler
 * max: 1 - pentru environment serverless (Vercel)
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Important pentru Vercel serverless
});

/**
 * PASUL 3: Conectăm Drizzle la PostgreSQL
 *
 * Drizzle = traducătorul nostru
 * Noi scriem în TypeScript, Drizzle traduce în SQL (limbajul bazei de date)
 */
export const db = drizzle(client, { schema });

/**
 * EXPORT pentru a folosi în toată aplicația
 *
 * UTILIZARE în alte fișiere:
 * import { db } from '@/lib/db';
 * const users = await db.select().from(schema.users);
 */
export { schema };
