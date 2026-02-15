/**
 * API ROUTE: BANKS (Gestionare bănci)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează băncile utilizatorului.
 * - GET: Listează toate băncile userului
 * - POST: Adaugă o bancă nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq } from "drizzle-orm";

/**
 * GET /api/banks
 *
 * Returnează TOATE băncile (shared mode - toți userii văd toate datele).
 */
export async function GET(request: NextRequest) {
  try {
    // Verificăm autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    // Obținem TOATE băncile (shared access)
    const banks = await db
      .select()
      .from(schema.banks);

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Get banks error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea băncilor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/banks
 *
 * Adaugă o bancă nouă (userId salvat pentru tracking, dar vizibilă pentru toți).
 *
 * Body:
 * {
 *   "name": "ING Bank",
 *   "color": "#FF6200"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificăm autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    // Citim datele din body
    const body = await request.json();
    const { name, color } = body;

    // Validare
    if (!name) {
      return NextResponse.json(
        { error: "Numele băncii este obligatoriu" },
        { status: 400 }
      );
    }

    // Creăm banca
    const newBank = await db
      .insert(schema.banks)
      .values({
        userId: user.id,
        name,
        color: color || "#6366f1", // Default: indigo
      })
      .returning();

    return NextResponse.json(
      {
        message: "Bancă adăugată cu succes",
        bank: newBank[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create bank error:", error);
    return NextResponse.json(
      { error: "Eroare la adăugarea băncii" },
      { status: 500 }
    );
  }
}
