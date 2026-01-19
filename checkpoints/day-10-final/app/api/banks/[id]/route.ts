/**
 * API ROUTE: BANKS/[ID] (Gestionare bancă specifică)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează o bancă specifică (identificată prin ID).
 * - DELETE: Șterge o bancă
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and } from "drizzle-orm";

/**
 * DELETE /api/banks/[id]
 *
 * Șterge o bancă a utilizatorului.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificăm autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificăm că banca aparține userului
    const banks = await db
      .select()
      .from(schema.banks)
      .where(
        and(
          eq(schema.banks.id, id),
          eq(schema.banks.userId, user.id)
        )
      );

    if (banks.length === 0) {
      return NextResponse.json(
        { error: "Banca nu există sau nu îți aparține" },
        { status: 404 }
      );
    }

    // Ștergem banca
    await db
      .delete(schema.banks)
      .where(eq(schema.banks.id, id));

    return NextResponse.json({ message: "Bancă ștearsă cu succes" });
  } catch (error) {
    console.error("Delete bank error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea băncii" },
      { status: 500 }
    );
  }
}
