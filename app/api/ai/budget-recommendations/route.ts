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
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { generateBudgetRecommendations } from "@/lib/ai/claude";

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
    // PASUL 1: Verificăm autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    // PASUL 2: Colectăm date despre ultimele 30 zile
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // SHARED MODE: Toate tranzacțiile din ultimele 12 luni
    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(gte(schema.transactions.date, twelveMonthsAgo.toISOString().split("T")[0]));

    if (transactions.length === 0) {
      return NextResponse.json({
        error: "Nu există suficiente date. Importă tranzacții pentru recomandări.",
        recommendations: [],
      });
    }

    // PASUL 3: SHARED MODE - Obținem toate categoriile
    const categories = await db
      .select()
      .from(schema.categories);

    // Map category IDs to names
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    // Grupăm tranzacțiile pe categorii
    const categoryStats: Record<string, { amount: number; count: number }> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      const category = categoryMap.get(t.categoryId || "");
      const categoryName = category?.name || "Necategorizat";

      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { amount: 0, count: 0 };
      }

      categoryStats[categoryName].amount += Math.abs(amount);
      categoryStats[categoryName].count += 1;

      // Calculăm total venituri vs cheltuieli
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    });

    // Convertim în array pentru AI
    const categoryData = Object.entries(categoryStats)
      .filter(([name]) => name !== "Venituri") // Excludem veniturile din analiză
      .map(([name, data]) => ({
        name,
        amount: Math.round(data.amount),
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount); // Sortăm descrescător

    // PASUL 4: Apelăm Claude AI
    console.log(`🤖 Generating budget recommendations for ${user.email}...`);

    const recommendations = await generateBudgetRecommendations({
      monthlyIncome: Math.round(totalIncome),
      categories: categoryData,
      currency: user.nativeCurrency || "RON",
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
        monthlyIncome: Math.round(totalIncome),
        monthlyExpenses: Math.round(totalExpenses),
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
