/**
 * API ROUTE: BULK DELETE (Ștergere multiplă tranzacții)
 *
 * EXPLICAȚIE:
 * Endpoint pentru ștergerea mai multor tranzacții simultan.
 *
 * Body:
 * {
 *   "transactionIds": ["id1", "id2", "id3"]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";

/**
 * POST /api/transactions/bulk-delete
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
    const { transactionIds } = body;

    // Validare
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Nu au fost selectate tranzacții pentru ștergere" },
        { status: 400 }
      );
    }

    const sanitizedTransactionIds = Array.from(
      new Set(transactionIds.filter((id): id is string => typeof id === "string" && id.length > 0))
    );

    if (sanitizedTransactionIds.length === 0) {
      return NextResponse.json(
        { error: "ID-uri de tranzacții invalide" },
        { status: 400 }
      );
    }

    const { data: existingTransactions, error: existingError } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", profile.id)
      .in("id", sanitizedTransactionIds);

    if (existingError) {
      throw new Error(existingError.message);
    }

    if ((existingTransactions || []).length !== sanitizedTransactionIds.length) {
      return NextResponse.json(
        { error: "Unele tranzacții nu există sau au fost deja șterse" },
        { status: 404 }
      );
    }

    // Ștergem tranzacțiile
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", profile.id)
      .in("id", sanitizedTransactionIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({
      message: `${sanitizedTransactionIds.length} tranzacții șterse cu succes`,
      deletedCount: sanitizedTransactionIds.length,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Eroare la ștergerea tranzacțiilor" },
      { status: 500 }
    );
  }
}
