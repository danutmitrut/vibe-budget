/**
 * API ROUTE: BULK DELETE (Ștergere multiplă tranzacții)
 *
 * EXPLICAȚIE:
 * Endpoint pentru ștergerea mai multor tranzacții simultan.
 *
 * Body:
 * {
 *   "transactionIds": ["id1", "id2", "id3"]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/transactions/bulk-delete
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
    const { transactionIds } = body;

    // Validare
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Nu au fost selectate tranzacții pentru ștergere" },
        { status: 400 }
      );
    }

    // Verificăm că toate tranzacțiile aparțin userului
    const existingTransactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          inArray(schema.transactions.id, transactionIds),
          eq(schema.transactions.userId, user.id)
        )
      );

    if (existingTransactions.length !== transactionIds.length) {
      return NextResponse.json(
        { error: "Unele tranzacții nu există sau nu îți aparțin" },
        { status: 403 }
      );
    }

    // Ștergem tranzacțiile
    await db
      .delete(schema.transactions)
      .where(
        and(
          inArray(schema.transactions.id, transactionIds),
          eq(schema.transactions.userId, user.id)
        )
      );

    return NextResponse.json({
      message: `${transactionIds.length} tranzacții șterse cu succes`,
      deletedCount: transactionIds.length,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea tranzacțiilor" },
      { status: 500 }
    );
  }
}
