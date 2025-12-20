/**
 * SCRIPT: Adaugă categoria "Transfer Intern" la toți utilizatorii existenți
 *
 * Rulare: npx tsx scripts/add-transfer-intern-category.ts
 */

import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

async function addTransferInternCategory() {
  console.log("🚀 Adăugăm categoria 'Transfer Intern' la toți utilizatorii...\n");

  try {
    // PASUL 1: Obținem toți utilizatorii
    const users = await db.select().from(schema.users);
    console.log(`📋 Am găsit ${users.length} utilizatori\n`);

    let addedCount = 0;
    let skippedCount = 0;

    // PASUL 2: Pentru fiecare utilizator
    for (const user of users) {
      console.log(`👤 Procesăm utilizatorul: ${user.email}`);

      // Verificăm dacă utilizatorul are deja categoria "Transfer Intern"
      const existingCategory = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, user.id))
        .then((categories) =>
          categories.find((c) => c.name === "Transfer Intern")
        );

      if (existingCategory) {
        console.log(`   ⏭️  Categoria există deja, sărim peste\n`);
        skippedCount++;
        continue;
      }

      // Adăugăm categoria
      await db.insert(schema.categories).values({
        userId: user.id,
        name: "Transfer Intern",
        type: "expense", // Tehnic e expense, dar ar trebui tratat neutral în rapoarte
        color: "#10b981", // Verde emerald
        icon: "🔄",
        description: "Transferuri între propriile conturi (nu afectează bugetul total)",
        isSystemCategory: true,
      });

      console.log(`   ✅ Categorie adăugată cu succes\n`);
      addedCount++;
    }

    // PASUL 3: Rezumat
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PROCES FINALIZAT\n");
    console.log(`📊 Statistici:`);
    console.log(`   - Utilizatori procesați: ${users.length}`);
    console.log(`   - Categorii adăugate: ${addedCount}`);
    console.log(`   - Sărite (existau deja): ${skippedCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ EROARE:", error);
    throw error;
  }
}

// Rulare
addTransferInternCategory()
  .then(() => {
    console.log("👋 Script finalizat cu succes!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script eșuat:", error);
    process.exit(1);
  });
