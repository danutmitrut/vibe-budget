/**
 * API ROUTE: BANKS/[ID] (Gestionare bancă specifică)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează o bancă specifică (identificată prin ID).
 * - DELETE: Șterge o bancă
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthContext } from "@/lib/supabase/auth-context";

/**
 * DELETE /api/banks/[id]
 *
 * Șterge o bancă ce aparține utilizatorului curent.
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

    const { id } = await params;

    const { data: bank, error: getBankError } = await supabase
      .from("banks")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (getBankError) {
      throw new Error(getBankError.message);
    }

    if (!bank) {
      return NextResponse.json(
        { error: "Banca nu există" },
        { status: 404 }
      );
    }

    // Ștergem banca
    const { error: deleteError } = await supabase
      .from("banks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Bancă ștearsă cu succes" });
  } catch (error) {
    console.error("Delete bank error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea băncii" },
      { status: 500 }
    );
  }
}
