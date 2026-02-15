/**
 * API ROUTE: CURRENCIES/[ID]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthContext } from "@/lib/supabase/auth-context";

/**
 * DELETE /api/currencies/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await params;

    const { data: currency, error: getCurrencyError } = await supabase
      .from("currencies")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (getCurrencyError) {
      throw new Error(getCurrencyError.message);
    }

    if (!currency) {
      return NextResponse.json({ error: "Valuta nu există" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("currencies")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: "Valută ștearsă cu succes" });
  } catch (error) {
    console.error("Delete currency error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea valutei" },
      { status: 500 }
    );
  }
}
