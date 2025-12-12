/**
 * API ROUTE: AI FINANCIAL HEALTH SCORE
 *
 * EXPLICAȚIE:
 * Calculează un scor de sănătate financiară (0-10) cu grade (A+, A, B, C, D, F)
 * bazat pe cash flow, diversificare cheltuieli, și rată de economisire.
 *
 * GAMIFICATION: Motivează utilizatorii să îmbunătățească scorul!
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { calculateHealthScore } from "@/lib/ai/claude";

/**
 * GET /api/ai/health-score
 *
 * Headers:
 * - Authorization: Bearer {token}
 *
 * Response:
 * {
 *   "score": 7.5,
 *   "grade": "B+",
 *   "breakdown": {
 *     "cashFlow": 8.0,
 *     "diversification": 7.0,
 *     "savingsRate": 7.5
 *   },
 *   "strengths": ["Balanță pozitivă", "Economii regulate"],
 *   "weaknesses": ["Cheltuieli ridicate la Divertisment"],
 *   "recommendations": ["Reduce cheltuielile la restaurant cu 15%"],
 *   "comparison": {
 *     "avgScore": 6.5,
 *     "percentile": 75
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

    // PASUL 2: Colectăm date despre ultimele 12 luni (sau toate dacă sunt mai puține)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, twelveMonthsAgo)
        )
      );

    if (transactions.length < 10) {
      return NextResponse.json({
        error: "Nu există suficiente date. Necesare minim 10 tranzacții pentru calcul.",
        score: null,
      });
    }

    // PASUL 3: Calculăm venituri și cheltuieli
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    });

    // PASUL 4: Grupăm pe categorii
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    const categoryStats: Record<string, number> = {};
    transactions
      .filter((t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return amount < 0; // Doar cheltuieli
      })
      .forEach((t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        const category = categoryMap.get(t.categoryId || "");
        const categoryName = category?.name || "Necategorizat";

        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = 0;
        }

        categoryStats[categoryName] += Math.abs(amount);
      });

    // Convertim în array cu procentaje
    const categoryData = Object.entries(categoryStats)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount),
        percentage: (amount / totalExpenses) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    // PASUL 5: Apelăm Claude AI pentru calcul scor
    console.log(`💪 Calculating health score for ${user.email}...`);
    console.log(`Income: ${totalIncome}, Expenses: ${totalExpenses}`);

    const healthScore = await calculateHealthScore({
      monthlyIncome: Math.round(totalIncome),
      monthlyExpenses: Math.round(totalExpenses),
      categories: categoryData,
      currency: user.nativeCurrency || "RON",
    });

    console.log(`✅ Health score: ${healthScore.score}/10 (${healthScore.grade})`);

    // PASUL 6: Adăugăm metrici suplimentare
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const metrics = {
      monthlyIncome: Math.round(totalIncome),
      monthlyExpenses: Math.round(totalExpenses),
      balance: Math.round(balance),
      savingsRate: Math.round(savingsRate * 10) / 10, // 1 decimal
      transactionCount: transactions.length,
    };

    // PASUL 7: Returnăm rezultatele
    return NextResponse.json({
      ...healthScore,
      metrics,
      period: {
        startDate: twelveMonthsAgo.toISOString(),
        endDate: new Date().toISOString(),
        days: 365,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Health score calculation error:", error);
    return NextResponse.json(
      { error: "Eroare la calcularea scorului de sănătate financiară" },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: GAMIFICATION STRATEGIES
 *
 * 1. **Progress Tracking**
 *    - Salvează scorul lunar în DB
 *    - Afișează grafic de evoluție
 *    - "Ai crescut cu 1.2 puncte luna aceasta!"
 *
 * 2. **Achievements/Badges**
 *    - "First Positive Balance" (prima lună cu economii)
 *    - "Budget Master" (scor >8 pentru 3 luni consecutive)
 *    - "Saver" (rata economisire >20%)
 *
 * 3. **Leaderboard** (opțional, anonimizat)
 *    - Compară scorul cu media utilizatorilor
 *    - "Ești în top 25%!"
 *    - Motivează îmbunătățiri
 *
 * 4. **Challenges**
 *    - "Crește scorul cu 0.5 puncte luna aceasta"
 *    - Rewards: badge-uri, unlock features
 *
 * 5. **Social Sharing**
 *    - Share achievements pe social media
 *    - "Am atins scor de 8.5/10 la sănătate financiară!"
 *
 * 6. **AI Coach**
 *    - Sfaturi personalizate săptămânale
 *    - "Pentru a crește scorul, încearcă să..."
 */
