/**
 * MIDDLEWARE - Supabase Auth Session Refresh (SHARED MODE)
 *
 * SCOP:
 * 1. Refresh automat session cookies pentru utilizatori autentificați
 * 2. Protejează rute - doar useri autentificați au acces
 * 3. Redirect utilizatori ne-autentificați la /login
 *
 * ATENȚIE: Aplicație în SHARED MODE
 * - Toți userii autentificați văd TOATE datele (finanțe partajate)
 * - Nu există separare între useri la nivel de date
 * - RLS policies permit acces complet pentru orice user autentificat
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Middleware rulează doar pe dashboard (vezi matcher),
  // deci evităm orice apel inutil către Supabase.
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session dacă există, cu timeout defensiv pentru Edge runtime.
  let user: { id: string } | null = null;

  try {
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth timeout in middleware')), 3000)
      ),
    ]);
    user = authResult.data.user;
  } catch {
    user = null;
  }

  if (!user) {
    // User ne-autentificat încearcă să acceseze dashboard.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
