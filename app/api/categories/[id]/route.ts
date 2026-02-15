/**
 * API ROUTE: CATEGORIES/[ID] (Gestionare categorie specifică)
 *
 * EXPLICAȚIE:
 * Endpoint pentru ștergerea unei categorii specifice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

/**
 * DELETE /api/categories/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificăm că categoria există (shared mode)
    const { data: category, error: getCategoryError } = await supabase
      .from("categories")
      .select("id, is_system_category")
      .eq("id", id)
      .maybeSingle();

    if (getCategoryError) {
      throw new Error(getCategoryError.message);
    }

    if (!category) {
      return NextResponse.json(
        { error: "Categoria nu există" },
        { status: 404 }
      );
    }

    // PROTECȚIE: Nu permitem ștergerea categoriilor predefinite
    if (category.is_system_category) {
      return NextResponse.json(
        { error: "Nu poți șterge categoriile predefinite. Le poți doar customiza (nume, culoare, icon)." },
        { status: 403 } // 403 = Forbidden
      );
    }

    // Ștergem categoria (doar dacă e custom)
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Categorie ștearsă cu succes" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea categoriei" },
      { status: 500 }
    );
  }
}
