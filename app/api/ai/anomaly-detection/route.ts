/**
 * API ROUTE: AI ANOMALY DETECTION
 *
 * Detectează cheltuieli neobișnuite sau pattern-uri suspecte.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    // Obținem tranzacțiile din ultimele 90 de zile
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const dateThreshold = threeMonthsAgo.toISOString().split('T')[0];

    // SHARED MODE: Toate tranzacțiile din ultimele 90 zile
    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(gte(schema.transactions.date, dateThreshold));

    if (transactions.length < 10) {
      return NextResponse.json({
        anomalies: [],
        message: "Insufficient data for anomaly detection",
      });
    }

    const anomalies: Array<{
      description: string;
      severity: "low" | "medium" | "high";
      amount?: number;
      date?: string;
    }> = [];

    // 1. Detectăm cheltuieli mari (>2x media)
    const expenses = transactions.filter(t => t.amount < 0);
    if (expenses.length > 0) {
      const avgExpense = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0) / expenses.length;
      const largeExpenses = expenses.filter(t => Math.abs(t.amount) > avgExpense * 2);

      for (const exp of largeExpenses.slice(0, 3)) {
        const descShort = exp.description.length > 30 ? exp.description.slice(0, 30) + "..." : exp.description;
        anomalies.push({
          description: `Cheltuială mare: ${descShort}`,
          severity: Math.abs(exp.amount) > avgExpense * 3 ? "high" : "medium",
          amount: exp.amount,
          date: exp.date,
        });
      }
    }

    // 2. Detectăm tranzacții necategorizate
    const uncategorized = transactions.filter(t => !t.categoryId);
    if (uncategorized.length > transactions.length * 0.3) {
      anomalies.push({
        description: `${uncategorized.length} tranzacții necategorizate`,
        severity: "low",
      });
    }

    // 3. Detectăm cheltuieli frecvente la aceeași merchant
    const merchantCounts: Record<string, number> = {};
    for (const t of transactions.filter(t => t.amount < 0)) {
      const desc = t.description.slice(0, 20);
      merchantCounts[desc] = (merchantCounts[desc] || 0) + 1;
    }

    const frequentMerchants = Object.entries(merchantCounts)
      .filter(([_, count]) => count > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [merchant, count] of frequentMerchants) {
      anomalies.push({
        description: `${count} tranzacții la ${merchant}...`,
        severity: "low",
      });
    }

    return NextResponse.json({
      anomalies: anomalies.slice(0, 5), // Max 5 anomalii
      totalTransactions: transactions.length,
    });
  } catch (error) {
    console.error("Anomaly detection error:", error);
    return NextResponse.json(
      { error: "Eroare la detectarea anomaliilor" },
      { status: 500 }
    );
  }
}
