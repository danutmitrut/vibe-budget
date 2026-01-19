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
import { cookies } from "next/headers";

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
    // PASUL 1: Creăm Supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // PASUL 2: Verificăm sesiunea Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null; // Nu există sesiune validă
    }

    // PASUL 3: Căutăm utilizatorul în tabela public.users
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, authUser.id))
      .limit(1);

    if (users.length === 0) {
      return null; // Utilizatorul nu există în public.users
    }

    // PASUL 4: Returnăm utilizatorul
    const user = users[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nativeCurrency: user.nativeCurrency,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
