/**
 * USER KEYWORDS MATCHER
 *
 * EXPLICAȚIE:
 * Funcție pentru auto-categorizare bazată pe keyword-uri personalizate ale utilizatorului.
 * Această funcție are PRIORITATE față de regulile globale din categories-rules.ts.
 *
 * FLUX:
 * 1. User categorizează manual "Cofidis" → Cumpărături
 * 2. Aplicația îl întreabă: "Salvezi 'Cofidis' pentru Cumpărături?"
 * 3. Dacă "Da" → keyword salvat în user_keywords table
 * 4. La următorul CSV cu "Cofidis" → aplicăm automat categoria Cumpărături
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Verifică dacă descrierea tranzacției conține un keyword personalizat salvat de user
 *
 * @param userId - ID-ul utilizatorului
 * @param description - Descrierea tranzacției (ex: "Cofidis Spain")
 * @returns ID-ul categoriei sau null dacă nu găsește match
 */
export async function matchUserKeyword(
  userId: string,
  description: string
): Promise<string | null> {
  if (!description || !userId) return null;

  const lowerDesc = description.toLowerCase();

  // Obținem toate keyword-urile utilizatorului
  const userKeywords = await db
    .select()
    .from(schema.userKeywords)
    .where(eq(schema.userKeywords.userId, userId));

  // Căutăm primul keyword care se potrivește
  for (const userKeyword of userKeywords) {
    if (lowerDesc.includes(userKeyword.keyword.toLowerCase())) {
      console.log(`🎯 User keyword match: "${description}" → "${userKeyword.keyword}" → category ${userKeyword.categoryId}`);
      return userKeyword.categoryId; // Returnăm direct categoryId
    }
  }

  return null; // Nu s-a găsit niciun keyword personalizat
}

/**
 * Sugerează keyword din descrierea tranzacției
 *
 * Extrage merchant-ul/numele principal din descriere pentru a fi salvat ca keyword.
 * Exemple:
 * - "COFIDIS SPAIN" → "cofidis"
 * - "MEGA IMAGE BUCURESTI" → "mega image"
 * - "Netflix.com" → "netflix"
 *
 * @param description - Descrierea tranzacției
 * @returns Keyword sugerat (lowercase, trimmed)
 */
export function suggestKeywordFromDescription(description: string): string {
  if (!description) return "";

  // Remove common suffixes and cleanup
  let keyword = description
    .toLowerCase()
    .trim()
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\.com|\.ro|\.md/g, "")
    // Remove locations
    .replace(/\b(bucuresti|cluj|iasi|timisoara|brasov|constanta|romania|spain|madrid|barcelona)\b/g, "")
    // Remove numbers and special chars
    .replace(/[0-9]/g, "")
    .replace(/[^a-z\s]/g, " ")
    // Remove extra spaces
    .replace(/\s+/g, " ")
    .trim();

  // Get first 1-2 words (merchant name usually)
  const words = keyword.split(" ").filter(w => w.length > 2);
  keyword = words.slice(0, 2).join(" ");

  return keyword;
}
