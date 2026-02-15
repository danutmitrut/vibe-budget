/**
 * API ROUTE: CATEGORIES (Gestionare categorii)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează categoriile de venituri/cheltuieli ale utilizatorului.
 * - GET: Listează toate categoriile
 * - POST: Adaugă o categorie nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { ensureDefaultSystemCategories } from "@/lib/categories/default-system-categories";
import { ensureSupabaseUserProfile, getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { normalizeCategoryRecord } from "@/lib/api/normalizers";

/**
 * GET /api/categories
 *
 * Returnează toate categoriile utilizatorului.
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
    await ensureDefaultSystemCategories(supabase, profile.id);

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, user_id, name, type, color, icon, description, is_system_category, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categories = (categoriesData || []).map((category) =>
      normalizeCategoryRecord(category)
    );

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);

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

    const { data: newCategory, error: insertError } = await supabase
      .from("categories")
      .insert({
        id: createId(),
        user_id: profile.id,
        name,
        type,
        color: color || "#6366f1",
        icon: icon || "📁",
      })
      .select("id, user_id, name, type, color, icon, description, is_system_category, created_at")
      .single();

    if (insertError || !newCategory) {
      throw new Error(insertError?.message || "Nu s-a putut crea categoria");
    }

    return NextResponse.json(
      {
        message: "Categorie adăugată cu succes",
        category: normalizeCategoryRecord(newCategory),
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
