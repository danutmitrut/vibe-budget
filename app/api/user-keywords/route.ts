/**
 * API ROUTE: USER KEYWORDS (Gestionaire keyword-uri personalizate)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează keyword-urile personalizate ale utilizatorului
 * pentru auto-categorizare inteligentă.
 *
 * - GET: Listează toate keyword-urile utilizatorului
 * - POST: Adaugă un keyword nou
 * - DELETE: Șterge un keyword
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * GET /api/user-keywords
 *
 * Returnează toate keyword-urile salvate de utilizator
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

    // SHARED MODE: Toți userii văd toate keyword-urile
    const keywords = await db
      .select({
        id: schema.userKeywords.id,
        keyword: schema.userKeywords.keyword,
        categoryId: schema.userKeywords.categoryId,
        categoryName: schema.categories.name,
        categoryIcon: schema.categories.icon,
        categoryColor: schema.categories.color,
        createdAt: schema.userKeywords.createdAt,
      })
      .from(schema.userKeywords)
      .leftJoin(
        schema.categories,
        eq(schema.userKeywords.categoryId, schema.categories.id)
      );

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Get user keywords error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea keyword-urilor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-keywords
 *
 * Body:
 * {
 *   "keyword": "cofidis",
 *   "categoryId": "cat_123"
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
    const { keyword, categoryId } = body;

    // Validare
    if (!keyword || !categoryId) {
      return NextResponse.json(
        { error: "Keyword și categoryId sunt obligatorii" },
        { status: 400 }
      );
    }

    // SHARED MODE: Verificăm dacă keyword-ul există deja (global, nu per user)
    const existingKeyword = await db
      .select()
      .from(schema.userKeywords)
      .where(eq(schema.userKeywords.keyword, keyword.toLowerCase().trim()))
      .limit(1);

    if (existingKeyword.length > 0) {
      // Update categoria dacă keyword-ul există deja
      const updated = await db
        .update(schema.userKeywords)
        .set({ categoryId })
        .where(eq(schema.userKeywords.id, existingKeyword[0].id))
        .returning();

      return NextResponse.json({
        message: "Keyword actualizat cu succes",
        keyword: updated[0],
        updated: true,
      });
    }

    // Creăm keyword-ul nou
    const newKeyword = await db
      .insert(schema.userKeywords)
      .values({
        id: createId(),
        userId: user.id,
        keyword: keyword.toLowerCase().trim(),
        categoryId,
      })
      .returning();

    console.log(`✅ Keyword salvat: "${keyword}" → categoria ${categoryId} pentru ${user.email}`);

    return NextResponse.json(
      {
        message: "Keyword salvat cu succes",
        keyword: newKeyword[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user keyword error:", error);
    return NextResponse.json(
      { error: "Eroare la salvarea keyword-ului", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-keywords?id=keyword_123
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get("id");

    if (!keywordId) {
      return NextResponse.json(
        { error: "ID-ul keyword-ului este obligatoriu" },
        { status: 400 }
      );
    }

    // SHARED MODE: Oricine poate șterge orice keyword
    await db
      .delete(schema.userKeywords)
      .where(eq(schema.userKeywords.id, keywordId));

    return NextResponse.json({ message: "Keyword șters cu succes" });
  } catch (error) {
    console.error("Delete user keyword error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea keyword-ului" },
      { status: 500 }
    );
  }
}
