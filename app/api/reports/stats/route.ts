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
import { ensureDefaultSystemCategories } from "@/lib/categories/default-system-categories";
import { isBalanceSnapshotDescription } from "@/lib/transactions/balance-snapshot";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }
    const profile = await ensureSupabaseUserProfile(supabase, user);
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

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, amount, category_id, bank_id, date, description")
      .eq("user_id", profile.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }
    const transactions = (transactionsData || []).filter(
      (transaction) => !isBalanceSnapshotDescription(transaction.description)
    );

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, color, icon, type")
      .eq("user_id", profile.id);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }
    const categories = categoriesData || [];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const { data: banksData, error: banksError } = await supabase
      .from("banks")
      .select("id, name, color")
      .eq("user_id", profile.id);

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
