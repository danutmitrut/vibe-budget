/**
 * API ROUTE: REGISTER (Înregistrare utilizator nou)
 *
 * EXPLICAȚIE:
 * Acest fișier gestionează înregistrarea utilizatorilor noi.
 *
 * PROCES:
 * 1. User completează formularul (email, parolă, nume)
 * 2. Request-ul vine aici (POST /api/auth/register)
 * 3. Validăm datele
 * 4. Criptăm parola
 * 5. Salvăm userul în baza de date
 * 6. Returnăm token JWT + datele userului
 *
 * ANALOGIE:
 * E ca să te înscrii la sală:
 * - Completezi formularul de înscriere
 * - Îți fac cardul de membru (JWT token)
 * - De acum poți intra în sală (acces la aplicație)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import { CATEGORY_RULES } from "@/lib/auto-categorization/categories-rules";
import { sendVerificationEmail } from "@/lib/email/mailersend";
import { createId } from "@paralleldrive/cuid2";

/**
 * FUNCȚIE HELPER: Returnează culoare pentru fiecare categorie
 */
function getColorForCategory(categoryName: string): string {
  const colorMap: Record<string, string> = {
    Cumpărături: "#ec4899", // Roz (include supermarketuri, online shopping, haine, electronice)
    Transport: "#3b82f6", // Albastru
    Locuință: "#f59e0b", // Portocaliu (include utilități, chirii, renovări)
    Sănătate: "#ef4444", // Roșu
    Divertisment: "#8b5cf6", // Violet
    Subscripții: "#06b6d4", // Cyan
    Educație: "#6366f1", // Indigo
    Venituri: "#22c55e", // Verde deschis
    "Transfer Intern": "#10b981", // Verde (emerald) - neutral, între conturi proprii
    Transferuri: "#64748b", // Slate - transferuri externe
    "Taxe și Impozite": "#dc2626", // Roșu închis
    Cash: "#14b8a6", // Teal
  };

  return colorMap[categoryName] || "#6b7280"; // Default: gri
}

/**
 * POST /api/auth/register
 *
 * Body JSON:
 * {
 *   "email": "dan@example.com",
 *   "password": "parola123",
 *   "name": "Dan Mitrut",
 *   "nativeCurrency": "RON"
 * }
 *
 * Response:
 * {
 *   "user": { id, email, name, nativeCurrency },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // PASUL 1: Citim datele din body
    const body = await request.json();
    const { email, password, name, nativeCurrency } = body;

    // PASUL 2: Validăm datele
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, parolă și nume sunt obligatorii" },
        { status: 400 } // 400 = Bad Request (date invalide)
      );
    }

    // Validare email (format simplu)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalid" },
        { status: 400 }
      );
    }

    // Validare parolă (minim 6 caractere)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parola trebuie să aibă minim 6 caractere" },
        { status: 400 }
      );
    }

    // PASUL 3: Verificăm dacă email-ul există deja
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email-ul este deja înregistrat" },
        { status: 409 } // 409 = Conflict (resursa există deja)
      );
    }

    // PASUL 4: Criptăm parola
    // Parola "parola123" devine "$2a$10$xyz..."
    const hashedPassword = await hashPassword(password);

    // PASUL 4.5: Generăm token de verificare
    const verificationToken = createId(); // Token unic pentru confirmare email

    // PASUL 5: Creăm utilizatorul în baza de date
    const newUser = await db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword, // Salvăm parola criptată!
        name,
        nativeCurrency: nativeCurrency || "RON", // Default: RON
        emailVerified: false, // Contul nu e încă verificat
        verificationToken, // Token pentru confirmare
      })
      .returning(); // Returnează userul creat

    // PASUL 5.1: Creăm categoriile predefinite pentru noul utilizator
    console.log(`📋 Creăm ${CATEGORY_RULES.length} categorii predefinite pentru ${email}...`);

    const systemCategories = CATEGORY_RULES.map((rule) => ({
      userId: newUser[0].id,
      name: rule.categoryName,
      type: rule.categoryName === "Venituri" ? "income" : "expense",
      color: getColorForCategory(rule.categoryName),
      icon: rule.icon || "📋",
      description: rule.description, // Explicația categoriei
      isSystemCategory: true, // Categorie predefinită (nu se poate șterge)
    }));

    await db.insert(schema.categories).values(systemCategories);
    console.log(`✅ ${systemCategories.length} categorii predefinite create!`);

    // PASUL 5.2: Trimitem email de verificare
    console.log(`📧 Trimitem email de verificare către ${email}...`);
    const emailResult = await sendVerificationEmail(email, name, verificationToken);

    if (!emailResult.success) {
      console.error(`⚠️  Email verification failed: ${emailResult.error}`);
      // Nu eșuăm înregistrarea dacă emailul nu merge - userul poate cere resend
    } else {
      console.log(`✅ Email de verificare trimis cu succes!`);
    }

    // PASUL 6: Creăm token JWT
    // IMPORTANT: În producție, ar trebui să NU permitem login până la verificare
    // Pentru DEMO, permitem accesul dar afișăm notificare
    const token = createToken({
      userId: newUser[0].id,
      email: newUser[0].email,
    });

    // PASUL 7: Returnăm succesul
    return NextResponse.json(
      {
        message: "Utilizator creat cu succes! Verifică emailul pentru confirmare.",
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          nativeCurrency: newUser[0].nativeCurrency,
          emailVerified: false, // Informăm frontend-ul
        },
        token, // Token-ul pentru a fi salvat în frontend
      },
      { status: 201 } // 201 = Created (resursă creată cu succes)
    );
  } catch (error: any) {
    // Eroare server (ceva a mers prost)
    console.error("Register error:", error);

    // TEMPORARY: Return detailed error for debugging in Vercel
    return NextResponse.json(
      {
        error: "Eroare la înregistrare",
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}
