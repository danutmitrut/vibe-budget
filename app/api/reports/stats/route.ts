/**
 * API ROUTE: REPORTS/STATS (Statistici generale)
 *
 * EXPLICAȚIE:
 * Returnează statistici agregate despre tranzacții:
 * - Total venituri/cheltuieli
 * - Breakdown pe categorii
 * - Breakdown pe bănci
 * - Tranzacții necategorizate
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 * GET /api/reports/stats
 *
 * Query params:
 * - startDate: Data de start (YYYY-MM-DD)
 * - endDate: Data de final (YYYY-MM-DD)
 * - period: "month" sau "year" (default: current month)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }
    const profile = await ensureUserProfile(supabase, user);
    await ensureDefaultSystemCategories(supabase, profile.id);

    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "month";

    // Dacă nu sunt specificate datele, folosim luna curentă
    if (!startDate || !endDate) {
      const now = new Date();
      if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      } else {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];
      }
    }

    // SHARED MODE: Toate tranzacțiile din interval
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, amount, category_id, bank_id, date, description")
      .gte("date", startDate)
      .lte("date", endDate);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }
    const transactions = (transactionsData || []).filter(
      (transaction) => !isBalanceSnapshotDescription(transaction.description)
    );

    // SHARED MODE: Toate categoriile pentru lookup
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, color, icon, type");

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }
    const categories = categoriesData || [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // SHARED MODE: Toate băncile pentru lookup
    const { data: banksData, error: banksError } = await supabase
      .from("banks")
      .select("id, name, color");

    if (banksError) {
      throw new Error(banksError.message);
    }
    const banks = banksData || [];

    const bankMap = new Map(banks.map((b) => [b.id, b]));

    // Calculăm statistici
    let totalIncome = 0;
    let totalExpenses = 0;
    let uncategorizedCount = 0;

    const byCategory: Record<string, { name: string; amount: number; count: number; color: string; icon: string; type: string }> = {};
    const byBank: Record<string, { name: string; amount: number; count: number; color: string }> = {};

    transactions.forEach((t) => {
      const amount = Number(t.amount);

      // Total income/expenses
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }

      // Uncategorized
      if (!t.category_id) {
        uncategorizedCount++;
      }

      // By category
      if (t.category_id) {
        const category = categoryMap.get(t.category_id);
        if (category) {
          if (!byCategory[category.id]) {
            byCategory[category.id] = {
              name: category.name,
              amount: 0,
              count: 0,
              color: category.color || "#6366f1",
              icon: category.icon || "📁",
              type: category.type,
            };
          }
          byCategory[category.id].amount += Math.abs(amount);
          byCategory[category.id].count++;
        }
      }

      // By bank
      if (t.bank_id) {
        const bank = bankMap.get(t.bank_id);
        if (bank) {
          if (!byBank[bank.id]) {
            byBank[bank.id] = {
              name: bank.name,
              amount: 0,
              count: 0,
              color: bank.color || "#6366f1",
            };
          }
          byBank[bank.id].amount += Math.abs(amount);
          byBank[bank.id].count++;
        }
      }
    });

    // Convertim în array-uri sortate
    const categoriesArray = Object.values(byCategory).sort((a, b) => b.amount - a.amount);
    const banksArray = Object.values(byBank).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      period: {
        startDate,
        endDate,
        type: period,
      },
      summary: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        uncategorizedCount,
      },
      byCategory: categoriesArray,
      byBank: banksArray,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Eroare la calcularea statisticilor" },
      { status: 500 }
    );
  }
}
