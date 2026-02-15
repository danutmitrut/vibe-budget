/**
 * API ROUTE: AI HEALTH SCORE
 *
 * Calculează un scor de sănătate financiară bazat pe tranzacțiile utilizatorului.
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

    if (transactions.length === 0) {
      return NextResponse.json({
        score: 0,
        grade: "N/A",
        message: "Insufficient data",
      });
    }

    // Calculăm venituri și cheltuieli
    let totalIncome = 0;
    let totalExpenses = 0;
    let categorizedCount = 0;

    for (const t of transactions) {
      if (t.amount > 0) {
        totalIncome += t.amount;
      } else {
        totalExpenses += Math.abs(t.amount);
      }
      if (t.categoryId) {
        categorizedCount++;
      }
    }

    // Metrici pentru scor
    const categorizationRate = categorizedCount / transactions.length;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

    // Calculăm scorul (0-10)
    let score = 5; // Bază

    // +2 puncte pentru rate de categorizare bună (>80%)
    if (categorizationRate > 0.8) score += 2;
    else if (categorizationRate > 0.5) score += 1;

    // +3 puncte pentru savings rate pozitiv
    if (savingsRate > 0.2) score += 3;
    else if (savingsRate > 0.1) score += 2;
    else if (savingsRate > 0) score += 1;
    else if (savingsRate < -0.2) score -= 2;

    // Normalizăm la 0-10
    score = Math.max(0, Math.min(10, score));

    // Determinăm grade-ul
    let grade = "F";
    if (score >= 9) grade = "A+";
    else if (score >= 8.5) grade = "A";
    else if (score >= 8) grade = "A-";
    else if (score >= 7.5) grade = "B+";
    else if (score >= 7) grade = "B";
    else if (score >= 6.5) grade = "B-";
    else if (score >= 6) grade = "C+";
    else if (score >= 5.5) grade = "C";
    else if (score >= 5) grade = "C-";
    else if (score >= 4) grade = "D";

    return NextResponse.json({
      score: Math.round(score * 10) / 10,
      grade,
      metrics: {
        totalIncome,
        totalExpenses,
        savingsRate: Math.round(savingsRate * 100),
        categorizationRate: Math.round(categorizationRate * 100),
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
