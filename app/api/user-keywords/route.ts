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
import { createId } from "@paralleldrive/cuid2";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";

/**
 * GET /api/user-keywords
 *
 * Returnează toate keyword-urile salvate de utilizator
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

    const { data: keywordsData, error: keywordsError } = await supabase
      .from("user_keywords")
      .select("id, keyword, category_id, created_at")
      .eq("user_id", profile.id);

    if (keywordsError) {
      throw new Error(keywordsError.message);
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, icon, color")
      .eq("user_id", profile.id);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categoryMap = new Map(
      (categoriesData || []).map((category) => [category.id, category])
    );

    const keywords = (keywordsData || []).map((keyword) => {
      const category = categoryMap.get(keyword.category_id);
      return {
        id: keyword.id,
        keyword: keyword.keyword,
        categoryId: keyword.category_id,
        categoryName: category?.name || null,
        categoryIcon: category?.icon || null,
        categoryColor: category?.color || null,
        createdAt: keyword.created_at,
      };
    });

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);

    const body = await request.json();
    const { keyword, categoryId } = body;

    // Validare
    if (!keyword || !categoryId) {
      return NextResponse.json(
        { error: "Keyword și categoryId sunt obligatorii" },
        { status: 400 }
      );
    }

    const normalizedKeyword = keyword.toLowerCase().trim();

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (categoryError) {
      throw new Error(categoryError.message);
    }

    if (!category) {
      return NextResponse.json(
        { error: "Categoria selectată nu aparține utilizatorului curent." },
        { status: 400 }
      );
    }

    // Verificăm dacă keyword-ul există deja pentru userul curent
    const { data: existingKeyword, error: existingKeywordError } = await supabase
      .from("user_keywords")
      .select("id, keyword, category_id, user_id, created_at")
      .eq("user_id", profile.id)
      .eq("keyword", normalizedKeyword)
      .maybeSingle();

    if (existingKeywordError) {
      throw new Error(existingKeywordError.message);
    }

    if (existingKeyword) {
      // Update categoria dacă keyword-ul există deja
      const { data: updated, error: updateError } = await supabase
        .from("user_keywords")
        .update({ category_id: categoryId })
        .eq("id", existingKeyword.id)
        .eq("user_id", profile.id)
        .select("id, keyword, category_id, user_id, created_at")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message || "Nu s-a putut actualiza keyword-ul");
      }

      return NextResponse.json({
        message: "Keyword actualizat cu succes",
        keyword: {
          id: updated.id,
          keyword: updated.keyword,
          categoryId: updated.category_id,
          userId: updated.user_id,
          createdAt: updated.created_at,
        },
        updated: true,
      });
    }

    // Creăm keyword-ul nou
    const { data: newKeyword, error: insertError } = await supabase
      .from("user_keywords")
      .insert({
        id: createId(),
        user_id: profile.id,
        keyword: normalizedKeyword,
        category_id: categoryId,
      })
      .select("id, keyword, category_id, user_id, created_at")
      .single();

    if (insertError || !newKeyword) {
      throw new Error(insertError?.message || "Nu s-a putut salva keyword-ul");
    }

    console.log(`✅ Keyword salvat: "${normalizedKeyword}" → categoria ${categoryId} pentru ${user.email}`);

    return NextResponse.json(
      {
        message: "Keyword salvat cu succes",
        keyword: {
          id: newKeyword.id,
          keyword: newKeyword.keyword,
          categoryId: newKeyword.category_id,
          userId: newKeyword.user_id,
          createdAt: newKeyword.created_at,
        },
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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }
    const profile = await ensureSupabaseUserProfile(supabase, user);

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get("id");

    if (!keywordId) {
      return NextResponse.json(
        { error: "ID-ul keyword-ului este obligatoriu" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("user_keywords")
      .delete()
      .eq("id", keywordId)
      .eq("user_id", profile.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Keyword șters cu succes" });
  } catch (error) {
    console.error("Delete user keyword error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea keyword-ului" },
      { status: 500 }
    );
  }
}
