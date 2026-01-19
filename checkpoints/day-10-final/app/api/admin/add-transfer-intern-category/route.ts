/**
 * API ROUTE: Add Transfer Intern category to existing users
 *
 * IMPORTANT: This is a ONE-TIME migration endpoint
 * Run it once to add "Transfer Intern" category to all existing users
 *
 * Usage: POST /api/admin/add-transfer-intern-category
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow authenticated users
    // In production, you should add admin role check here
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🚀 Adding 'Transfer Intern' category to all users...\n");

    // STEP 1: Get all users
    const users = await db.select().from(schema.users);
    console.log(`📋 Found ${users.length} users\n`);

    let addedCount = 0;
    let skippedCount = 0;
    const results = [];

    // STEP 2: For each user
    for (const user of users) {
      console.log(`👤 Processing user: ${user.email}`);

      // Check if user already has "Transfer Intern" category
      const existingCategory = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, user.id))
        .then((categories) =>
          categories.find((c) => c.name === "Transfer Intern")
        );

      if (existingCategory) {
        console.log(`   ⏭️  Category already exists, skipping\n`);
        skippedCount++;
        results.push({
          email: user.email,
          status: "skipped",
          reason: "category already exists",
        });
        continue;
      }

      // Add the category
      await db.insert(schema.categories).values({
        userId: user.id,
        name: "Transfer Intern",
        type: "expense", // Technically expense, but should be treated neutral in reports
        color: "#10b981", // Emerald green
        icon: "🔄",
        description: "Transferuri între propriile conturi (nu afectează bugetul total)",
        isSystemCategory: true,
      });

      console.log(`   ✅ Category added successfully\n`);
      addedCount++;
      results.push({
        email: user.email,
        status: "added",
      });
    }

    // STEP 3: Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PROCESS COMPLETED\n");
    console.log(`📊 Statistics:`);
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Categories added: ${addedCount}`);
    console.log(`   - Skipped (already existed): ${skippedCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return NextResponse.json({
      message: "Migration completed successfully",
      totalUsers: users.length,
      categoriesAdded: addedCount,
      skipped: skippedCount,
      results,
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
