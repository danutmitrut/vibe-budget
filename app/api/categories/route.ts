/**
 * API ROUTE: CATEGORIES (Gestionare categorii)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează categoriile de venituri/cheltuieli ale utilizatorului.
 * - GET: Listează toate categoriile
 * - POST: Adaugă o categorie nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq } from "drizzle-orm";

/**
 * GET /api/categories
 *
 * Returnează toate categoriile utilizatorului.
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

    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea categoriilor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 *
 * Adaugă o categorie nouă.
 *
 * Body:
 * {
 *   "name": "Salariu",
 *   "type": "income",
 *   "color": "#22c55e",
 *   "icon": "💰"
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
    const { name, type, color, icon } = body;

    // Validare
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nume și tip sunt obligatorii" },
        { status: 400 }
      );
    }

    // Validare tip
    if (!["income", "expense", "savings"].includes(type)) {
      return NextResponse.json(
        { error: "Tip invalid. Folosește: income, expense sau savings" },
        { status: 400 }
      );
    }

    // Creăm categoria
    const newCategory = await db
      .insert(schema.categories)
      .values({
        userId: user.id,
        name,
        type,
        color: color || "#6366f1",
        icon: icon || "📁",
      })
      .returning();

    return NextResponse.json(
      {
        message: "Categorie adăugată cu succes",
        category: newCategory[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Eroare la adăugarea categoriei" },
      { status: 500 }
    );
  }
}
