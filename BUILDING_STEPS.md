# 📚 Vibe Budget - Ghid Complet de Construire

**Aplicație demo pentru cursul Vibe Coding**

Acest document descrie pas cu pas cum a fost construită aplicația Vibe Budget - o aplicație completă de management al bugetului personal, cu import de tranzacții bancare, categorizare, rapoarte și grafice.

---

## 📋 Cuprins

1. [Setup Inițial](#1-setup-inițial)
2. [Configurare Bază de Date](#2-configurare-bază-de-date)
3. [Schema Bazei de Date](#3-schema-bazei-de-date)
4. [Autentificare (Register & Login)](#4-autentificare-register--login)
5. [Dashboard Principal](#5-dashboard-principal)
6. [Upload și Parsing Fișiere](#6-upload-și-parsing-fișiere)
7. [Management Categorii](#7-management-categorii)
8. [Management Bănci](#8-management-bănci)
9. [Management Valute](#9-management-valute)
10. [Vizualizare și Categorizare Tranzacții](#10-vizualizare-și-categorizare-tranzacții)
11. [Rapoarte și Grafice](#11-rapoarte-și-grafice)
12. [Probleme Întâlnite și Soluții](#12-probleme-întâlnite-și-soluții)

---

## 1. Setup Inițial

### 1.1. Creare Proiect Next.js

```bash
npx create-next-app@latest vibe-budget
```

**Opțiuni selectate:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ❌ src/ directory
- ✅ Turbopack

### 1.2. Structura Proiectului

```
vibe-budget/
├── app/
│   ├── api/              # API Routes (backend)
│   ├── dashboard/        # Pagini dashboard
│   ├── login/            # Pagină login
│   ├── register/         # Pagină înregistrare
│   ├── globals.css       # Stiluri globale
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Landing page
├── db/
│   ├── schema.ts         # Schema Drizzle ORM
│   └── index.ts          # Conexiune la baza de date
└── lib/
    └── utils/            # Funcții utilitare
```

### 1.3. Dependențe Instalate

```json
{
  "dependencies": {
    "next": "16.0.7",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "drizzle-orm": "^0.45.0",
    "better-sqlite3": "^12.5.0",
    "@paralleldrive/cuid2": "^3.0.4",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "papaparse": "^5.5.3",
    "xlsx": "^0.18.5",
    "recharts": "^3.5.1",
    "date-fns": "^4.1.0"
  }
}
```

**Explicații pachete:**
- `drizzle-orm` + `better-sqlite3`: Baza de date SQLite cu ORM
- `bcryptjs`: Criptare parole
- `jsonwebtoken`: Autentificare cu JWT
- `papaparse` + `xlsx`: Parsing fișiere CSV și Excel
- `recharts`: Grafice interactive
- `date-fns`: Manipulare date

---

## 2. Configurare Bază de Date

### 2.1. Setup Drizzle ORM

**Fișier: `db/index.ts`**

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database("vibe-budget.db");
export const db = drizzle(sqlite);
```

**Explicație:**
- `better-sqlite3`: Bază de date SQLite (un fișier local, nu necesită server)
- `drizzle`: ORM (Object-Relational Mapping) - transformă obiecte JS în query-uri SQL

### 2.2. Configurare Drizzle Kit

**Fișier: `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "vibe-budget.db",
  },
});
```

### 2.3. Scripts NPM

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Comenzi:**
- `npm run db:generate`: Generează migrări SQL din schema
- `npm run db:push`: Aplică schema direct în DB (development)
- `npm run db:studio`: Interfață web pentru vizualizare date

---

## 3. Schema Bazei de Date

### 3.1. Tabela Users

```typescript
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  nativeCurrency: text("native_currency").notNull().default("RON"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Explicație:**
- `id`: Cheie primară (CUID2 - ID unic sortabil cronologic)
- `email`: Unic, folosit pentru login
- `password`: Hash bcrypt (NICIODATĂ în plaintext!)
- `nativeCurrency`: Moneda principală a utilizatorului (RON, EUR, USD, etc.)

### 3.2. Tabela Banks

```typescript
export const banks = sqliteTable("banks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // ING, BCR, Revolut, PayPal, etc.
  color: text("color").notNull().default("#3B82F6"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Explicație:**
- `userId`: Foreign key către users (o bancă aparține unui utilizator)
- `type`: Tipul băncii (ING, BCR, etc.) - folosit pentru logica de import
- `color`: Culoare hex pentru grafice

### 3.3. Tabela Categories

```typescript
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // income sau expense
  icon: text("icon").notNull().default("📁"),
  color: text("color").notNull().default("#6B7280"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Explicație:**
- `type`: "income" (venit) sau "expense" (cheltuială)
- `icon`: Emoji pentru vizualizare
- Fiecare user are categoriile sale personalizate

### 3.4. Tabela Currencies

```typescript
export const currencies = sqliteTable("currencies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull(), // RON, EUR, USD, etc.
  symbol: text("symbol").notNull(), // lei, €, $
  name: text("name").notNull(),
  exchangeRateToNative: real("exchange_rate_to_native").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Explicație:**
- `exchangeRateToNative`: Rata de schimb față de moneda nativă
- Exemplu: Dacă moneda nativă e RON și ai EUR, rate = 5.0 (1 EUR = 5 RON)

### 3.5. Tabela Transactions

```typescript
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id),
  bankId: text("bank_id").references(() => banks.id),
  categoryId: text("category_id").references(() => categories.id),

  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("RON"),
  amountInNativeCurrency: real("amount_in_native_currency").notNull(),

  type: text("type").notNull(), // income sau expense
  rawData: text("raw_data"), // JSON cu datele originale din CSV

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Explicație:**
- `amount`: Suma în moneda originală
- `amountInNativeCurrency`: Suma convertită în moneda nativă (pentru rapoarte)
- `rawData`: Păstrăm datele originale din CSV pentru debugging
- `categoryId`: Poate fi NULL (tranzacție necategorizată)

---

## 4. Autentificare (Register & Login)

### 4.1. API Register

**Fișier: `app/api/auth/register/route.ts`**

```typescript
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  // Validare
  if (!email || !password || !name) {
    return Response.json(
      { error: "Toate câmpurile sunt obligatorii" },
      { status: 400 }
    );
  }

  // Verificare email existent
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return Response.json(
      { error: "Email-ul este deja folosit" },
      { status: 400 }
    );
  }

  // Hash parolă (bcrypt - 10 rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Creare user
  const [newUser] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
  }).returning();

  // Generare JWT token
  const token = jwt.sign(
    { userId: newUser.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return Response.json({
    message: "Cont creat cu succes",
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  });
}
```

**Concepte importante:**

1. **Hashing cu bcrypt:**
   - NICIODATĂ nu salvăm parola în plaintext
   - bcrypt adaugă "salt" (date random) pentru fiecare parolă
   - Hash-ul e ireversibil (nu poți obține parola originală)

2. **JWT (JSON Web Token):**
   - Token semnat criptografic
   - Conține `userId` și expiră în 7 zile
   - Clientul îl trimite în header `Authorization: Bearer TOKEN`

### 4.2. API Login

```typescript
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Găsire user
  const [user] = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return Response.json(
      { error: "Email sau parolă incorecte" },
      { status: 401 }
    );
  }

  // Verificare parolă
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return Response.json(
      { error: "Email sau parolă incorecte" },
      { status: 401 }
    );
  }

  // Generare token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return Response.json({
    message: "Autentificare reușită",
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
```

### 4.3. Middleware de Autentificare

**Funcție reutilizabilă pentru verificare JWT:**

```typescript
export function verifyAuth(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}
```

**Folosire:**

```typescript
export async function GET(request: Request) {
  const userId = verifyAuth(request);

  if (!userId) {
    return Response.json(
      { error: "Neautorizat" },
      { status: 401 }
    );
  }

  // Continuă cu logica...
}
```

---

## 5. Dashboard Principal

### 5.1. Pagina Dashboard

**Fișier: `app/dashboard/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  nativeCurrency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Token invalid");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return <div>Se încarcă...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Vibe Budget</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">
          Bine ai venit, {user?.name}! 🎉
        </h2>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/dashboard/upload" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">📤</div>
            <h3 className="text-lg font-semibold mb-2">Importă tranzacții</h3>
            <p className="text-gray-600">Încarcă fișiere CSV sau Excel</p>
          </Link>

          <Link href="/dashboard/transactions" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Tranzacții</h3>
            <p className="text-gray-600">Vezi și categorizează tranzacții</p>
          </Link>

          <Link href="/dashboard/reports" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold mb-2">Rapoarte</h3>
            <p className="text-gray-600">Statistici și grafice</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

**Concepte:**

1. **Client Component (`"use client"`):**
   - Necesară pentru hooks (useState, useEffect)
   - Rulează în browser, nu pe server

2. **Verificare Autentificare:**
   - Token salvat în `localStorage`
   - Verificat la fiecare încărcare pagină
   - Redirect la `/login` dacă token invalid

3. **Protecție Rute:**
   - Toate paginile dashboard verifică token-ul
   - User neautentificat e redirecționat automat

---

## 6. Upload și Parsing Fișiere

### 6.1. API Upload

**Fișier: `app/api/transactions/upload/route.ts`**

```typescript
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bankId = formData.get("bankId") as string;

  if (!file) {
    return Response.json({ error: "Fișier lipsă" }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(fileBuffer);

  let transactions = [];

  // Detectare tip fișier
  if (file.name.endsWith(".csv")) {
    transactions = parseCSV(buffer.toString());
  } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
    transactions = parseExcel(buffer);
  } else {
    return Response.json(
      { error: "Format fișier invalid" },
      { status: 400 }
    );
  }

  // Salvare în baza de date
  const results = await saveTransactions(userId, bankId, transactions);

  return Response.json({
    message: `${results.success} tranzacții importate cu succes`,
    imported: results.success,
    failed: results.failed,
  });
}
```

### 6.2. Parsing CSV (PapaParser)

```typescript
function parseCSV(content: string) {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row: any) => ({
    date: parseDate(row["Data"]),
    description: row["Descriere"] || row["Detalii"],
    amount: parseFloat(row["Suma"].replace(",", ".")),
    currency: row["Moneda"] || "RON",
    type: determineType(row),
  }));
}
```

**Explicații:**
- `header: true`: Prima linie = nume coloane
- `skipEmptyLines`: Ignoră linii goale
- Mapăm coloanele CSV la structura noastră

### 6.3. Parsing Excel (XLSX)

```typescript
function parseExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(sheet);

  return jsonData.map((row: any) => ({
    date: excelDateToJSDate(row["Data"]),
    description: row["Descriere"],
    amount: row["Suma"],
    currency: row["Moneda"] || "RON",
    type: determineType(row),
  }));
}
```

**Problemă Excel:**
- Excel salvează datele ca numere seriale (ex: 45234 = 01/01/2024)
- Trebuie convertite în format JavaScript Date

```typescript
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info;
}
```

### 6.4. Determinare Tip Tranzacție

```typescript
function determineType(row: any): "income" | "expense" {
  const amount = parseFloat(row["Suma"]);

  // Verifică semn
  if (amount > 0) return "income";
  if (amount < 0) return "expense";

  // Verifică coloană dedicate
  if (row["Tip"] === "Debit" || row["Tip"] === "Cheltuieli") {
    return "expense";
  }
  if (row["Tip"] === "Credit" || row["Tip"] === "Venituri") {
    return "income";
  }

  return "expense"; // Default
}
```

---

## 7. Management Categorii

### 7.1. API Listare Categorii

```typescript
export async function GET(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userCategories = await db.select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);

  return Response.json({ categories: userCategories });
}
```

### 7.2. API Creare Categorie

```typescript
export async function POST(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { name, type, icon, color } = await request.json();

  // Validare
  if (!name || !type) {
    return Response.json(
      { error: "Nume și tip sunt obligatorii" },
      { status: 400 }
    );
  }

  if (type !== "income" && type !== "expense") {
    return Response.json(
      { error: "Tip invalid" },
      { status: 400 }
    );
  }

  // Verificare duplicat
  const existing = await db.select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.name, name)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return Response.json(
      { error: "Categoria există deja" },
      { status: 400 }
    );
  }

  // Creare
  const [newCategory] = await db.insert(categories).values({
    userId,
    name,
    type,
    icon: icon || "📁",
    color: color || "#6B7280",
  }).returning();

  return Response.json({
    message: "Categorie creată cu succes",
    category: newCategory,
  });
}
```

### 7.3. Pagina Management Categorii

```typescript
"use client";

import { useState, useEffect } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    icon: "📁",
    color: "#6B7280",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setCategories(data.categories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      fetchCategories();
      setFormData({
        name: "",
        type: "expense",
        icon: "📁",
        color: "#6B7280",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Categorii</h1>

      {/* Formular adăugare */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow mb-8">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nume categorie"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-4 py-2 border rounded"
            required
          />

          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="px-4 py-2 border rounded"
          >
            <option value="expense">Cheltuială</option>
            <option value="income">Venit</option>
          </select>

          <input
            type="text"
            placeholder="Icon (emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="px-4 py-2 border rounded"
          />

          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="px-4 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Adaugă Categorie
        </button>
      </form>

      {/* Lista categorii */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category: any) => (
          <div key={category.id} className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{category.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold">{category.name}</h3>
                <span className="text-sm text-gray-600">
                  {category.type === "income" ? "Venit" : "Cheltuială"}
                </span>
              </div>
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: category.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Management Bănci

Similar cu categoriile, dar mai simplu:

```typescript
// API Route: app/api/banks/route.ts

export async function POST(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { name, type, color } = await request.json();

  const [newBank] = await db.insert(banks).values({
    userId,
    name,
    type,
    color: color || "#3B82F6",
  }).returning();

  return Response.json({
    message: "Bancă adăugată cu succes",
    bank: newBank,
  });
}
```

**Tipuri de bănci:**
- ING
- BCR
- BRD
- Revolut
- PayPal
- Transfer (pentru transferuri între conturi)

---

## 9. Management Valute

### 9.1. API Valute

```typescript
export async function POST(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { code, symbol, name, exchangeRateToNative } = await request.json();

  const [newCurrency] = await db.insert(currencies).values({
    userId,
    code,
    symbol,
    name,
    exchangeRateToNative,
  }).returning();

  return Response.json({
    message: "Valută adăugată cu succes",
    currency: newCurrency,
  });
}
```

### 9.2. Conversie Valutară

**La import tranzacții:**

```typescript
async function convertToNativeCurrency(
  amount: number,
  currency: string,
  userId: string
): Promise<number> {
  // Obține moneda user-ului
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Dacă e moneda nativă, nu convertim
  if (currency === user.nativeCurrency) {
    return amount;
  }

  // Găsește rata de schimb
  const [currencyData] = await db.select()
    .from(currencies)
    .where(
      and(
        eq(currencies.userId, userId),
        eq(currencies.code, currency)
      )
    )
    .limit(1);

  if (!currencyData) {
    // Dacă nu există, salvăm suma originală
    return amount;
  }

  return amount * currencyData.exchangeRateToNative;
}
```

**Exemplu:**
- User cu moneda nativă RON
- Tranzacție: 100 EUR
- Rată: 1 EUR = 5 RON
- Conversie: 100 × 5 = 500 RON

---

## 10. Vizualizare și Categorizare Tranzacții

### 10.1. API Listare Tranzacții

```typescript
export async function GET(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  // Query cu JOIN pentru a obține și numele băncii/categoriei
  const userTransactions = await db.select({
    id: transactions.id,
    date: transactions.date,
    description: transactions.description,
    amount: transactions.amount,
    currency: transactions.currency,
    amountInNativeCurrency: transactions.amountInNativeCurrency,
    type: transactions.type,
    bankName: banks.name,
    categoryName: categories.name,
    categoryIcon: categories.icon,
    categoryColor: categories.color,
  })
    .from(transactions)
    .leftJoin(banks, eq(transactions.bankId, banks.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset);

  // Count total pentru paginare
  const [{ count }] = await db.select({
    count: sql<number>`count(*)`
  })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  return Response.json({
    transactions: userTransactions,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
}
```

**Concepte:**

1. **Paginare:**
   - `limit`: Câte tranzacții per pagină (ex: 50)
   - `offset`: De unde începem (ex: pagina 2 = offset 50)
   - Formula: `offset = (page - 1) × limit`

2. **JOIN:**
   - `leftJoin`: Ia și tranzacțiile fără categorie (categoryId = NULL)
   - `innerJoin`: Doar tranzacțiile cu categorie

### 10.2. API Categorizare

```typescript
export async function PATCH(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { transactionId, categoryId } = await request.json();

  // Verifică că tranzacția aparține user-ului
  const [transaction] = await db.select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, userId)
      )
    )
    .limit(1);

  if (!transaction) {
    return Response.json(
      { error: "Tranzacție negăsită" },
      { status: 404 }
    );
  }

  // Update
  await db.update(transactions)
    .set({ categoryId })
    .where(eq(transactions.id, transactionId));

  return Response.json({
    message: "Tranzacție categorizată cu succes",
  });
}
```

### 10.3. Pagina Tranzacții

```typescript
"use client";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [page]);

  const handleCategorize = async (transactionId: string, categoryId: string) => {
    const token = localStorage.getItem("token");
    await fetch("/api/transactions/categorize", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionId, categoryId }),
    });

    fetchTransactions(); // Refresh listă
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Tranzacții</h1>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Descriere</th>
              <th className="px-6 py-3 text-right">Sumă</th>
              <th className="px-6 py-3 text-left">Bancă</th>
              <th className="px-6 py-3 text-left">Categorie</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction: any) => (
              <tr key={transaction.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  {new Date(transaction.date).toLocaleDateString("ro-RO")}
                </td>
                <td className="px-6 py-4">{transaction.description}</td>
                <td className={`px-6 py-4 text-right font-semibold ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "income" ? "+" : "-"}
                  {transaction.amount} {transaction.currency}
                </td>
                <td className="px-6 py-4">{transaction.bankName}</td>
                <td className="px-6 py-4">
                  {transaction.categoryName ? (
                    <span
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: transaction.categoryColor }}
                    >
                      {transaction.categoryIcon} {transaction.categoryName}
                    </span>
                  ) : (
                    <select
                      onChange={(e) => handleCategorize(transaction.id, e.target.value)}
                      className="px-3 py-1 border rounded"
                    >
                      <option value="">Alege categorie...</option>
                      {categories
                        .filter((cat: any) => cat.type === transaction.type)
                        .map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginare */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-4 py-2">
          Pagina {page} din {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Următor
        </button>
      </div>
    </div>
  );
}
```

---

## 11. Rapoarte și Grafice

### 11.1. API Statistici

```typescript
export async function GET(request: Request) {
  const userId = verifyAuth(request);
  if (!userId) {
    return Response.json({ error: "Neautorizat" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "month";
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  // Calculează intervalul de timp
  let dateRange;
  if (startDate && endDate) {
    dateRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  } else if (period === "month") {
    dateRange = {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    };
  } else if (period === "year") {
    dateRange = {
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    };
  }

  // Query totaluri
  const [summary] = await db.select({
    totalIncome: sql<number>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amountInNativeCurrency} ELSE 0 END)`,
    totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amountInNativeCurrency} ELSE 0 END)`,
    transactionCount: sql<number>`COUNT(*)`,
    uncategorizedCount: sql<number>`SUM(CASE WHEN ${transactions.categoryId} IS NULL THEN 1 ELSE 0 END)`,
  })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, dateRange.start),
        lte(transactions.date, dateRange.end)
      )
    );

  const netBalance = summary.totalIncome - summary.totalExpenses;

  // Statistici pe categorii
  const byCategory = await db.select({
    name: categories.name,
    icon: categories.icon,
    color: categories.color,
    type: categories.type,
    amount: sql<number>`SUM(${transactions.amountInNativeCurrency})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, dateRange.start),
        lte(transactions.date, dateRange.end)
      )
    )
    .groupBy(categories.id);

  // Statistici pe bănci
  const byBank = await db.select({
    name: banks.name,
    color: banks.color,
    amount: sql<number>`SUM(${transactions.amountInNativeCurrency})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(transactions)
    .innerJoin(banks, eq(transactions.bankId, banks.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, dateRange.start),
        lte(transactions.date, dateRange.end)
      )
    )
    .groupBy(banks.id);

  return Response.json({
    period: {
      startDate: dateRange.start,
      endDate: dateRange.end,
      type: period,
    },
    summary: {
      totalIncome: summary.totalIncome || 0,
      totalExpenses: summary.totalExpenses || 0,
      netBalance,
      transactionCount: summary.transactionCount || 0,
      uncategorizedCount: summary.uncategorizedCount || 0,
    },
    byCategory,
    byBank,
  });
}
```

**Concepte SQL:**

1. **Agregare (SUM, COUNT):**
   ```sql
   SUM(amount)  -- Sumă totală
   COUNT(*)     -- Număr înregistrări
   AVG(amount)  -- Medie
   ```

2. **CASE WHEN:**
   ```sql
   CASE
     WHEN type = 'income' THEN amount
     ELSE 0
   END
   ```
   Echivalent JavaScript: `type === 'income' ? amount : 0`

3. **GROUP BY:**
   ```sql
   SELECT category, SUM(amount)
   FROM transactions
   GROUP BY category
   ```
   Grupează după categorie și calculează suma pentru fiecare

### 11.2. Pagina Rapoarte cu Grafice

```typescript
"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/reports/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setStats(data);
  };

  if (!stats) return <div>Se încarcă...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Rapoarte și Grafice</h1>

      {/* Filtre Perioadă */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setPeriod("month")}
          className={`px-6 py-3 rounded-lg ${
            period === "month" ? "bg-indigo-600 text-white" : "bg-gray-200"
          }`}
        >
          Luna Curentă
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`px-6 py-3 rounded-lg ${
            period === "year" ? "bg-indigo-600 text-white" : "bg-gray-200"
          }`}
        >
          Anul Curent
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Venituri</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.summary.totalIncome.toFixed(2)} RON
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Cheltuieli</h3>
          <p className="text-3xl font-bold text-red-600">
            {stats.summary.totalExpenses.toFixed(2)} RON
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">Balanță</h3>
          <p className={`text-3xl font-bold ${
            stats.summary.netBalance >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {stats.summary.netBalance.toFixed(2)} RON
          </p>
        </div>
      </div>

      {/* Grafic Categorii (PIE CHART) */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-2xl font-bold mb-4">Distribuție pe Categorii</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={stats.byCategory}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={(entry) => `${entry.icon} ${entry.name}: ${entry.amount.toFixed(2)} RON`}
            >
              {stats.byCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toFixed(2)} RON`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Grafic Bănci (BAR CHART) */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">Distribuție pe Bănci</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={stats.byBank}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} RON`} />
            <Legend />
            <Bar dataKey="amount" fill="#6366f1" name="Sumă totală (RON)">
              {stats.byBank.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Tipuri de grafice:**

1. **PieChart (Grafic circular):**
   - Ideal pentru proporții (% din total)
   - Arată distribuția pe categorii

2. **BarChart (Grafic cu bare):**
   - Ideal pentru comparații între entități
   - Arată sumele per bancă

3. **LineChart (Grafic cu linii):**
   - Ideal pentru evoluție în timp
   - Arată tendințe (cheltuieli pe lună)

---

## 12. Probleme Întâlnite și Soluții

### 12.1. Problema: Culori Text Gri Deschis Ilizibile

**Simptom:**
- Textele cu clasele `text-gray-500`, `text-gray-600` erau gri prea deschis pe fundal alb
- Ilizibile pentru utilizatori

**Cauză:**
- Tailwind CSS v4 generează culori mai deschise decât v3
- Unele elemente moșteneau `color: var(--foreground)` fără clase explicite de culoare

**Soluție:**

1. **Override culori în globals.css:**
```css
@theme {
  --color-gray-500: #1f2937;
  --color-gray-600: #1f2937;
  --color-gray-700: #1f2937;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
}

/* Override cu !important */
.text-gray-500,
.text-gray-600,
.text-gray-700,
.text-gray-800 {
  color: #1f2937 !important;
}
```

2. **Adăugat culori explicite pentru elemente HTML:**
```css
h1, h2, h3, h4, h5, h6 {
  color: #111827;
}

p, span, div {
  color: #171717;
}
```

3. **Înlocuit clase în cod:**
```bash
# Înlocuit text-gray-600 cu text-gray-800
find app -name "*.tsx" -exec sed -i '' 's/text-gray-600/text-gray-800/g' {} +
```

**Lecție:**
- Testează întotdeauna culorile pe dispozitive reale
- Folosește contrast ratios (minimum 4.5:1 pentru WCAG AA)
- DevTools > Inspect > Computed Styles pentru debugging

### 12.2. Problema: Hydration Warnings în Console

**Simptom:**
```
Warning: Prop `lang` did not match. Server: "en" Client: "ro"
```

**Cauză:**
- Next.js renderizează HTML pe server (SSR)
- React "hidrează" HTML-ul în client (adaugă interactivitate)
- Dacă HTML-ul diferă între server și client, apare warning

**Soluție:**

1. **Sincronizat `lang` attribute:**
```typescript
// layout.tsx
<html lang="ro" suppressHydrationWarning>
  <body suppressHydrationWarning>
    {children}
  </body>
</html>
```

2. **Folosit `suppressHydrationWarning`:**
- Suprimă warning-ul pentru diferențe intenționateș
- Folosit doar când știi ce faci!

**Lecție:**
- SSR (Server-Side Rendering) trebuie să producă același HTML ca și CSR (Client-Side Rendering)
- Folosește `useEffect` pentru cod care trebuie să ruleze doar în client

### 12.3. Problema: Next.js Cache Persistent

**Simptom:**
- După modificări în cod, aplicația arăta versiunea veche
- Hard refresh (Cmd+Shift+R) nu rezolva

**Cauză:**
- Next.js 16 cu Turbopack are cache agresiv
- `.next/` folder conține build-uri compilate

**Soluție:**

1. **Delete `.next` folder:**
```bash
rm -rf .next
npm run dev
```

2. **Clear browser cache:**
- Chrome: DevTools > Network > Disable cache (checkbox)
- Sau: Cmd+Shift+Delete > Clear cache

**Lecție:**
- Când faci debugging, dezactivează întotdeauna cache-ul
- În producție, cache-ul e benefic (performance)

### 12.4. Problema: Date Excel Necitibile

**Simptom:**
- Datele din Excel apar ca numere: `45234` în loc de `01/01/2024`

**Cauză:**
- Excel salvează datele ca "serial numbers"
- 45234 = numărul de zile de la 01/01/1900

**Soluție:**

```typescript
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; // secunde în zi
  const date_info = new Date(utc_value * 1000); // milliseconds
  return date_info;
}
```

**Explicație:**
- `25569` = offset între epoch-ul Unix (1970) și epoch-ul Excel (1900)
- `86400` = secunde într-o zi (24 × 60 × 60)

**Lecție:**
- Diferite sisteme au diferite reprezentări ale timpului
- Testează întotdeauna cu date reale, nu mock data

### 12.5. Problema: JWT Token Expirat

**Simptom:**
- Utilizatorul e delogat brusc după câteva zile
- `401 Unauthorized` în API calls

**Cauză:**
- Token-ul JWT expiră după 7 zile
- Nu există refresh token

**Soluție (simplă):**

```typescript
// În client, verifică expirarea înainte de fiecare request
function isTokenExpired(token: string): boolean {
  const decoded = jwt.decode(token) as { exp: number };
  return Date.now() >= decoded.exp * 1000;
}

// În fiecare API call:
const token = localStorage.getItem("token");
if (isTokenExpired(token)) {
  localStorage.removeItem("token");
  router.push("/login");
  return;
}
```

**Soluție (avansată):**

Implementează **Refresh Tokens**:
1. La login, generează 2 tokens:
   - Access Token (expiră în 15 min)
   - Refresh Token (expiră în 7 zile)
2. Când Access Token expiră, folosește Refresh Token pentru a genera unul nou
3. Dacă Refresh Token expiră, user trebuie să se logheze din nou

**Lecție:**
- Securitatea vs UX - găsește balanța
- Pentru aplicații critice, folosește refresh tokens

### 12.6. Problema: SQL Injection Vulnerabilities

**Simptom:**
- Aplicația e vulnerabilă la atacuri SQL injection

**Cod vulnerabil:**

```typescript
// ⚠️ PERICOL! Nu face așa!
const query = `SELECT * FROM users WHERE email = '${email}'`;
db.execute(query);
```

**Atacator poate trimite:**
```
email = "' OR '1'='1"
```

**Query-ul devine:**
```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
-- Returnează TOȚI userii!
```

**Soluție: Folosește ORM (Drizzle):**

```typescript
// ✅ SIGUR - Drizzle face sanitizare automată
const users = await db.select()
  .from(users)
  .where(eq(users.email, email));
```

**Lecție:**
- NICIODATĂ nu concatenezi input-ul utilizatorului în query-uri SQL
- Folosește prepared statements sau ORM-uri

### 12.7. Problema: XSS (Cross-Site Scripting)

**Simptom:**
- Utilizatorul poate injecta JavaScript în aplicație

**Cod vulnerabil:**

```typescript
// ⚠️ PERICOL! Nu face așa!
<div dangerouslySetInnerHTML={{ __html: transaction.description }} />
```

**Atacator poate trimite:**
```javascript
description = "<script>alert('Hacked!')</script>"
```

**Soluție: React face escaping automat:**

```typescript
// ✅ SIGUR - React escape-uiește automat HTML
<div>{transaction.description}</div>
```

**Lecție:**
- React e sigur by default
- Folosește `dangerouslySetInnerHTML` doar când știi CE și DE CE

---

## 🎓 Concepte Cheie pentru Studenți

### 1. **Full-Stack Development**
- **Frontend**: React + Next.js (UI, interacțiune user)
- **Backend**: Next.js API Routes (logică business, baza de date)
- **Database**: SQLite + Drizzle ORM (stocare persistentă)

### 2. **Autentificare și Securitate**
- **Hashing**: bcrypt pentru parole (ireversibil)
- **JWT**: Token-uri pentru sesiuni (stateless)
- **Protecție**: Verificare token la fiecare request API

### 3. **Baze de Date Relaționale**
- **Tabele**: Colecții de date (users, transactions, categories)
- **Foreign Keys**: Relații între tabele (transaction.userId → users.id)
- **JOIN**: Combinarea datelor din mai multe tabele

### 4. **RESTful API**
- **GET**: Citire date
- **POST**: Creare date noi
- **PATCH/PUT**: Actualizare date existente
- **DELETE**: Ștergere date

### 5. **Frontend State Management**
- **useState**: State local (în componenta curentă)
- **useEffect**: Side effects (API calls, subscriptions)
- **localStorage**: Persistență în browser (token JWT)

### 6. **Procesare Fișiere**
- **CSV**: Text cu valori separate de virgulă
- **Excel**: Format binar complex (XLSX)
- **Parsing**: Transformare text → structură de date

### 7. **Vizualizare Date**
- **Recharts**: Librărie pentru grafice React
- **PieChart**: Proporții și distribuții
- **BarChart**: Comparații între entități

---

## 🚀 Pași Următori (Funcționalități Viitoare)

### 1. Categorizare Automată cu AI (OpenAI)
- Folosește GPT-4 pentru a detecta categoria automată pe baza descrierii
- Exemplu: "Kaufland Bucure" → Categorie: "Supermarket"

### 2. Conversii Valutare Automate (Exchange Rates API)
- Integrare cu https://exchangeratesapi.io/
- Update automat al ratelor de schimb zilnic

### 3. Export Rapoarte PDF
- Generare PDF-uri cu grafice și statistici
- Librărie: `pdfkit` sau `puppeteer`

### 4. Notificări Push
- Alerte când cheltuielile depășesc bugetu setat
- Web Push API sau email notifications

### 5. Multi-tenancy (Conturi Familie)
- Partajarea bugetului între mai mulți utilizatori
- Permisiuni și roluri (admin, viewer, editor)

---

## 📚 Resurse pentru Învățare

### Documentații Oficiale:
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **Recharts**: https://recharts.org/en-US/api

### Tutoriale Video:
- **Next.js 16 Tutorial**: Traversy Media (YouTube)
- **React Course**: freeCodeCamp (YouTube)
- **SQL Basics**: Khan Academy (gratuit)

### Cărți:
- "Eloquent JavaScript" (gratuit online)
- "You Don't Know JS" (serie, gratuit pe GitHub)
- "The Pragmatic Programmer" (pentru best practices)

---

## ✅ Concluzie

Ai construit o aplicație completă de management bugetar cu:
- ✅ Autentificare securizată (JWT + bcrypt)
- ✅ Import automat tranzacții (CSV + Excel)
- ✅ Categorizare manuală și organizare
- ✅ Rapoarte vizuale (grafice interactive)
- ✅ Management bănci, categorii, valute
- ✅ Conversii valutare automate

**Ai învățat:**
- Full-stack development (Frontend + Backend + Database)
- API Design (RESTful endpoints)
- Securitate web (authentication, XSS, SQL injection)
- Procesare fișiere (parsing CSV/Excel)
- Vizualizare date (Recharts)
- Debugging (DevTools, error handling)

**Următorii pași:**
1. Testează aplicația cu date reale
2. Deploy pe Vercel (producție)
3. Adaugă funcționalități noi (AI, notificări, etc.)
4. Documentează procesul pentru alți studenți

🎉 **Felicitări pentru parcurgerea acestui ghid!**

---

**Creat pentru cursul Vibe Coding**
© 2025 - Aplicație demo educațională
