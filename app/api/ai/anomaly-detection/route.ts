/**
 * API ROUTE: AI ANOMALY DETECTION
 *
 * Detectează cheltuieli neobișnuite sau pattern-uri suspecte.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectAnomalies } from "@/lib/ai/claude";
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
      .select("amount, category_id, description, date")
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
      .select("id, name");

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
