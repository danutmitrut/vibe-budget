/**
 * API ROUTE: Create user_keywords table in database
 *
 * IMPORTANT: This is a ONE-TIME migration endpoint
 * Run it once to create the new user_keywords table
 *
 * Usage: POST /api/admin/migrate-user-keywords
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow authenticated users
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🚀 Creating user_keywords table...\n");

    // Create the table using raw SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_keywords (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        keyword TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("✅ Table created successfully");

    // Create index for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON user_keywords(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_keywords_keyword ON user_keywords(keyword);
    `);

    console.log("✅ Indexes created successfully");

    return NextResponse.json({
      message: "Migration completed successfully",
      tableCreated: true,
    });
  } catch (error: any) {
    console.error("❌ ERROR:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
