/**
 * API ROUTE: AI HEALTH SCORE
 *
 * Calculează un scor de sănătate financiară bazat pe tranzacțiile utilizatorului.
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureSupabaseUserProfile, getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { calculateHealthScore } from "@/lib/ai/claude";
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
      .select("amount, category_id, description")
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
        score: 0,
        grade: "N/A",
        message: "Insufficient data",
        breakdown: {
          cashFlow: 0,
          diversification: 0,
          savingsRate: 0,
        },
        strengths: [],
        weaknesses: ["Date insuficiente pentru analiză AI"],
        recommendations: ["Importă cel puțin 10 tranzacții reale"],
        metrics: {
          monthlyIncome: 0,
          monthlyExpenses: 0,
          balance: 0,
          savingsRate: 0,
        },
      });
    }

    // Calculăm venituri și cheltuieli
    let totalIncome = 0;
    let totalExpenses = 0;
    let categorizedCount = 0;
    const expensesByCategory: Record<string, number> = {};

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (!Number.isFinite(amount)) {
        continue;
      }

      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }

      if (t.category_id) {
        categorizedCount++;
        if (amount < 0) {
          expensesByCategory[t.category_id] = (expensesByCategory[t.category_id] || 0) + Math.abs(amount);
        }
      }
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", profile.id);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categoryNameById = new Map((categoriesData || []).map((category) => [category.id, category.name]));

    const categories = Object.entries(expensesByCategory).map(([categoryId, amount]) => ({
      name: categoryNameById.get(categoryId) || "Necategorizat",
      amount: Math.round(amount),
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }));

    const monthlyIncome = totalIncome / 3;
    const monthlyExpenses = totalExpenses / 3;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    const healthScore = await calculateHealthScore({
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      categories,
      currency: profile.nativeCurrency || "RON",
    });

    return NextResponse.json({
      score: healthScore.score,
      grade: healthScore.grade,
      breakdown: healthScore.breakdown,
      strengths: healthScore.strengths,
      weaknesses: healthScore.weaknesses,
      recommendations: healthScore.recommendations,
      metrics: {
        monthlyIncome: Math.round(monthlyIncome),
        monthlyExpenses: Math.round(monthlyExpenses),
        balance: Math.round(monthlyIncome - monthlyExpenses),
        savingsRate: Number(savingsRate.toFixed(1)),
        categorizationRate: Number(((categorizedCount / transactions.length) * 100).toFixed(1)),
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Health score error:", error);
    return NextResponse.json(
      { error: "Eroare la calcularea scorului" },
      { status: 500 }
    );
  }
}
