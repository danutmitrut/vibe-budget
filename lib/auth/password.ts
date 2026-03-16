/**
 * UTILITĂȚI PENTRU PAROLE
 *
 * EXPLICAȚIE:
 * Nu stocăm niciodată parola în clar în baza de date!
 * Folosim "hashing" - o transformare ireversibilă.
 *
 * EXEMPLU:
 * Parola: "parola123"
 * Hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.bQx/8xsJQKJn8j/7gLOGX9Tv5Qs"
 *
 * Nimeni nu poate afla parola originală din hash!
 */

import bcrypt from "bcryptjs";

/**
 * FUNCȚIA 1: Hash Password
 *
 * Transformă parola în cod criptat.
 *
 * PARAMETRI:
 * @param password - Parola în clar (ex: "parola123")
 * @returns Hash-ul parolei (cod lung criptat)
 *
 * UTILIZARE:
 * const hashed = await hashPassword("parola123");
 * // Rezultat: "$2a$10$abc..."
 */
export async function hashPassword(password: string): Promise<string> {
  // Salt rounds = 10 (complexitatea criptării)
  // Cu cât e mai mare, cu atât e mai sigur, dar mai lent
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * FUNCȚIA 2: Verify Password
 *
 * Verifică dacă parola introdusă corespunde cu hash-ul din baza de date.
 *
 * PARAMETRI:
 * @param password - Parola introdusă de user
 * @param hashedPassword - Hash-ul stocat în baza de date
 * @returns true dacă parolele se potrivesc, false dacă nu
 *
 * UTILIZARE:
 * const isValid = await verifyPassword("parola123", userHashFromDB);
 * if (isValid) {
 *   console.log("Login reușit!");
 * }
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
