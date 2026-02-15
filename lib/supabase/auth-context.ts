import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const INVALID_BEARER_VALUES = new Set(["", "null", "undefined"]);

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
  return INVALID_BEARER_VALUES.has(token) ? null : token;
}

export async function getSupabaseAuthContext(request: NextRequest) {
  const supabase = await createClient();
  const bearerToken = extractBearerToken(request.headers.get("authorization"));

  let user: User | null = null;

  if (bearerToken) {
    const bearerResult = await supabase.auth.getUser(bearerToken);
    user = bearerResult.data.user;
  }

  if (!user) {
    const cookieResult = await supabase.auth.getUser();
    user = cookieResult.data.user;
  }

  return { supabase, user };
}

export async function ensureSupabaseUserProfile(
  supabase: SupabaseServerClient,
  user: Pick<User, "id" | "email" | "user_metadata">
) {
  const fallbackName =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Utilizator";
  const fallbackCurrency =
    (user.user_metadata?.native_currency as string | undefined) || "RON";

  const { error: upsertUserError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email || `${user.id}@placeholder.local`,
      name: fallbackName,
      native_currency: fallbackCurrency,
    },
    { onConflict: "id" }
  );

  if (upsertUserError) {
    if (upsertUserError.message.includes("users_email_key")) {
      throw new Error(
        "E_AUTH_ID_EMAIL_MISMATCH: email-ul există deja cu alt user_id. Rulează migrarea de reconciliere înainte de per-user mode."
      );
    }

    throw new Error(upsertUserError.message);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("native_currency")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    nativeCurrency: profile?.native_currency || fallbackCurrency,
  };
}
