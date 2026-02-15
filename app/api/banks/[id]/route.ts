/**
 * API ROUTE: BANKS/[ID] (Gestionare bancă specifică)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează o bancă specifică (identificată prin ID).
 * - DELETE: Șterge o bancă
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/banks/[id]
 *
 * Șterge orice bancă (shared mode - orice user poate șterge orice).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    const authResult = bearerToken && bearerToken !== "null" && bearerToken !== "undefined"
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    const user = authResult.data.user;
    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificăm că banca există (fără verificare ownership)
    const { data: bank, error: getBankError } = await supabase
      .from("banks")
      .select("id")
      .eq("id", id)
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
      .eq("id", id);

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
