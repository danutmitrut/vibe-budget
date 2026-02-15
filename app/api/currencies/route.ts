/**
 * API ROUTE: CURRENCIES (Gestionare valute)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează valutele utilizatorului.
 * - GET: Listează toate valutele
 * - POST: Adaugă o valută nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";
import { normalizeCurrencyRecord } from "@/lib/api/normalizers";

/**
 * GET /api/currencies
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { data: currenciesData, error: currenciesError } = await supabase
      .from("currencies")
      .select("id, user_id, code, name, symbol, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (currenciesError) {
      throw new Error(currenciesError.message);
    }

    const currencies = (currenciesData || []).map((currency) =>
      normalizeCurrencyRecord(currency)
    );

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("Get currencies error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea valutelor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/currencies
 *
 * Body:
 * {
 *   "code": "EUR",
 *   "symbol": "€",
 *   "name": "Euro" (opțional, folosește code dacă lipsește)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const profile = await ensureSupabaseUserProfile(supabase, user);
    const body = await request.json();
    const { code, symbol, name } = body;

    if (!code || !symbol) {
      return NextResponse.json(
        { error: "Cod și simbol sunt obligatorii" },
        { status: 400 }
      );
    }

    const upperCode = String(code).toUpperCase();

    const { data: insertedCurrency, error: insertError } = await supabase
      .from("currencies")
      .insert({
        id: createId(),
        user_id: profile.id,
        code: upperCode,
        name: name || upperCode,
        symbol,
      })
      .select("id, user_id, code, name, symbol, created_at")
      .single();

    if (insertError || !insertedCurrency) {
      throw new Error(insertError?.message || "Nu s-a putut crea valuta");
    }

    return NextResponse.json(
      {
        message: "Valută adăugată cu succes",
        currency: normalizeCurrencyRecord(insertedCurrency),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create currency error:", error);
    return NextResponse.json(
      { error: "Eroare la adăugarea valutei" },
      { status: 500 }
    );
  }
}
