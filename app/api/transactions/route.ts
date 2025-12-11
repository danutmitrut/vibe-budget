/**
 * API ROUTE: TRANSACTIONS (Gestionare tranzacții)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează tranzacțiile utilizatorului.
 * - GET: Listează toate tranzacțiile (cu filtre opționale)
 * - POST: Adaugă tranzacții noi (import din CSV/Excel)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { autoCategorizeByCategoryName } from "@/lib/auto-categorization/categories-rules";

/**
 * GET /api/transactions
 *
 * Query params (opționale):
 * - bankId: Filtrează după bancă
 * - categoryId: Filtrează după categorie
 * - startDate: Data de start (YYYY-MM-DD)
 * - endDate: Data de final (YYYY-MM-DD)
 * - limit: Număr maxim de rezultate (default: 100)
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

    // Extragem parametrii de query
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Construim query-ul cu filtre
    let query = db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, user.id));

    // Adăugăm filtre dacă există
    const conditions = [eq(schema.transactions.userId, user.id)];

    if (bankId) {
      conditions.push(eq(schema.transactions.bankId, bankId));
    }

    if (categoryId) {
      conditions.push(eq(schema.transactions.categoryId, categoryId));
    }

    if (startDate) {
      conditions.push(gte(schema.transactions.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(schema.transactions.date, new Date(endDate)));
    }

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea tranzacțiilor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 *
 * Body:
 * {
 *   "transactions": [
 *     {
 *       "bankId": "bank_123",
 *       "date": "2025-12-01",
 *       "description": "MEGA IMAGE",
 *       "amount": -45.50,
 *       "currency": "RON",
 *       "type": "debit",
 *       "source": "csv"
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactions } = body;

    // Validare
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Format invalid. Trimite un array de tranzacții." },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "Array-ul de tranzacții este gol" },
        { status: 400 }
      );
    }

    // PASUL 1: Obținem categoriile utilizatorului (pentru auto-categorizare)
    const userCategories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    console.log(`📋 Utilizatorul ${user.email} are ${userCategories.length} categorii`);

    // PASUL 2: Pregătim tranzacțiile pentru inserare cu AUTO-CATEGORIZARE
    const transactionsToInsert = transactions.map((t) => {
      // Încercăm să categorizăm automat pe bază de descriere
      const suggestedCategoryName = autoCategorizeByCategoryName(t.description);
      let categoryId: string | null = null;

      if (suggestedCategoryName) {
        // Găsim categoria în lista utilizatorului
        const matchedCategory = userCategories.find(
          (c) => c.name === suggestedCategoryName
        );

        if (matchedCategory) {
          categoryId = matchedCategory.id;
          console.log(`✅ "${t.description}" → ${suggestedCategoryName}`);
        }
      }

      return {
        userId: user.id,
        bankId: t.bankId || null,
        categoryId, // Categorie auto-detectată sau null
        date: new Date(t.date),
        description: t.description,
        amount: parseFloat(t.amount),
        currency: t.currency || user.nativeCurrency,
        type: t.type || (parseFloat(t.amount) < 0 ? "debit" : "credit"),
        source: t.source || "csv",
        originalData: t.originalData ? JSON.stringify(t.originalData) : null,
        isCategorized: categoryId !== null, // true dacă a fost categorizată automat
        notes: t.notes || null,
      };
    });

    // Inserăm în baza de date
    const inserted = await db
      .insert(schema.transactions)
      .values(transactionsToInsert)
      .returning();

    // Calculăm câte au fost categorizate automat
    const autoCategorizedCount = inserted.filter((t) => t.categoryId !== null).length;

    console.log(`✅ ${inserted.length} tranzacții importate (${autoCategorizedCount} categorizate automat)`);

    return NextResponse.json(
      {
        message: `${inserted.length} tranzacții importate cu succes`,
        count: inserted.length,
        autoCategorizedCount, // Nou: câte au fost categorizate automat
        transactions: inserted,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create transactions error:", error);
    return NextResponse.json(
      { error: "Eroare la importul tranzacțiilor" },
      { status: 500 }
    );
  }
}
