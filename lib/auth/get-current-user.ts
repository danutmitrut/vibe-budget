/**
 * UTILITATE: GET CURRENT USER (Supabase Auth)
 *
 * EXPLICAȚIE:
 * Funcție helper care extrage utilizatorul curent din sesiunea Supabase.
 *
 * UTILIZARE:
 * const user = await getCurrentUser(request);
 * if (!user) {
 *   return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
 * }
 * // Utilizatorul este logat, putem continua
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Extrage și returnează utilizatorul curent din sesiunea Supabase.
 *
 * PROCES:
 * 1. Creează Supabase server client
 * 2. Verifică sesiunea Supabase
 * 3. Caută utilizatorul în tabela public.users
 * 4. Returnează utilizatorul sau null
 *
 * @param request - Request-ul Next.js
 * @returns Utilizatorul sau null dacă nu e autentificat
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    // PASUL 1: Creăm Supabase server client folosind cookies DIN request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Citim cookies din request (nu din next/headers)
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // În API routes, nu putem seta cookies direct
            // Middleware-ul se va ocupa de refresh
          },
        },
      }
    );

    // PASUL 2: Verificăm sesiunea Supabase.
    // Preferăm Bearer token dacă este trimis explicit de client.
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    let authUser = null;
    let authError = null;

    if (bearerToken) {
      const bearerResult = await supabase.auth.getUser(bearerToken);
      authUser = bearerResult.data.user;
      authError = bearerResult.error;
    }

    // Fallback la sesiunea din cookies dacă Bearer lipsește sau e invalid.
    if (!authUser) {
      const cookieResult = await supabase.auth.getUser();
      authUser = cookieResult.data.user;
      authError = cookieResult.error;
    }

    if (authError || !authUser) {
      return null; // Nu există sesiune validă
    }

    // PASUL 3: Căutăm utilizatorul în tabela public.users după ID (flux normal)
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, authUser.id))
      .limit(1);

    if (users.length > 0) {
      const user = users[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        nativeCurrency: user.nativeCurrency,
      };
    }

    // FALLBACK 1: Migrare/legacy - căutăm după email (poate exista user cu alt ID)
    if (authUser.email) {
      const emailUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, authUser.email))
        .limit(1);

      if (emailUsers.length > 0) {
        const user = emailUsers[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nativeCurrency: user.nativeCurrency,
        };
      }
    }

    // FALLBACK 2: Dacă nu există deloc profil în public.users, îl creăm.
    try {
      const inserted = await db
        .insert(schema.users)
        .values({
          id: authUser.id,
          email: authUser.email || `${authUser.id}@placeholder.local`,
          name: (authUser.user_metadata?.name as string | undefined) || "Utilizator",
          nativeCurrency: (authUser.user_metadata?.native_currency as string | undefined) || "RON",
        })
        .returning();

      if (inserted.length > 0) {
        const user = inserted[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nativeCurrency: user.nativeCurrency,
        };
      }
    } catch {
      // Dacă insert-ul eșuează (ex: concurență / duplicate), încercăm încă o citire după email.
      if (authUser.email) {
        const retryUsers = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, authUser.email))
          .limit(1);

        if (retryUsers.length > 0) {
          const user = retryUsers[0];
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            nativeCurrency: user.nativeCurrency,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
