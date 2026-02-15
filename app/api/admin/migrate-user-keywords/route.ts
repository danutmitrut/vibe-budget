/**
 * API ROUTE: migrate-user-keywords (DEPRECATED)
 *
 * Migrations must run from versioned SQL files, not runtime endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthContext } from "@/lib/supabase/auth-context";
import { requireAdminEmail } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  const { user } = await getSupabaseAuthContext(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminCheck = requireAdminEmail(user.email);
  if (adminCheck) {
    return adminCheck;
  }

  return NextResponse.json(
    {
      error: "Deprecated endpoint",
      code: "E_MIGRATION_ENDPOINT_DEPRECATED",
      message:
        "Folosește migrațiile SQL versionate din repository și rulează-le prin Supabase CLI.",
    },
    { status: 410 }
  );
}
