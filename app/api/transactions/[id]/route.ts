/**
 * API ROUTE: TRANSACTIONS/[ID]
 *
 * EXPLICAȚIE:
 * Gestionează o tranzacție specifică.
 * - PATCH: Actualizează tranzacția (de ex. adaugă categorie)
 * - DELETE: Șterge tranzacția
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
 * PATCH /api/transactions/[id]
 *
 * Body:
 * {
 *   "categoryId": "cat_123",
 *   "notes": "Optional notes"
 * }
 */
export async function PATCH(
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
    const body = await request.json();

    // SHARED MODE: Verificăm doar că tranzacția există
    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id, category_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Tranzacția nu există" },
        { status: 404 }
      );
    }

    // Actualizăm tranzacția (doar categoryId - notes și isCategorized nu există în PostgreSQL schema)
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        category_id: body.categoryId || existing.category_id,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Nu s-a putut actualiza tranzacția");
    }

    return NextResponse.json({
      message: "Tranzacție actualizată cu succes",
      transaction: updated,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Eroare la actualizarea tranzacției" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
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

    // SHARED MODE: Verificăm doar că tranzacția există
    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Tranzacția nu există" },
        { status: 404 }
      );
    }

    // Ștergem tranzacția
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Tranzacție ștearsă cu succes" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea tranzacției" },
      { status: 500 }
    );
  }
}
