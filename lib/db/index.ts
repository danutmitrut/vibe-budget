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
 * Connection string format (Transaction Pooler - IPv4 compatible):
 * postgresql://postgres.[project-ref]:[password]@aws-X-region.pooler.supabase.com:6543/postgres
 *
 * IMPORTANT:
 * - Folosim Transaction Pooler (NU Direct Connection) pentru compatibilitate IPv4 cu Vercel
 * - Port 6543 (pooler) în loc de 5432 (direct)
 * - Host: aws-X-region.pooler.supabase.com (NU db.*.supabase.co)
 */
const connectionString = process.env.DATABASE_URL!;

/**
 * PASUL 2: Configurăm client-ul PostgreSQL
 *
 * prepare: false - necesar pentru Supabase connection pooler
 * max: 1 - pentru environment serverless (Vercel)
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Important pentru Vercel serverless
  ssl: { rejectUnauthorized: false }, // Necesar pentru Supabase
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
