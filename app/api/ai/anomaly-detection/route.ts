/**
 * API ROUTE: AI ANOMALY DETECTION
 *
 * Detectează cheltuieli neobișnuite sau pattern-uri suspecte.
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureSupabaseUserProfile, getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { detectAnomalies } from "@/lib/ai/claude";
import { isBalanceSnapshotDescription } from "@/lib/transactions/balance-snapshot";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }
    const profile = await ensureSupabaseUserProfile(supabase, user);

    // Obținem tranzacțiile din ultimele 90 de zile
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const dateThreshold = threeMonthsAgo.toISOString().split('T')[0];

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, category_id, description, date")
      .eq("user_id", profile.id)
      .gte("date", dateThreshold);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    const transactions = (transactionsData || []).filter(
      (transaction) => !isBalanceSnapshotDescription(transaction.description)
    );

    if (transactions.length < 10) {
      return NextResponse.json({
        anomalies: [],
        message: "Insufficient data for anomaly detection",
      });
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", profile.id);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categoryMap = new Map((categoriesData || []).map((category) => [category.id, category.name]));

    const recentLimitDate = new Date();
    recentLimitDate.setDate(recentLimitDate.getDate() - 14);

    const expenses = transactions
      .filter((transaction) => Number(transaction.amount) < 0)
      .map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      }));

    const recentExpenses = expenses
      .filter((transaction) => new Date(transaction.date) >= recentLimitDate)
      .map((transaction) => ({
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        category: categoryMap.get(transaction.category_id || "") || "Necategorizat",
        date: transaction.date,
      }));

    const historicalAverage: Record<string, number> = {};
    for (const transaction of expenses) {
      const categoryName = categoryMap.get(transaction.category_id || "") || "Necategorizat";
      historicalAverage[categoryName] = (historicalAverage[categoryName] || 0) + Math.abs(transaction.amount);
    }
    Object.keys(historicalAverage).forEach((key) => {
      historicalAverage[key] = Number((historicalAverage[key] / 3).toFixed(2));
    });

    const anomalies = await detectAnomalies({
      recentTransactions: recentExpenses.slice(0, 100),
      historicalAverage,
      currency: profile.nativeCurrency || "RON",
    });

    return NextResponse.json({
      anomalies: (anomalies || []).slice(0, 5),
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
