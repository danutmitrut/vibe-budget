/**
 * MIGRATION SCRIPT: Adaugă câmpuri pentru email verification
 *
 * EXPLICAȚIE:
 * Actualizăm toți utilizatorii existenți să aibă emailVerified = true
 * (presupunem că utilizatorii existenți sunt deja verificați)
 */

import { db, schema } from "../lib/db";
import { sql } from "drizzle-orm";

async function migrateEmailVerification() {
  console.log("🔄 Starting email verification fields migration...");

  try {
    // Add columns (SQLite doesn't support ADD COLUMN IF NOT EXISTS nicely)
    // We'll use ALTER TABLE
    await db.run(sql`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
    await db.run(sql`ALTER TABLE users ADD COLUMN verification_token TEXT`);
    await db.run(sql`ALTER TABLE users ADD COLUMN reset_token TEXT`);
    await db.run(sql`ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER`);

    console.log("✅ Columns added successfully");

    // Mark all existing users as verified
    await db.run(sql`UPDATE users SET email_verified = 1 WHERE email_verified = 0`);

    console.log("✅ All existing users marked as verified");
    console.log("🎉 Migration completed successfully!");

  } catch (error: any) {
    if (error.message.includes("duplicate column name")) {
      console.log("⚠️  Columns already exist, skipping ALTER TABLE");
      // Mark all existing users as verified anyway
      await db.run(sql`UPDATE users SET email_verified = 1 WHERE email_verified = 0`);
      console.log("✅ All existing users marked as verified");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }
}

migrateEmailVerification()
  .then(() => {
    console.log("✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });
