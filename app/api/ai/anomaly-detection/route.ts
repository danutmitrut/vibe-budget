/**
 * API ROUTE: AI ANOMALY DETECTION
 *
 * EXPLICAȚIE:
 * Detectează cheltuieli neobișnuite care ar putea indica fraude,
 * erori de categorizare, sau cheltuieli excesive.
 *
 * FLOW:
 * 1. Colectăm tranzacții recente (ultimele 7 zile)
 * 2. Calculăm media istorică pe categorii (ultimele 3 luni)
 * 3. Trimitem către Claude AI pentru analiză
 * 4. Returnăm anomalii detectate cu severitate și sugestii
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { detectAnomalies } from "@/lib/ai/claude";

/**
 * GET /api/ai/anomaly-detection
 *
 * Headers:
 * - Authorization: Bearer {token}
 *
 * Response:
 * {
 *   "anomalies": [
 *     {
 *       "description": "Cheltuială neobișnuit de mare la restaurant",
 *       "amount": 850,
 *       "category": "Divertisment",
 *       "date": "2024-12-10",
 *       "severity": "high",
 *       "suggestion": "Verifică dacă aceasta e o cheltuială validă"
 *     }
 *   ],
 *   "summary": {
 *     "totalAnomalies": 3,
 *     "highSeverity": 1,
 *     "mediumSeverity": 1,
 *     "lowSeverity": 1
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

    // PASUL 2: Colectăm tranzacții recente (ultimele 3 luni)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, threeMonthsAgo)
        )
      );

    // PASUL 3: Colectăm date istorice (ultimele 12 luni)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const historicalTransactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, twelveMonthsAgo),
          lte(schema.transactions.date, threeMonthsAgo) // Exclude recent pentru calcul medie
        )
      );

    // Verificăm că avem suficiente date
    if (recentTransactions.length === 0) {
      return NextResponse.json({
        anomalies: [],
        summary: {
          totalAnomalies: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0,
          message: "Nu există tranzacții recente pentru analiză.",
        },
      });
    }

    if (historicalTransactions.length < 10) {
      return NextResponse.json({
        anomalies: [],
        summary: {
          totalAnomalies: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0,
          message: "Nu există suficiente date istorice pentru comparație.",
        },
      });
    }

    // PASUL 4: Pregătim categoriile
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    // PASUL 5: Calculăm media istorică pe categorii
    const historicalAverage: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    historicalTransactions.forEach((t) => {
      if (t.amount >= 0) return; // Skip venituri

      const category = categoryMap.get(t.categoryId || "");
      const categoryName = category?.name || "Necategorizat";

      if (!historicalAverage[categoryName]) {
        historicalAverage[categoryName] = 0;
        categoryCounts[categoryName] = 0;
      }

      historicalAverage[categoryName] += Math.abs(t.amount);
      categoryCounts[categoryName] += 1;
    });

    // Calculăm media lunară (împărțim la 3 luni)
    Object.keys(historicalAverage).forEach((cat) => {
      historicalAverage[cat] = historicalAverage[cat] / 3; // Media pe 3 luni
    });

    // PASUL 6: Pregătim recent transactions pentru AI
    const recentData = recentTransactions
      .filter((t) => t.amount < 0) // Doar cheltuieli
      .map((t) => {
        const category = categoryMap.get(t.categoryId || "");
        return {
          description: t.description,
          amount: Math.abs(t.amount),
          category: category?.name || "Necategorizat",
          date: t.date.toISOString().split("T")[0], // YYYY-MM-DD
        };
      });

    // PASUL 7: Apelăm Claude AI
    console.log(`🚨 Detecting anomalies for ${user.email}...`);
    console.log(`Recent transactions: ${recentData.length}`);
    console.log(`Historical averages:`, historicalAverage);

    const anomalies = await detectAnomalies({
      recentTransactions: recentData,
      historicalAverage,
      currency: user.nativeCurrency || "RON",
    });

    // PASUL 8: Calculăm summary
    const summary = {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter((a) => a.severity === "high").length,
      mediumSeverity: anomalies.filter((a) => a.severity === "medium").length,
      lowSeverity: anomalies.filter((a) => a.severity === "low").length,
    };

    console.log(`✅ Detected ${anomalies.length} anomalies`);

    // PASUL 9: Returnăm rezultatele
    return NextResponse.json({
      anomalies,
      summary,
      period: {
        recent: {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date().toISOString(),
        },
        historical: {
          startDate: threeMonthsAgo.toISOString(),
          endDate: sevenDaysAgo.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Anomaly detection error:", error);
    return NextResponse.json(
      { error: "Eroare la detectarea anomaliilor" },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: USE CASES REALE
 *
 * 1. **Fraud Detection**
 *    - Tranzacții neașteptate (ex: 5000 RON la supermarket)
 *    - Cheltuieli în locații străine
 *    - Pattern-uri suspecte
 *
 * 2. **Budget Alerts**
 *    - "Ai cheltuit 2x mai mult la restaurant decât de obicei"
 *    - Real-time notifications
 *
 * 3. **Categorization Errors**
 *    - "Mega Image" categorizat greșit ca "Transport"
 *    - Sugestie de re-categorizare
 *
 * 4. **Smart Insights**
 *    - "De obicei cheltuiești 300 RON/lună la Divertisment"
 *    - "Luna aceasta: 800 RON - verifică dacă totul e OK"
 */
