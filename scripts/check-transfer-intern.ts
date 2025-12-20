/**
 * Check if Transfer Intern category exists for users
 */
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

async function checkTransferIntern() {
  try {
    // Get all users
    const users = await db.select().from(schema.users);
    console.log(`📋 Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.email}`);

      // Check categories
      const categories = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, user.id));

      const hasTransferIntern = categories.some(c => c.name === "Transfer Intern");

      console.log(`   Categories: ${categories.length}`);
      console.log(`   Has "Transfer Intern": ${hasTransferIntern ? "✅ YES" : "❌ NO"}`);

      if (hasTransferIntern) {
        const cat = categories.find(c => c.name === "Transfer Intern");
        console.log(`   - ID: ${cat?.id}`);
        console.log(`   - Icon: ${cat?.icon}`);
        console.log(`   - Color: ${cat?.color}`);
      }

      console.log("");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkTransferIntern();
