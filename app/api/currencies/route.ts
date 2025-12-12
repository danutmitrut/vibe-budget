/**
 * API ROUTE: CURRENCIES (Gestionare valute)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează valutele utilizatorului.
 * - GET: Listează toate valutele
 * - POST: Adaugă o valută nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq } from "drizzle-orm";

/**
 * GET /api/currencies
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

    const currencies = await db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.userId, user.id));

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("Get currencies error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea valutelor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/currencies
 *
 * Body:
 * {
 *   "code": "EUR",
 *   "symbol": "€",
 *   "isNative": false
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
    const { code, symbol, isNative } = body;

    // Validare
    if (!code || !symbol) {
      return NextResponse.json(
        { error: "Cod și simbol sunt obligatorii" },
        { status: 400 }
      );
    }

    // Creăm valuta
    const newCurrency = await db
      .insert(schema.currencies)
      .values({
        userId: user.id,
        code: code.toUpperCase(),
        name, // Adăugăm name care este required în schema
        symbol,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Valută adăugată cu succes",
        currency: newCurrency[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create currency error:", error);
    return NextResponse.json(
      { error: "Eroare la adăugarea valutei" },
      { status: 500 }
    );
  }
}
