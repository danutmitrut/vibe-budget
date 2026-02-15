/**
 * API ROUTE: TRANSACTIONS/[ID]
 *
 * EXPLICAȚIE:
 * Gestionează o tranzacție specifică.
 * - PATCH: Actualizează tranzacția (de ex. adaugă categorie)
 * - DELETE: Șterge tranzacția
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";
import { normalizeTransactionRecord } from "@/lib/api/normalizers";

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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);

    const { id } = await params;
    const body = await request.json();

    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id, category_id")
      .eq("id", id)
      .eq("user_id", profile.id)
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

    if (body.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", body.categoryId)
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
    }

    // Actualizăm tranzacția (doar categoryId - notes și isCategorized nu există în PostgreSQL schema)
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        category_id: body.categoryId || existing.category_id,
      })
      .eq("id", id)
      .eq("user_id", profile.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Nu s-a putut actualiza tranzacția");
    }

    return NextResponse.json({
      message: "Tranzacție actualizată cu succes",
      transaction: normalizeTransactionRecord(updated),
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
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);

    const { id } = await params;

    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("id", id)
      .eq("user_id", profile.id)
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
      .eq("id", id)
      .eq("user_id", profile.id);

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
