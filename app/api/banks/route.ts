/**
 * API ROUTE: BANKS (Gestionare bănci)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează băncile utilizatorului.
 * - GET: Listează toate băncile userului
 * - POST: Adaugă o bancă nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import {
  ensureSupabaseUserProfile,
  getSupabaseAuthContext,
} from "@/lib/supabase/auth-context";
import { normalizeBankRecord } from "@/lib/api/normalizers";

/**
 * GET /api/banks
 *
 * Returnează băncile utilizatorului curent.
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

    const { data: banksData, error: banksError } = await supabase
      .from("banks")
      .select("id, name, color, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (banksError) {
      throw new Error(banksError.message);
    }

    const banks = (banksData || []).map((bank) => normalizeBankRecord(bank));

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Get banks error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea băncilor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/banks
 *
 * Adaugă o bancă nouă pentru utilizatorul curent.
 *
 * Body:
 * {
 *   "name": "ING Bank",
 *   "color": "#FF6200"
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

    // Citim datele din body
    const body = await request.json();
    const { name, color } = body;

    // Validare
    if (!name) {
      return NextResponse.json(
        { error: "Numele băncii este obligatoriu" },
        { status: 400 }
      );
    }

    // Creăm banca
    const { data: newBank, error: insertError } = await supabase
      .from("banks")
      .insert({
        id: createId(),
        user_id: profile.id,
        name,
        color: color || "#6366f1",
      })
      .select("id, name, color, created_at")
      .single();

    if (insertError || !newBank) {
      throw new Error(insertError?.message || "Nu s-a putut crea banca");
    }

    return NextResponse.json(
      {
        message: "Bancă adăugată cu succes",
        bank: normalizeBankRecord(newBank),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create bank error:", error);
    return NextResponse.json(
      { error: "Eroare la adăugarea băncii" },
      { status: 500 }
    );
  }
}
