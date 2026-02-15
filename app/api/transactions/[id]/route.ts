/**
 * API ROUTE: TRANSACTIONS/[ID]
 *
 * EXPLICAȚIE:
 * Gestionează o tranzacție specifică.
 * - PATCH: Actualizează tranzacția (de ex. adaugă categorie)
 * - DELETE: Șterge tranzacția
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/transactions/[id]
 *
 * Body:
 * {
 *   "categoryId": "cat_123",
 *   "notes": "Optional notes"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // SHARED MODE: Verificăm doar că tranzacția există
    const existing = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Tranzacția nu există" },
        { status: 404 }
      );
    }

    // Actualizăm tranzacția (doar categoryId - notes și isCategorized nu există în PostgreSQL schema)
    const updated = await db
      .update(schema.transactions)
      .set({
        categoryId: body.categoryId || existing[0].categoryId,
      })
      .where(eq(schema.transactions.id, id))
      .returning();

    return NextResponse.json({
      message: "Tranzacție actualizată cu succes",
      transaction: updated[0],
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Eroare la actualizarea tranzacției" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // SHARED MODE: Verificăm doar că tranzacția există
    const existing = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Tranzacția nu există" },
        { status: 404 }
      );
    }

    // Ștergem tranzacția
    await db
      .delete(schema.transactions)
      .where(eq(schema.transactions.id, id));

    return NextResponse.json({ message: "Tranzacție ștearsă cu succes" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea tranzacției" },
      { status: 500 }
    );
  }
}
