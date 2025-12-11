/**
 * UTILITĂȚI PENTRU JWT (JSON Web Tokens)
 *
 * EXPLICAȚIE:
 * JWT = Un "tichet digital" care dovedește că ești logat.
 *
 * ANALOGIE:
 * Când intri la un concert, primești o brățară.
 * Brățara = JWT-ul tău. Dovadă că ai plătit intrarea.
 *
 * STRUCTURA JWT:
 * {
 *   userId: "clxyz123",
 *   email: "dan@example.com",
 *   exp: 1234567890  // Când expiră (24h)
 * }
 */

import jwt from "jsonwebtoken";

// Cheia secretă pentru semnarea JWT-urilor
// ÎN PRODUCȚIE: Aceasta trebuie să fie în variabile de mediu (.env)
const JWT_SECRET = process.env.JWT_SECRET || "secret-key-for-development-only";

// Cât timp este valid token-ul (24 ore)
const JWT_EXPIRES_IN = "24h";

/**
 * Tipul de date pentru payload-ul JWT
 *
 * CE CONȚINE:
 * - userId: ID-ul utilizatorului logat
 * - email: Email-ul utilizatorului
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * FUNCȚIA 1: Creează JWT Token
 *
 * Generează un token pentru un utilizator după login.
 *
 * PARAMETRI:
 * @param payload - Datele utilizatorului (userId, email)
 * @returns Token-ul JWT (string lung)
 *
 * UTILIZARE:
 * const token = createToken({ userId: "123", email: "dan@example.com" });
 * // Rezultat: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMi..."
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // Token-ul expiră după 24h
  });
}

/**
 * FUNCȚIA 2: Verifică JWT Token
 *
 * Verifică dacă token-ul este valid și nu a expirat.
 *
 * PARAMETRI:
 * @param token - Token-ul primit de la client
 * @returns Payload-ul decodat sau null dacă token-ul e invalid
 *
 * UTILIZARE:
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log("User logat:", payload.email);
 * } else {
 *   console.log("Token invalid sau expirat!");
 * }
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token invalid sau expirat
    return null;
  }
}

/**
 * FUNCȚIA 3: Extrage token din header Authorization
 *
 * Token-ul vine de obicei în header-ul HTTP:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * PARAMETRI:
 * @param authHeader - Header-ul Authorization din request
 * @returns Token-ul sau null
 *
 * UTILIZARE:
 * const token = extractTokenFromHeader(request.headers.authorization);
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
