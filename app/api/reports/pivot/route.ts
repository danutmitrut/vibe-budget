/**
 * API ROUTE: PIVOT TABLE DATA (Raport tabel pivot)
 *
 * EXPLICAȚIE:
 * Endpoint care returnează date pentru tabelul pivot:
 * - Rânduri: Categorii
 * - Coloane: Luni (ultimele 12 luni)
 * - Valori: Sume totale pe categorie + lună
 *
 * Returnează și calcule pentru:
 * - Top creșteri/scăderi lunare pe categorie
 * - Medii lunare
 * - Tendințe
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and, gte, sql } from "drizzle-orm";

interface PivotCell {
  amount: number;
  count: number;
  change?: number; // % change față de luna precedentă
}

interface PivotRow {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  months: Record<string, PivotCell>; // key: "2025-12"
  total: number;
  average: number;
  topMonth: { month: string; amount: number };
  bottomMonth: { month: string; amount: number };
  maxIncrease: { month: string; change: number };
  maxDecrease: { month: string; change: number };
}

/**
 * GET /api/reports/pivot?months=12
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthsCount = parseInt(searchParams.get("months") || "12", 10);

    // Calculăm data de început (ex: acum - 12 luni)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);
    startDate.setDate(1); // Prima zi a lunii
    startDate.setHours(0, 0, 0, 0);

    // Fetch toate tranzacțiile din ultimele N luni
    const transactions = await db
      .select({
        id: schema.transactions.id,
        categoryId: schema.transactions.categoryId,
        amount: schema.transactions.amount,
        date: schema.transactions.date,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, startDate)
        )
      );

    // Fetch categorii
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    // Creăm un map pentru lookup rapid
    const categoryMap = new Map(
      categories.map((cat) => [
        cat.id,
        {
          name: cat.name,
          icon: cat.icon || "📋",
          color: cat.color || "#6b7280",
        },
      ])
    );

    // Generăm lista de luni (format "YYYY-MM")
    const monthsList: string[] = [];
    for (let i = 0; i < monthsCount; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthsCount - 1 - i));
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsList.push(month);
    }

    // Grupăm tranzacțiile pe categorie + lună
    const pivotData = new Map<string, PivotRow>();

    // Inițializăm structura pentru fiecare categorie
    categories.forEach((cat) => {
      const months: Record<string, PivotCell> = {};
      monthsList.forEach((month) => {
        months[month] = { amount: 0, count: 0 };
      });

      pivotData.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon || "📋",
        categoryColor: cat.color || "#6b7280",
        months,
        total: 0,
        average: 0,
        topMonth: { month: "", amount: 0 },
        bottomMonth: { month: "", amount: Infinity },
        maxIncrease: { month: "", change: 0 },
        maxDecrease: { month: "", change: 0 },
      });
    });

    // Populăm datele din tranzacții
    transactions.forEach((tx) => {
      if (!tx.categoryId) return; // Skip necategorizate

      const txDate = new Date(tx.date);
      const month = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;

      const row = pivotData.get(tx.categoryId);
      if (!row || !row.months[month]) return;

      // Adunăm sumele (în valoare absolută pentru cheltuieli)
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      const absAmount = Math.abs(amount);
      row.months[month].amount += absAmount;
      row.months[month].count += 1;
      row.total += absAmount;
    });

    // Calculăm statistici pentru fiecare categorie
    pivotData.forEach((row) => {
      // Medie lunară
      row.average = row.total / monthsCount;

      // Top & Bottom lunare
      let maxAmount = 0;
      let minAmount = Infinity;
      let maxMonth = "";
      let minMonth = "";

      Object.entries(row.months).forEach(([month, cell]) => {
        if (cell.amount > maxAmount) {
          maxAmount = cell.amount;
          maxMonth = month;
        }
        if (cell.amount < minAmount && cell.amount > 0) {
          minAmount = cell.amount;
          minMonth = month;
        }
      });

      row.topMonth = { month: maxMonth, amount: maxAmount };
      row.bottomMonth = { month: minMonth, amount: minAmount === Infinity ? 0 : minAmount };

      // Calculăm schimbările procentuale între luni consecutive
      let prevAmount: number | null = null;
      let maxIncrease = 0;
      let maxIncreaseMonth = "";
      let maxDecrease = 0;
      let maxDecreaseMonth = "";

      monthsList.forEach((month) => {
        const currentAmount = row.months[month].amount;

        if (prevAmount !== null && prevAmount > 0) {
          const change = ((currentAmount - prevAmount) / prevAmount) * 100;
          row.months[month].change = change;

          if (change > maxIncrease) {
            maxIncrease = change;
            maxIncreaseMonth = month;
          }
          if (change < maxDecrease) {
            maxDecrease = change;
            maxDecreaseMonth = month;
          }
        }

        prevAmount = currentAmount;
      });

      row.maxIncrease = { month: maxIncreaseMonth, change: maxIncrease };
      row.maxDecrease = { month: maxDecreaseMonth, change: maxDecrease };
    });

    // Convertim Map în Array și sortăm după total descrescător
    const pivotArray = Array.from(pivotData.values()).sort(
      (a, b) => b.total - a.total
    );

    return NextResponse.json({
      months: monthsList,
      data: pivotArray,
      currency: user.nativeCurrency || "RON",
    });
  } catch (error) {
    console.error("Pivot report error:", error);
    return NextResponse.json(
      { error: "Eroare la generarea raportului pivot" },
      { status: 500 }
    );
  }
}
