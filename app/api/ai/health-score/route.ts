/**
 * API ROUTE: AI HEALTH SCORE
 *
 * Calculează un scor de sănătate financiară bazat pe tranzacțiile utilizatorului.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateHealthScore } from "@/lib/ai/claude";
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

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }
    const profile = await ensureUserProfile(supabase, user);

    // Obținem tranzacțiile din ultimele 90 de zile
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const dateThreshold = threeMonthsAgo.toISOString().split('T')[0];

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount, category_id, description")
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
      .select("id, name");

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
