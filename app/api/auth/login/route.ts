/**
 * API ROUTE: LOGIN (Autentificare utilizator existent)
 *
 * EXPLICAȚIE:
 * Acest fișier gestionează login-ul utilizatorilor existenți.
 *
 * PROCES:
 * 1. User completează formularul (email, parolă)
 * 2. Request-ul vine aici (POST /api/auth/login)
 * 3. Căutăm userul în baza de date după email
 * 4. Verificăm parola (comparăm hash-ul)
 * 5. Dacă e corectă, returnăm token JWT + datele userului
 *
 * ANALOGIE:
 * E ca să intri la sală cu cardul:
 * - Prezinți cardul (email)
 * - Scanner-ul verifică că e valid (parola)
 * - Îți dă acces (token JWT)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";

/**
 * POST /api/auth/login
 *
 * Body JSON:
 * {
 *   "email": "dan@example.com",
 *   "password": "parola123"
 * }
 *
 * Response succes:
 * {
 *   "user": { id, email, name, nativeCurrency },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 *
 * Response eroare:
 * {
 *   "error": "Email sau parolă incorectă"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // PASUL 1: Citim datele din body
    const body = await request.json();
    const { email, password } = body;

    // PASUL 2: Validăm datele
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email și parolă sunt obligatorii" },
        { status: 400 } // 400 = Bad Request
      );
    }

    // PASUL 3: Căutăm userul în baza de date
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    // Verificăm dacă userul există
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Email sau parolă incorectă" },
        { status: 401 } // 401 = Unauthorized (credențiale invalide)
      );
    }

    const user = users[0];

    // PASUL 4: Verificăm parola
    // Comparăm parola introdusă cu hash-ul din baza de date
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email sau parolă incorectă" },
        { status: 401 }
      );
    }

    // PASUL 5: Creăm token JWT
    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    // PASUL 6: Returnăm succesul
    return NextResponse.json({
      message: "Login reușit",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nativeCurrency: user.nativeCurrency,
      },
      token, // Token-ul pentru frontend
    });
  } catch (error) {
    // Eroare server
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Eroare la autentificare" },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}
