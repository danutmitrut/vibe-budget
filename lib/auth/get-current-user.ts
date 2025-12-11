/**
 * UTILITATE: GET CURRENT USER
 *
 * EXPLICAȚIE:
 * Funcție helper care extrage utilizatorul curent din token JWT.
 *
 * UTILIZARE:
 * const user = await getCurrentUser(request);
 * if (!user) {
 *   return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
 * }
 * // Utilizatorul este logat, putem continua
 */

import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "./jwt";
import { eq } from "drizzle-orm";

/**
 * Extrage și returnează utilizatorul curent din request.
 *
 * PROCES:
 * 1. Extrage token-ul din header Authorization
 * 2. Verifică token-ul (validare + expirare)
 * 3. Caută utilizatorul în baza de date
 * 4. Returnează utilizatorul sau null
 *
 * @param request - Request-ul Next.js
 * @returns Utilizatorul sau null dacă nu e autentificat
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    // PASUL 1: Extragem token-ul din header
    // Header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader || "");

    if (!token) {
      return null; // Nu există token
    }

    // PASUL 2: Verificăm token-ul
    const payload = verifyToken(token);

    if (!payload) {
      return null; // Token invalid sau expirat
    }

    // PASUL 3: Căutăm utilizatorul în baza de date
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (users.length === 0) {
      return null; // Utilizatorul nu mai există
    }

    // PASUL 4: Returnăm utilizatorul (fără parolă!)
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
