/**
 * SUPABASE CLIENT - Browser-Side (Client Components)
 *
 * Pentru use în Client Components (componente cu "use client")
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * PENTRU CURSANȚI: De ce folosim Supabase Auth?
 *
 * 1. SECURITATE AUTOMATĂ
 *    - Row Level Security (RLS) funcționează automat
 *    - Fiecare user vede doar propriile date
 *    - Zero configurare manuală JWT
 *
 * 2. FEATURES GRATUITE
 *    - Email verification automată
 *    - Password reset cu email
 *    - Social auth (Google, GitHub, etc.)
 *    - Session management automat
 *
 * 3. BEST PRACTICES
 *    - Cookies secure HTTP-only
 *    - CSRF protection built-in
 *    - Auto-refresh tokens
 */
