/**
 * API ROUTE: RESET PASSWORD (Setare parolă nouă)
 *
 * EXPLICAȚIE:
 * User-ul a primit emailul și vrea să seteze parola nouă.
 *
 * FLOW:
 * 1. User dă click pe link din email: /reset-password?token=xxx
 * 2. User completează formularul cu parola nouă
 * 3. Frontend trimite POST către acest endpoint
 * 4. Verificăm token-ul și expirarea
 * 5. Criptăm și salvăm noua parolă
 * 6. Ștergem token-ul (one-time use)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";

/**
 * POST /api/auth/reset-password
 *
 * Body:
 * {
 *   "token": "clxxxxx",
 *   "newPassword": "noua_parola_123"
 * }
 *
 * Response success:
 * {
 *   "message": "Parola a fost resetată cu succes!"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // PASUL 1: Validare input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token și parolă nouă sunt obligatorii" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Parola trebuie să aibă minim 6 caractere" },
        { status: 400 }
      );
    }

    // PASUL 2: Căutăm userul cu acest token și verificăm expirarea
    const now = new Date();
    const users = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.resetToken, token),
          gt(schema.users.resetTokenExpiry, now) // Token-ul nu a expirat
        )
      )
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Token invalid sau expirat. Solicită un nou link de resetare." },
        { status: 404 }
      );
    }

    const user = users[0];

    // PASUL 3: Criptăm noua parolă
    const hashedPassword = await hashPassword(newPassword);

    // PASUL 4: Salvăm noua parolă și ștergem token-ul
    await db
      .update(schema.users)
      .set({
        password: hashedPassword,
        resetToken: null, // Ștergem token-ul (one-time use)
        resetTokenExpiry: null,
      })
      .where(eq(schema.users.id, user.id));

    console.log(`✅ Password reset successfully for user: ${user.email}`);

    // PASUL 5: Returnăm succes
    return NextResponse.json(
      {
        message: "Parola a fost resetată cu succes! Acum te poți autentifica.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Eroare la resetarea parolei" },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: ÎMBUNĂTĂȚIRI POSIBILE
 *
 * 1. **Password Strength Validation**
 *    - Minim 8 caractere
 *    - Cel puțin o literă mare
 *    - Cel puțin un număr
 *    - Cel puțin un caracter special
 *
 * 2. **Password History** (TODO)
 *    - Salvează hash-urile ultimelor 3 parole
 *    - Nu permite refolosirea parolelor recente
 *
 * 3. **Email Notification**
 *    - Trimite email de confirmare după resetare
 *    - "Parola ta a fost schimbată. Dacă nu ai fost tu, contactează-ne!"
 *
 * 4. **Session Invalidation**
 *    - Invalidează toate JWT token-urile existente
 *    - User trebuie să se logheze din nou pe toate device-urile
 *
 * 5. **2FA Integration**
 *    - Cere cod 2FA înainte de resetare
 *    - Extra layer of security
 */
