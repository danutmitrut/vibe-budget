/**
 * API ROUTE: TRANSACTIONS (Gestionare tranzacții)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează tranzacțiile utilizatorului.
 * - GET: Listează toate tranzacțiile (cu filtre opționale)
 * - POST: Adaugă tranzacții noi (import din CSV/Excel)
 */

import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { autoCategorizeByCategoryName } from "@/lib/auto-categorization/categories-rules";
import { ensureDefaultSystemCategories } from "@/lib/categories/default-system-categories";
import { isBalanceSnapshotDescription } from "@/lib/transactions/balance-snapshot";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";
import { normalizeTransactionRecord } from "@/lib/api/normalizers";

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }
    const profile = await ensureSupabaseUserProfile(supabase, user);

    // Extragem parametrii de query
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", profile.id)
      .order("date", { ascending: false })
      .limit(limit);

    if (bankId) {
      query = query.eq("bank_id", bankId);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: transactionsData, error: transactionsError } = await query;

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    const transactions = (transactionsData || [])
      .filter(
        (transaction) =>
          !isBalanceSnapshotDescription(String(transaction.description || ""))
      )
      .map((transaction) => normalizeTransactionRecord(transaction));

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);
    await ensureDefaultSystemCategories(supabase, profile.id);

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

    const filteredTransactions = transactions.filter(
      (transaction) => !isBalanceSnapshotDescription(String(transaction.description || ""))
    );

    if (filteredTransactions.length === 0) {
      return NextResponse.json(
        { error: "Fișierul conține doar linii de sold (sold inițial/final), fără tranzacții reale." },
        { status: 400 }
      );
    }

    // PASUL 1: Obținem categoriile utilizatorului
    const { data: userCategories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", profile.id);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    console.log(
      `📋 Utilizatorul ${user.email} are ${(userCategories || []).length} categorii`
    );

    const uniqueBankIds = Array.from(
      new Set(
        filteredTransactions
          .map((transaction) => transaction.bankId)
          .filter((bankId): bankId is string => typeof bankId === "string" && bankId.length > 0)
      )
    );

    if (uniqueBankIds.length > 0) {
      const { data: userBanks, error: banksError } = await supabase
        .from("banks")
        .select("id")
        .eq("user_id", profile.id)
        .in("id", uniqueBankIds);

      if (banksError) {
        throw new Error(banksError.message);
      }

      const ownedBankIds = new Set((userBanks || []).map((bank) => bank.id));
      const invalidBankId = uniqueBankIds.find((bankId) => !ownedBankIds.has(bankId));

      if (invalidBankId) {
        return NextResponse.json(
          { error: "Banca selectată nu aparține utilizatorului curent." },
          { status: 400 }
        );
      }
    }

    // PASUL 2: Pregătim tranzacțiile pentru inserare cu AUTO-CATEGORIZARE (reguli globale)
    const transactionsToInsert = filteredTransactions.map((t, index) => {
        // DEBUG: Log first 3 transactions
        if (index < 3) {
          console.log(`[API] Transaction ${index}:`, {
            date_received: t.date,
            date_type: typeof t.date,
            date_asDate: new Date(t.date).toISOString(),
            description: t.description.substring(0, 30),
            amount: t.amount,
          });
        }

        let categoryId: string | null = null;
        const suggestedCategoryName = autoCategorizeByCategoryName(String(t.description || ""));

        if (suggestedCategoryName) {
          const matchedCategory = (userCategories || []).find(
            (c) => c.name === suggestedCategoryName
          );

          if (matchedCategory) {
            categoryId = matchedCategory.id;
            console.log(`✅ Global rule: "${t.description}" → ${suggestedCategoryName}`);
          }
        }

        const parsedAmount = Number(t.amount);
        if (!Number.isFinite(parsedAmount)) {
          throw new Error(`Sumă invalidă la tranzacția "${t.description}"`);
        }

        return {
          id: createId(),
          user_id: profile.id,
          bank_id: t.bankId || null,
          category_id: categoryId,
          date: t.date, // Keep as string (YYYY-MM-DD format)
          description: t.description,
          amount: parsedAmount,
          currency: t.currency || profile.nativeCurrency,
        };
      });

    // Inserăm în baza de date
    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select("*");

    if (insertError || !inserted) {
      throw new Error(insertError?.message || "Nu s-au putut insera tranzacțiile");
    }

    // Calculăm câte au fost categorizate automat
    const autoCategorizedCount = inserted.filter((t) => t.category_id !== null).length;

    console.log(`✅ ${inserted.length} tranzacții importate (${autoCategorizedCount} categorizate automat)`);

    return NextResponse.json(
      {
        message: `${inserted.length} tranzacții importate cu succes`,
        count: inserted.length,
        autoCategorizedCount, // Nou: câte au fost categorizate automat
        transactions: inserted.map((transaction) =>
          normalizeTransactionRecord(transaction)
        ),
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
