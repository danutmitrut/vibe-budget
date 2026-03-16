# Vibe Budget - Convenții pentru Claude

## Despre proiect

Aplicație de buget personal pentru un curs de 2 săptămâni.
Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Drizzle ORM + Supabase.

## Reguli OBLIGATORII

1. **Citește fișierele existente** înainte să generezi cod nou
2. **Copiază stilul exact** din fișierele de referință
3. **Nu adăuga dependențe noi** fără aprobare explicită
4. **Nu modifica structura** folderelor existente
5. **Păstrează comentariile** existente în cod

## Structura proiectului

```
app/
  api/              # API Routes (Next.js Route Handlers)
  dashboard/        # Pagini protejate (autentificare necesară)
  login/            # Pagini publice
  register/
lib/
  ai/               # Integrare Claude AI
  auth/             # JWT utilities, middleware
  db/               # Schema Drizzle, conexiune DB
  utils/            # Helpers (file-parser, etc.)
  auto-categorization/  # Reguli categorii
scripts/            # Scripturi Node.js pentru DB
docs/               # Documentație pentru studenți
```

## Referințe de stil (COPIAZĂ EXACT)

| Tip fișier | Referință |
|------------|-----------|
| API Route | `app/api/transactions/route.ts` |
| Page component | `app/dashboard/page.tsx` |
| Client component | `app/dashboard/transactions/page.tsx` |
| Schema DB | `lib/db/schema.ts` |
| Utility function | `lib/utils/file-parser.ts` |
| Auth middleware | `lib/auth/get-current-user.ts` |

## Naming conventions

| Element | Convenție | Exemplu |
|---------|-----------|---------|
| Fișiere | kebab-case | `file-parser.ts` |
| Foldere | kebab-case | `auto-categorization/` |
| Componente React | PascalCase | `TransactionList` |
| Funcții | camelCase | `formatAmount()` |
| Constante | SCREAMING_SNAKE | `MAX_UPLOAD_SIZE` |
| Interfețe TypeScript | PascalCase cu prefix I opțional | `Transaction` sau `ITransaction` |
| Types | PascalCase | `TransactionType` |

## TypeScript

```typescript
// CORECT - cu interfață explicită
interface Transaction {
  id: string;
  date: string;        // Format: YYYY-MM-DD
  amount: number;
  description: string;
  categoryId?: string; // ? = opțional
}

// GREȘIT - fără tipuri
const transaction = {
  id: "123",
  date: "2025-01-01",
  // ...
}
```

Reguli:
- `strict: true` activat
- NU folosim `any` - folosim `unknown` dacă e necesar
- Interfețe pentru toate obiectele
- Tipuri explicite pentru parametri funcții

## API Routes pattern

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    // 1. Autentificare
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Logică
    const data = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, user.id));

    // 3. Răspuns
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API_NAME] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## React Components pattern

```typescript
// Client component (cu interactivitate)
"use client";

import { useState, useEffect } from "react";

interface Props {
  initialData?: Transaction[];
}

export default function TransactionList({ initialData = [] }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      {/* UI here */}
    </div>
  );
}
```

## Tailwind CSS

Clase folosite în proiect:
- Layout: `container`, `mx-auto`, `px-4`, `py-8`
- Flex: `flex`, `items-center`, `justify-between`, `gap-4`
- Grid: `grid`, `grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`
- Text: `text-sm`, `text-lg`, `font-bold`, `text-gray-600`
- Buttons: `bg-blue-500`, `hover:bg-blue-600`, `text-white`, `px-4`, `py-2`, `rounded`
- Cards: `bg-white`, `shadow`, `rounded-lg`, `p-4`

## Database (Drizzle ORM)

```typescript
// Schema pattern
export const tableName = pgTable("table_name", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  // alte câmpuri
});

// Query pattern
const results = await db
  .select()
  .from(schema.tableName)
  .where(eq(schema.tableName.userId, userId))
  .orderBy(desc(schema.tableName.createdAt));
```

## Date handling

- Format date în DB: `YYYY-MM-DD` (string)
- NU folosim timestamp pentru date simple
- Conversie Excel serial → date: vezi `lib/utils/file-parser.ts`

```typescript
// CORECT
const date = "2025-01-15";

// GREȘIT
const date = new Date(); // Nu stoca Date objects direct
```

## Diacritice românești

Proiectul suportă ă, â, î, ș, ț.
Vezi `lib/utils/file-parser.ts` pentru handling encoding issues.

## Error handling

```typescript
// În API Routes
try {
  // logică
} catch (error) {
  console.error("[CONTEXT] Error:", error);
  return NextResponse.json(
    { error: "Descriptive error message" },
    { status: 500 }
  );
}

// În componente
const [error, setError] = useState<string | null>(null);
// Afișează eroarea în UI
{error && <div className="text-red-500">{error}</div>}
```

## NU face următoarele

- ❌ Nu adăuga biblioteci noi fără aprobare
- ❌ Nu schimba structura folderelor
- ❌ Nu modifica schema DB fără migrație
- ❌ Nu folosi `any` în TypeScript
- ❌ Nu ignora erorile TypeScript
- ❌ Nu șterge comentariile existente
- ❌ Nu schimba naming conventions
