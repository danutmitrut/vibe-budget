/**
 * API ROUTE: BANKS (Gestionare bănci)
 *
 * EXPLICAȚIE:
 * Acest endpoint gestionează băncile utilizatorului.
 * - GET: Listează toate băncile userului
 * - POST: Adaugă o bancă nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createId } from "@paralleldrive/cuid2";

/**
 * GET /api/banks
 *
 * Returnează TOATE băncile (shared mode - toți userii văd toate datele).
 */
export async function GET(request: NextRequest) {
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

    // Obținem TOATE băncile (shared access)
    const { data: banksData, error: banksError } = await supabase
      .from("banks")
      .select("id, name, color, created_at")
      .order("created_at", { ascending: false });

    if (banksError) {
      throw new Error(banksError.message);
    }

    const banks = (banksData || []).map((bank) => ({
      id: bank.id,
      name: bank.name,
      color: bank.color,
      createdAt: bank.created_at,
    }));

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
 * Adaugă o bancă nouă (userId salvat pentru tracking, dar vizibilă pentru toți).
 *
 * Body:
 * {
 *   "name": "ING Bank",
 *   "color": "#FF6200"
 * }
 */
export async function POST(request: NextRequest) {
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

    // Asigurăm existența profilului în public.users înainte de insert în banks.
    let effectiveUserId = user.id;
    const fallbackName =
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Utilizator";
    const fallbackCurrency =
      (user.user_metadata?.native_currency as string | undefined) || "RON";

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
      // Dacă emailul există deja cu alt ID (migrare legacy), folosim acel profil.
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
        user_id: effectiveUserId,
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
        bank: {
          id: newBank.id,
          name: newBank.name,
          color: newBank.color,
          createdAt: newBank.created_at,
        },
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
