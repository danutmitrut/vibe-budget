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
import { createClient } from "@/lib/supabase/server";
import { autoCategorizeByCategoryName } from "@/lib/auto-categorization/categories-rules";
import { ensureDefaultSystemCategories } from "@/lib/categories/default-system-categories";
import { isBalanceSnapshotDescription } from "@/lib/transactions/balance-snapshot";

async function getAuthUser(request: NextRequest) {
  const supabase = await createClient();
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  let user = null;

  if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
    const bearerResult = await supabase.auth.getUser(bearerToken);
    user = bearerResult.data.user;
  }

  if (!user) {
    const cookieResult = await supabase.auth.getUser();
    user = cookieResult.data.user;
  }

  return { supabase, user };
}

async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const fallbackName =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Utilizator";
  const fallbackCurrency =
    (user.user_metadata?.native_currency as string | undefined) || "RON";

  let effectiveUserId = user.id;

  const { error: upsertUserError } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email || `${user.id}@placeholder.local`,
        name: fallbackName,
        native_currency: fallbackCurrency,
      },
      { onConflict: "id" }
    );

  if (upsertUserError) {
    if (upsertUserError.message.includes("users_email_key") && user.email) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (existingUserError || !existingUser) {
        throw new Error(existingUserError?.message || "Nu s-a putut valida utilizatorul");
      }

      effectiveUserId = existingUser.id;
    } else {
      throw new Error(upsertUserError.message);
    }
  }

  return { id: effectiveUserId };
}

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
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureUserProfile(supabase, user);
    await ensureDefaultSystemCategories(supabase, profile.id);

    // PASUL 1: SHARED MODE - Obținem toate tranzacțiile NECATEGORIZATE
    const { data: uncategorizedTransactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, description")
      .is("category_id", null);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    const pendingTransactions = (uncategorizedTransactions || []).filter(
      (transaction) => !isBalanceSnapshotDescription(transaction.description)
    );
    console.log(`🔄 Re-categorizare: ${pendingTransactions.length} tranzacții necategorizate găsite pentru ${user.email}`);

    if (pendingTransactions.length === 0) {
      return NextResponse.json({
        message: "Nu există tranzacții necategorizate",
        total: 0,
        recategorized: 0,
        unchanged: 0,
      });
    }

    // PASUL 2: SHARED MODE - Obținem toate categoriile
    const { data: userCategories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, icon");

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categories = userCategories || [];

    const { data: userKeywords, error: keywordsError } = await supabase
      .from("user_keywords")
      .select("keyword, category_id")
      .eq("user_id", profile.id);

    if (keywordsError) {
      throw new Error(keywordsError.message);
    }

    const keywords = userKeywords || [];

    console.log(`📋 Utilizatorul ${user.email} are ${categories.length} categorii`);

    // PASUL 3: Re-categorizăm fiecare tranzacție
    // IMPORTANT: Verificăm mai întâi keyword-uri personalizate, apoi reguli globale
    let recategorizedCount = 0;
    let unchangedCount = 0;

    for (const transaction of pendingTransactions) {
      const description = transaction.description || "";

      if (!description) {
        unchangedCount++;
        continue;
      }

      let categoryIdToAssign: string | null = null;

      // PRIORITATE 1: Verificăm keyword-uri personalizate ale utilizatorului
      const lowerDescription = description.toLowerCase();
      const keywordMatch = keywords.find((keyword) =>
        lowerDescription.includes(keyword.keyword.toLowerCase())
      );

      if (keywordMatch) {
        categoryIdToAssign = keywordMatch.category_id;
      }

      // PRIORITATE 2: Dacă nu am găsit keyword personalizat, folosim regulile globale
      if (!categoryIdToAssign) {
        const suggestedCategoryName = autoCategorizeByCategoryName(description);

        if (suggestedCategoryName) {
          // Găsim categoria în baza de date pentru acest user
          const categoryMatch = categories.find(
            (c) => c.name === suggestedCategoryName
          );

          if (categoryMatch) {
            categoryIdToAssign = categoryMatch.id;
          } else {
            console.log(`⚠️  Categoria '${suggestedCategoryName}' nu există pentru ${user.email}`);
          }
        }
      }

      // Dacă nu am găsit nicio categorie, sărim peste
      if (!categoryIdToAssign) {
        unchangedCount++;
        continue;
      }

      // UPDATE: Actualizăm categoria
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ category_id: categoryIdToAssign })
        .eq("id", transaction.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Găsim categoria pentru log
      const assignedCategory = categories.find((c) => c.id === categoryIdToAssign);
      console.log(`✅ "${description.substring(0, 40)}" → ${assignedCategory?.icon} ${assignedCategory?.name}`);
      recategorizedCount++;
    }

    console.log(`✅ Re-categorizare finalizată: ${recategorizedCount}/${pendingTransactions.length} tranzacții categorizate`);

    return NextResponse.json({
      message: "Re-categorizare finalizată cu succes",
      total: pendingTransactions.length,
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
