/**
 * API ROUTE: VERIFY EMAIL (Verificare adresă de email)
 *
 * EXPLICAȚIE:
 * Acest endpoint primește token-ul din link-ul de confirmare și activează contul.
 *
 * FLOW:
 * 1. User primește email cu link: /verify-email?token=xxx
 * 2. User dă click pe link
 * 3. Frontend face request GET către acest endpoint
 * 4. Verificăm token-ul în DB
 * 5. Dacă e valid, setăm emailVerified = true
 * 6. Ștergem token-ul (poate fi folosit o singură dată)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Query params:
 * - token: Token-ul generat la înregistrare
 *
 * Response success:
 * {
 *   "message": "Email verificat cu succes!",
 *   "verified": true
 * }
 *
 * Response error:
 * {
 *   "error": "Token invalid sau expirat",
 *   "verified": false
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // PASUL 1: Extragem token-ul din URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token lipsă", verified: false },
        { status: 400 }
      );
    }

    // PASUL 2: Căutăm userul cu acest token
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.verificationToken, token))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Token invalid sau expirat", verified: false },
        { status: 404 }
      );
    }

    const user = users[0];

    // PASUL 3: Verificăm dacă e deja verificat
    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: "Email-ul este deja verificat!",
          verified: true,
        },
        { status: 200 }
      );
    }

    // PASUL 4: Activăm contul
    await db
      .update(schema.users)
      .set({
        emailVerified: true,
        verificationToken: null, // Ștergem token-ul (one-time use)
      })
      .where(eq(schema.users.id, user.id));

    console.log(`✅ Email verified for user: ${user.email}`);

    // PASUL 5: Returnăm succes
    return NextResponse.json(
      {
        message: "Email verificat cu succes! Acum poți folosi aplicația.",
        verified: true,
        user: {
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Eroare la verificarea emailului", verified: false },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: BEST PRACTICES
 *
 * 1. **Token-uri one-time use**
 *    - După verificare, ștergem token-ul
 *    - Nu poate fi refolosit (securitate)
 *
 * 2. **Expirare token** (TODO pentru cursanți)
 *    - Adaugă `verificationTokenExpiry` în schema
 *    - Verifică dacă token-ul a expirat (ex: 24h)
 *    - Dacă a expirat, returnează eroare + opțiune de resend
 *
 * 3. **Rate limiting** (TODO pentru cursanți)
 *    - Limitează verificările la max 5/min/IP
 *    - Previne brute-force attacks
 *
 * 4. **Logging**
 *    - Log succesul verificărilor
 *    - Monitor token-uri invalide (posibil abuse)
 */
