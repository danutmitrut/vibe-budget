/**
 * API ROUTE: AI BUDGET RECOMMENDATIONS
 *
 * EXPLICAȚIE:
 * Returnează recomandări de economisire generate de Claude AI
 * bazate pe istoricul de cheltuieli al utilizatorului.
 *
 * FLOW:
 * 1. User accesează dashboard
 * 2. Frontend face request GET către acest endpoint
 * 3. Colectăm date despre venit + cheltuieli
 * 4. Trimitem către Claude AI
 * 5. Returnăm recomandări concrete
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBudgetRecommendations } from "@/lib/ai/claude";
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
        .select("id, native_currency")
        .eq("email", user.email)
        .maybeSingle();

      if (existingUserError || !existingUser) {
        throw new Error(existingUserError?.message || "Nu s-a putut valida utilizatorul");
      }

      effectiveUserId = existingUser.id;
      return {
        id: effectiveUserId,
        nativeCurrency: existingUser.native_currency || fallbackCurrency,
      };
    }

    throw new Error(upsertUserError.message);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("native_currency")
    .eq("id", effectiveUserId)
    .maybeSingle();

  return {
    id: effectiveUserId,
    nativeCurrency: profile?.native_currency || fallbackCurrency,
  };
}

/**
 * GET /api/ai/budget-recommendations
 *
 * Headers:
 * - Authorization: Bearer {token}
 *
 * Response:
 * {
 *   "recommendations": [
 *     {
 *       "category": "Divertisment",
 *       "currentSpending": 800,
 *       "suggestedReduction": 200,
 *       "potentialSavings": 2400,
 *       "actionItems": ["acțiune 1", "acțiune 2"]
 *     }
 *   ],
 *   "summary": {
 *     "totalPotentialSavings": 5000,
 *     "monthlyIncome": 3000,
 *     "monthlyExpenses": 2500
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }
    const profile = await ensureUserProfile(supabase, user);

    // PASUL 2: Colectăm date despre ultimele 30 zile
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = twelveMonthsAgo.toISOString().split("T")[0];

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, category_id, description, date")
      .gte("date", startDate);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    const transactions = (transactionsData || []).filter(
      (transaction) => !isBalanceSnapshotDescription(transaction.description)
    );

    if (transactions.length < 10) {
      return NextResponse.json({
        error: "Nu există suficiente date. Importă tranzacții pentru recomandări.",
        recommendations: [],
        summary: {
          totalPotentialSavings: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
        },
      });
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, type");

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }
    const categories = categoriesData || [];

    // Map category IDs to names
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    // Grupăm tranzacțiile pe categorii
    const categoryStats: Record<string, { amount: number; count: number }> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      if (!Number.isFinite(amount)) {
        return;
      }

      const category = categoryMap.get(t.category_id || "");
      const categoryName = category?.name || "Necategorizat";

      // Calculăm total venituri vs cheltuieli
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);

        if (category?.type !== "income") {
          if (!categoryStats[categoryName]) {
            categoryStats[categoryName] = { amount: 0, count: 0 };
          }
          categoryStats[categoryName].amount += Math.abs(amount);
          categoryStats[categoryName].count += 1;
        }
      }
    });

    // Convertim în array pentru AI
    const categoryData = Object.entries(categoryStats)
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount),
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount); // Sortăm descrescător

    // PASUL 4: Apelăm Claude AI
    console.log(`🤖 Generating budget recommendations for ${user.email}...`);

    const averageMonthlyIncome = totalIncome / 12;
    const averageMonthlyExpenses = totalExpenses / 12;

    const recommendations = await generateBudgetRecommendations({
      monthlyIncome: Math.round(averageMonthlyIncome),
      categories: categoryData,
      currency: profile.nativeCurrency || "RON",
    });

    // PASUL 5: Calculăm economii totale potențiale
    const totalPotentialSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    );

    console.log(`✅ Generated ${recommendations.length} recommendations`);

    // PASUL 6: Returnăm rezultatele
    return NextResponse.json({
      recommendations,
      summary: {
        totalPotentialSavings: Math.round(totalPotentialSavings),
        monthlyIncome: Math.round(averageMonthlyIncome),
        monthlyExpenses: Math.round(averageMonthlyExpenses),
        period: {
          startDate: twelveMonthsAgo.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Budget recommendations error:", error);
    return NextResponse.json(
      { error: "Eroare la generarea recomandărilor" },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: OPTIMIZĂRI
 *
 * 1. **Caching** (TODO)
 *    - Cache rezultatele 24h
 *    - Invalidează cache la import nou
 *    - Reduce costuri AI cu 90%
 *
 * 2. **Rate Limiting** (TODO)
 *    - Max 1 request/user/oră
 *    - Sau max 10 requests/user/zi
 *
 * 3. **Minimum Data Threshold**
 *    - Necesită minim 20 tranzacții
 *    - Sau minim 7 zile de date
 *    - Pentru recomandări de calitate
 *
 * 4. **Personalizare**
 *    - Consideră profil user (vârstă, locație)
 *    - Ajustează recomandări după context
 */
