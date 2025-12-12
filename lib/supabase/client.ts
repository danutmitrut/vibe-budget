/**
 * SUPABASE CLIENT - Browser & Server
 *
 * Configurare client Supabase pentru Next.js App Router
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client pentru browser (folosește anon key - public safe)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * PENTRU CURSANȚI: De ce 2 environment variables?
 *
 * 1. NEXT_PUBLIC_SUPABASE_URL
 *    - Public, expus în browser
 *    - URL-ul proiectului Supabase
 *
 * 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - Public, expus în browser (SAFE!)
 *    - Protejat de Row Level Security (RLS)
 *    - Users pot accesa doar propriile date
 *
 * 3. SUPABASE_SERVICE_ROLE_KEY (nu îl folosim aici)
 *    - SECRET, DOAR server-side
 *    - Bypass RLS - admin access
 *    - NICIODATĂ în browser!
 */
