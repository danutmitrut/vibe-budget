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
 */
// Connection string with IPv4-compatible Transaction Pooler for Vercel
let connectionString = process.env.DATABASE_URL ||
  "postgresql://postgres.yctmwqwrwoeqdavqjnko:Rasalgethi2025.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

// FIX: Vercel bug - missing //postgres after postgresql:
// Expected: postgresql://postgres:password@host
// Received: postgresql:password@host (WRONG!)
console.log(`🔍 [BUILD v3] Checking connection string...`);
console.log(`🔍 [BUILD v3] Starts with "postgresql:": ${connectionString.startsWith("postgresql:")}`);
console.log(`🔍 [BUILD v3] Starts with "postgresql://": ${connectionString.startsWith("postgresql://")}`);

if (connectionString.startsWith("postgresql:") && !connectionString.startsWith("postgresql://")) {
  console.error("⚠️ [BUILD v3] VERCEL BUG DETECTED - Malformed DATABASE_URL");
  console.error("Received:", connectionString.substring(0, 30) + "...");

  // Fix: postgresql:password@host -> postgresql://postgres:password@host
  connectionString = connectionString.replace("postgresql:", "postgresql://postgres:");
  console.log("✅ [BUILD v3] AUTO-FIXED CONNECTION STRING");
}

// DEBUG: Log connection string (hide password)
// Match only password part: postgresql://postgres:PASSWORD@host -> postgresql://postgres:****@host
const debugConnStr = connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
console.log(`🔍 [BUILD v4] DB Connection String: ${debugConnStr}`);
console.log(`🔍 [BUILD v4] Original env var: ${process.env.DATABASE_URL?.substring(0, 35)}...`);

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
