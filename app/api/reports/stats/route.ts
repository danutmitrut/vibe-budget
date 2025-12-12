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
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and, gte, lte, sql } from "drizzle-orm";

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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

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

    // Obținem toate tranzacțiile din interval
    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, new Date(startDate)),
          lte(schema.transactions.date, new Date(endDate))
        )
      );

    // Obținem categoriile pentru lookup
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Obținem băncile pentru lookup
    const banks = await db
      .select()
      .from(schema.banks)
      .where(eq(schema.banks.userId, user.id));

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
      if (!t.categoryId) {
        uncategorizedCount++;
      }

      // By category
      if (t.categoryId) {
        const category = categoryMap.get(t.categoryId);
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
      if (t.bankId) {
        const bank = bankMap.get(t.bankId);
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
