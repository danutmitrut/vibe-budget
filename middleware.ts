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

  // Refresh session dacă există
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protejează rute care necesită autentificare
  const protectedPaths = ['/dashboard', '/transactions', '/categories', '/banks'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    // User ne-autentificat încearcă să acceseze o rută protejată
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // User autentificat încearcă să acceseze /login sau /register
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match toate rutele EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (*.svg, *.png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
