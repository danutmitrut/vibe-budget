/**
 * API ROUTE: CATEGORIES/[ID] (Gestionare categorie specifică)
 *
 * EXPLICAȚIE:
 * Endpoint pentru ștergerea unei categorii specifice.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and } from "drizzle-orm";

/**
 * DELETE /api/categories/[id]
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

    // Verificăm că categoria aparține userului
    const categories = await db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.id, id),
          eq(schema.categories.userId, user.id)
        )
      );

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Categoria nu există sau nu îți aparține" },
        { status: 404 }
      );
    }

    // PROTECȚIE: Nu permitem ștergerea categoriilor predefinite
    if (categories[0].isSystemCategory) {
      return NextResponse.json(
        { error: "Nu poți șterge categoriile predefinite. Le poți doar customiza (nume, culoare, icon)." },
        { status: 403 } // 403 = Forbidden
      );
    }

    // Ștergem categoria (doar dacă e custom)
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));

    return NextResponse.json({ message: "Categorie ștearsă cu succes" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea categoriei" },
      { status: 500 }
    );
  }
}
