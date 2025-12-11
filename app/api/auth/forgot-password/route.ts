/**
 * API ROUTE: FORGOT PASSWORD (Cerere resetare parolă)
 *
 * EXPLICAȚIE:
 * User-ul și-a uitat parola și vrea să o reseteze.
 * Trimitem email cu link pentru resetare.
 *
 * FLOW:
 * 1. User introduce email-ul pe /forgot-password
 * 2. Verificăm dacă email-ul există în DB
 * 3. Generăm resetToken + expiry (1h)
 * 4. Trimitem email cu link: /reset-password?token=xxx
 * 5. User dă click și setează parolă nouă
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email/mailersend";
import { createId } from "@paralleldrive/cuid2";

/**
 * POST /api/auth/forgot-password
 *
 * Body:
 * {
 *   "email": "dan@example.com"
 * }
 *
 * Response (întotdeauna success pentru securitate):
 * {
 *   "message": "Dacă email-ul există, vei primi instrucțiuni de resetare."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email obligatoriu" },
        { status: 400 }
      );
    }

    // PASUL 1: Căutăm userul
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    // IMPORTANT: Pentru securitate, răspundem întotdeauna cu succes
    // Nu dezvăluim dacă email-ul există sau nu (previne email enumeration)
    const genericMessage =
      "Dacă email-ul există în sistem, vei primi instrucțiuni de resetare în câteva minute.";

    if (users.length === 0) {
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ message: genericMessage }, { status: 200 });
    }

    const user = users[0];

    // PASUL 2: Generăm token de reset cu expirare
    const resetToken = createId();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expiră în 1 oră

    // PASUL 3: Salvăm token-ul în DB
    await db
      .update(schema.users)
      .set({
        resetToken,
        resetTokenExpiry,
      })
      .where(eq(schema.users.id, user.id));

    // PASUL 4: Trimitem email
    console.log(`📧 Sending password reset email to ${email}...`);
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );

    if (!emailResult.success) {
      console.error(`❌ Failed to send reset email: ${emailResult.error}`);
      // Nu returnăm eroare către user pentru securitate
    } else {
      console.log(`✅ Password reset email sent successfully`);
    }

    // PASUL 5: Returnăm mesaj generic (întotdeauna)
    return NextResponse.json({ message: genericMessage }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Eroare la procesarea cererii" },
      { status: 500 }
    );
  }
}

/**
 * PENTRU CURSANȚI: SECURITY BEST PRACTICES
 *
 * 1. **Email Enumeration Prevention**
 *    - Răspundem întotdeauna cu succes
 *    - Nu dezvăluim dacă email-ul există
 *    - Previne atacatori să descopere utilizatori valizi
 *
 * 2. **Token Expiry**
 *    - Reset token-uri expiră în 1h
 *    - După expirare, user trebuie să ceară din nou
 *    - Limitează fereastra de atac
 *
 * 3. **One-Time Use**
 *    - Token-ul se șterge după folosire
 *    - Nu poate fi refolosit pentru securitate
 *
 * 4. **Rate Limiting** (TODO pentru cursanți)
 *    - Limitează la 3 cereri/15min/email
 *    - Previne spam și brute-force
 *
 * 5. **Logging**
 *    - Log toate cererile (success + failed)
 *    - Monitor pentru abuse patterns
 */
