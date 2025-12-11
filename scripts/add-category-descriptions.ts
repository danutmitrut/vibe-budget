/**
 * SCRIPT: Adaugă descrieri la categoriile existente
 *
 * SCOP:
 * Pentru utilizatorii existenți care nu au descrieri la categorii,
 * acest script va popula descrierile pe baza numelor categoriilor.
 */

import { db, schema } from "../lib/db";
import { CATEGORY_RULES } from "../lib/auto-categorization/categories-rules";
import { eq } from "drizzle-orm";

async function addCategoryDescriptions() {
  console.log("🔄 Adaugăm descrieri la categoriile existente...\n");

  try {
    // Fetch toate categoriile
    const allCategories = await db.select().from(schema.categories);

    console.log(`📊 Total categorii găsite: ${allCategories.length}`);

    let updatedCount = 0;

    // Iterăm prin toate categoriile
    for (const category of allCategories) {
      // Căutăm descrierea din CATEGORY_RULES pe bază de nume
      const rule = CATEGORY_RULES.find((r) => r.categoryName === category.name);

      if (rule && rule.description && !category.description) {
        // Actualizăm categoria cu descrierea
        await db
          .update(schema.categories)
          .set({ description: rule.description })
          .where(eq(schema.categories.id, category.id));

        console.log(`✅ "${category.name}" → ${rule.description}`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Finalizat! ${updatedCount} categorii actualizate cu descrieri.`);
  } catch (error) {
    console.error("❌ Eroare:", error);
    process.exit(1);
  }
}

// Rulăm scriptul
addCategoryDescriptions()
  .then(() => {
    console.log("\n🎉 Script finalizat cu succes!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Eroare fatală:", error);
    process.exit(1);
  });
