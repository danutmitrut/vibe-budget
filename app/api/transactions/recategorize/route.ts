/**
 * API ROUTE: RE-CATEGORIZARE TRANZACȚII
 *
 * EXPLICAȚIE:
 * Acest endpoint re-procesează toate tranzacțiile NECATEGORIZATE
 * și le categorizează bazat pe regulile actuale.
 *
 * Use case:
 * - După ce am adăugat/modificat reguli în categories-rules.ts
 * - Când vrem să aplicăm retroactiv noile reguli la tranzacțiile existente
 *
 * IMPORTANT: Re-categorizează DOAR tranzacțiile necategorizate (categoryId === null)
 * pentru a nu suprascrie categoriile asignate manual de utilizator.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and, isNull } from "drizzle-orm";
import { autoCategorizeByCategoryName } from "@/lib/auto-categorization/categories-rules";

/**
 * POST /api/transactions/recategorize
 *
 * Body: {} (gol - procesează toate tranzacțiile necategorizate)
 *
 * Response:
 * {
 *   "message": "Re-categorizare finalizată",
 *   "total": 100,
 *   "recategorized": 85,
 *   "unchanged": 15
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    // PASUL 1: Obținem toate tranzacțiile NECATEGORIZATE ale utilizatorului
    const uncategorizedTransactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          isNull(schema.transactions.categoryId)
        )
      );

    console.log(`🔄 Re-categorizare: ${uncategorizedTransactions.length} tranzacții necategorizate găsite pentru ${user.email}`);

    if (uncategorizedTransactions.length === 0) {
      return NextResponse.json({
        message: "Nu există tranzacții necategorizate",
        total: 0,
        recategorized: 0,
        unchanged: 0,
      });
    }

    // PASUL 2: Obținem categoriile utilizatorului
    const userCategories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    console.log(`📋 Utilizatorul ${user.email} are ${userCategories.length} categorii`);

    // PASUL 3: Re-categorizăm fiecare tranzacție
    let recategorizedCount = 0;
    let unchangedCount = 0;

    for (const transaction of uncategorizedTransactions) {
      const description = transaction.description || "";

      if (!description) {
        unchangedCount++;
        continue;
      }

      // Rulăm auto-categorizarea
      const suggestedCategoryName = autoCategorizeByCategoryName(description);

      if (!suggestedCategoryName) {
        // Nu am găsit o categorie potrivită
        unchangedCount++;
        continue;
      }

      // Găsim categoria în baza de date pentru acest user
      const categoryMatch = userCategories.find(
        (c) => c.name === suggestedCategoryName
      );

      if (!categoryMatch) {
        console.log(`⚠️  Categoria '${suggestedCategoryName}' nu există pentru ${user.email}`);
        unchangedCount++;
        continue;
      }

      // UPDATE: Actualizăm categoria
      await db
        .update(schema.transactions)
        .set({ categoryId: categoryMatch.id })
        .where(eq(schema.transactions.id, transaction.id));

      console.log(`✅ "${description.substring(0, 40)}" → ${categoryMatch.icon} ${categoryMatch.name}`);
      recategorizedCount++;
    }

    console.log(`✅ Re-categorizare finalizată: ${recategorizedCount}/${uncategorizedTransactions.length} tranzacții categorizate`);

    return NextResponse.json({
      message: "Re-categorizare finalizată cu succes",
      total: uncategorizedTransactions.length,
      recategorized: recategorizedCount,
      unchanged: unchangedCount,
    });
  } catch (error) {
    console.error("Recategorize transactions error:", error);
    return NextResponse.json(
      { error: "Eroare la re-categorizarea tranzacțiilor" },
      { status: 500 }
    );
  }
}
