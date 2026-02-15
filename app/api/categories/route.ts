/**
 * API ROUTE: CATEGORIES (Gestionare categorii)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează categoriile de venituri/cheltuieli ale utilizatorului.
 * - GET: Listează toate categoriile
 * - POST: Adaugă o categorie nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createId } from "@paralleldrive/cuid2";
import { ensureDefaultSystemCategories } from "@/lib/categories/default-system-categories";

async function getAuthUser(request: NextRequest) {
  const supabase = await createClient();
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  let user = null;

  if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
    const bearerResult = await supabase.auth.getUser(bearerToken);
    user = bearerResult.data.user;
  }

  if (!user) {
    const cookieResult = await supabase.auth.getUser();
    user = cookieResult.data.user;
  }

  return { supabase, user };
}

async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const fallbackName =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Utilizator";
  const fallbackCurrency =
    (user.user_metadata?.native_currency as string | undefined) || "RON";

  let effectiveUserId = user.id;

  const { error: upsertUserError } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email || `${user.id}@placeholder.local`,
        name: fallbackName,
        native_currency: fallbackCurrency,
      },
      { onConflict: "id" }
    );

  if (upsertUserError) {
    if (upsertUserError.message.includes("users_email_key") && user.email) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (existingUserError || !existingUser) {
        throw new Error(existingUserError?.message || "Nu s-a putut valida utilizatorul");
      }

      effectiveUserId = existingUser.id;
    } else {
      throw new Error(upsertUserError.message);
    }
  }

  return { id: effectiveUserId };
}

/**
 * GET /api/categories
 *
 * Returnează toate categoriile utilizatorului.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureUserProfile(supabase, user);
    await ensureDefaultSystemCategories(supabase, profile.id);

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, user_id, name, type, color, icon, description, is_system_category, created_at")
      .order("created_at", { ascending: false });

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categories = (categoriesData || []).map((category) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      description: category.description,
      isSystemCategory: category.is_system_category,
      createdAt: category.created_at,
    }));

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
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureUserProfile(supabase, user);

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
        category: {
          id: newCategory.id,
          userId: newCategory.user_id,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          icon: newCategory.icon,
          description: newCategory.description,
          isSystemCategory: newCategory.is_system_category,
          createdAt: newCategory.created_at,
        },
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
