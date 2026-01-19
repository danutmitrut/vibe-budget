/**
 * SCRIPT: Re-categorizează toate tranzacțiile existente bazat pe regulile curente
 *
 * IMPORTANT: Acest script re-procesează TOATE tranzacțiile din baza de date
 * folosind regulile actualizate de auto-categorizare.
 *
 * Use case:
 * - După ce am adăugat/modificat reguli în categories-rules.ts
 * - Când vrem să aplicăm retroactiv noile reguli la tranzacțiile existente
 *
 * Rulare: npx tsx scripts/recategorize-transactions.ts
 */

import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { autoCategorizeByCategoryName } from "../lib/auto-categorization/categories-rules";

async function recategorizeTransactions() {
  console.log("🔄 Re-categorizare tranzacții existente...\n");

  try {
    // PASUL 1: Obținem toate tranzacțiile
    const allTransactions = await db.select().from(schema.transactions);
    console.log(`📋 Am găsit ${allTransactions.length} tranzacții în total\n`);

    let recategorizedCount = 0;
    let unchangedCount = 0;
    let skippedCount = 0;

    // PASUL 2: Pentru fiecare tranzacție
    for (const transaction of allTransactions) {
      // Verificăm dacă tranzacția are deja o categorie asignată manual
      // (dacă a fost modificată manual, nu o suprascriem)
      // IMPORTANT: Acest script re-categorizează TOATE tranzacțiile
      // Dacă vrei să păstrezi categoriile manuale, modifică această logică

      const description = transaction.description || "";

      if (!description) {
        console.log(`⏭️  Sărim tranzacția ${transaction.id} - lipsă descriere`);
        skippedCount++;
        continue;
      }

      // Rulăm auto-categorizarea
      const suggestedCategoryName = autoCategorizeByCategoryName(description);

      if (!suggestedCategoryName) {
        // Nu am găsit o categorie potrivită
        if (transaction.categoryId) {
          console.log(`   ⚠️  ${transaction.description} - rămâne cu categoria existentă (nu am găsit match)`);
          unchangedCount++;
        } else {
          console.log(`   ⏭️  ${transaction.description} - necategorizată (nu am găsit match)`);
          skippedCount++;
        }
        continue;
      }

      // Găsim categoria în baza de date pentru acest user
      const categoryMatch = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, transaction.userId))
        .then((categories) =>
          categories.find((c) => c.name === suggestedCategoryName)
        );

      if (!categoryMatch) {
        console.log(`   ⚠️  ${transaction.description} - categorie '${suggestedCategoryName}' nu există pentru user`);
        unchangedCount++;
        continue;
      }

      // Verificăm dacă categoria s-a schimbat
      if (transaction.categoryId === categoryMatch.id) {
        // Categoria e deja corectă
        unchangedCount++;
        continue;
      }

      // UPDATE: Actualizăm categoria
      await db
        .update(schema.transactions)
        .set({ categoryId: categoryMatch.id })
        .where(eq(schema.transactions.id, transaction.id));

      console.log(`   ✅ ${transaction.description.substring(0, 50)} → ${categoryMatch.icon} ${categoryMatch.name}`);
      recategorizedCount++;
    }

    // PASUL 3: Rezumat
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PROCES FINALIZAT\n");
    console.log(`📊 Statistici:`);
    console.log(`   - Total tranzacții: ${allTransactions.length}`);
    console.log(`   - Re-categorizate: ${recategorizedCount}`);
    console.log(`   - Neschimbate: ${unchangedCount}`);
    console.log(`   - Sărite (lipsă descriere): ${skippedCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ EROARE:", error);
    throw error;
  }
}

// Rulare
recategorizeTransactions()
  .then(() => {
    console.log("👋 Script finalizat cu succes!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script eșuat:", error);
    process.exit(1);
  });
