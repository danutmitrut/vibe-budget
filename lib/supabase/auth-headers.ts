import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const TOKEN_STORAGE_KEY = "token";

export async function getAuthHeaders(
  supabaseClient?: SupabaseClient
): Promise<Record<string, string>> {
  const supabase = supabaseClient ?? createClient();
  const { data } = await supabase.auth.getSession();
  const sessionToken = data.session?.access_token ?? null;
  const storedToken =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;

  if (typeof window !== "undefined") {
    if (sessionToken && sessionToken !== storedToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
    }

    if (!sessionToken && storedToken) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  if (!sessionToken || sessionToken === "null" || sessionToken === "undefined") {
    return {};
  }

  return { Authorization: `Bearer ${sessionToken}` };
}
