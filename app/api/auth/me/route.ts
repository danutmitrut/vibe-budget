/**
 * API ROUTE: GET CURRENT USER (Obține utilizatorul curent)
 *
 * EXPLICAȚIE:
 * Acest endpoint returnează datele utilizatorului autentificat.
 *
 * UTILIZARE:
 * Frontend-ul face un request GET cu token-ul JWT în header.
 * Primește înapoi datele userului (sau eroare dacă nu e logat).
 *
 * SCENARIU:
 * - User deschide aplicația
 * - Frontend verifică dacă există token salvat în localStorage
 * - Face request la /api/auth/me
 * - Dacă primește datele userului → e logat
 * - Dacă primește eroare 401 → nu e logat, redirect la login
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * GET /api/auth/me
 *
 * Headers:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * Response succes:
 * {
 *   "user": {
 *     "id": "clxyz123",
 *     "email": "dan@example.com",
 *     "name": "Dan Mitrut",
 *     "nativeCurrency": "RON"
 *   }
 * }
 *
 * Response eroare:
 * {
 *   "error": "Neautentificat"
 * }
 */
export async function GET(request: NextRequest) {
  // Obținem utilizatorul curent
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Neautentificat" },
      { status: 401 } // 401 = Unauthorized
    );
  }

  // Returnăm datele utilizatorului
  return NextResponse.json({ user });
}
