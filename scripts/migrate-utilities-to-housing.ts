/**
 * SCRIPT: Migrează categoria "Utilități" în "Locuință"
 *
 * SCOP:
 * - Găsește toate categoriile "Utilități"
 * - Găsește toate categoriile "Locuință"
 * - Mută toate tranzacțiile din Utilități în Locuință
 * - Șterge categoria Utilități
 */

import { db, schema } from "../lib/db";
import { eq, and } from "drizzle-orm";

async function migrateUtilitiesToHousing() {
  console.log("🔄 Migrăm categoria 'Utilități' în 'Locuință'...\n");

  try {
    // Fetch toate categoriile
    const allCategories = await db.select().from(schema.categories);

    console.log(`📊 Total categorii găsite: ${allCategories.length}\n`);

    // Găsim toate categoriile "Utilități" și "Locuință" pentru fiecare user
    const utilitiesCategories = allCategories.filter((c) => c.name === "Utilități");
    const housingCategories = allCategories.filter((c) => c.name === "Locuință");

    console.log(`🔍 Găsit ${utilitiesCategories.length} categorii "Utilități"`);
    console.log(`🏠 Găsit ${housingCategories.length} categorii "Locuință"\n`);

    if (utilitiesCategories.length === 0) {
      console.log("✅ Nu există categorii 'Utilități' de migrat!");
      return;
    }

    let totalTransactionsMoved = 0;
    let totalCategoriesDeleted = 0;

    // Pentru fiecare user care are "Utilități"
    for (const utilitiesCategory of utilitiesCategories) {
      const userId = utilitiesCategory.userId;

      // Găsim categoria "Locuință" pentru același user
      const housingCategory = housingCategories.find((c) => c.userId === userId);

      if (!housingCategory) {
        console.log(`⚠️  User ${userId} nu are categoria "Locuință" - skip!`);
        continue;
      }

      // Găsim toate tranzacțiile cu categoria "Utilități"
      const transactions = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.userId, userId),
            eq(schema.transactions.categoryId, utilitiesCategory.id)
          )
        );

      console.log(`📦 User ${userId}: ${transactions.length} tranzacții de migrat`);

      // Mutăm toate tranzacțiile în categoria "Locuință"
      if (transactions.length > 0) {
        await db
          .update(schema.transactions)
          .set({ categoryId: housingCategory.id })
          .where(
            and(
              eq(schema.transactions.userId, userId),
              eq(schema.transactions.categoryId, utilitiesCategory.id)
            )
          );

        totalTransactionsMoved += transactions.length;
        console.log(`   ✅ ${transactions.length} tranzacții mutate în "Locuință"`);
      }

      // Ștergem categoria "Utilități"
      await db
        .delete(schema.categories)
        .where(eq(schema.categories.id, utilitiesCategory.id));

      totalCategoriesDeleted++;
      console.log(`   ✅ Categoria "Utilități" ștearsă\n`);
    }

    console.log("=".repeat(60));
    console.log(`✅ Finalizat!`);
    console.log(`   📦 ${totalTransactionsMoved} tranzacții mutate`);
    console.log(`   🗑️  ${totalCategoriesDeleted} categorii "Utilități" șterse`);
  } catch (error) {
    console.error("❌ Eroare:", error);
    process.exit(1);
  }
}

// Rulăm scriptul
migrateUtilitiesToHousing()
  .then(() => {
    console.log("\n🎉 Script finalizat cu succes!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Eroare fatală:", error);
    process.exit(1);
  });
