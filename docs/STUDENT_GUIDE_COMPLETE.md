# 🎓 Ghid Complet Vibe Budget - Curs 2 Săptămâni

## Despre Acest Ghid

Acest document conține **tot ce ai nevoie** pentru a construi aplicația Vibe Budget de la zero în **2 săptămâni** (10 zile lucrătoare).

**Ce vei învăța:**
- ✅ Next.js 16 (App Router, Server Components, API Routes)
- ✅ React 19 (hooks, state management)
- ✅ TypeScript (type safety, interfaces)
- ✅ Tailwind CSS 4 (modern styling)
- ✅ PostgreSQL + Drizzle ORM (database management)
- ✅ Autentificare JWT + bcrypt
- ✅ Upload & Parsing Excel/CSV (cu diacritice românești)
- ✅ Integrare AI (Claude Sonnet 4.5)
- ✅ Deploy Vercel + Supabase (production)

---

## 📅 Plan Curriculum - 2 Săptămâni

### **Săptămâna 1: Fundamente + Autentificare**

#### **Ziua 1-2: Setup & Fundamente Next.js**
- Setup proiect Next.js 16
- Configurare TypeScript + Tailwind CSS
- Înțelegere App Router vs Pages Router
- Crearea primelor pagini (/, /login, /register)

**Resurse:**
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

#### **Ziua 3: Database Setup & Schema**
- Înțelegere Drizzle ORM
- Design schema database (users, transactions, categories, banks)
- Setup local SQLite pentru development
- Script-uri pentru inițializare

**Fișiere cheie:**
- `lib/db/schema.ts` - Database schema
- `lib/db/index.ts` - Database connection
- `scripts/init-db.ts` - Initialize database

#### **Ziua 4-5: Autentificare Custom**
- JWT (JSON Web Tokens) - ce sunt și cum funcționează
- Bcrypt - hashing passwords
- API Routes pentru register/login
- Middleware pentru autentificare
- Protected routes

**Fișiere cheie:**
- `lib/auth/utils.ts` - JWT utilities
- `lib/auth/get-current-user.ts` - Auth middleware
- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`

**Concepte importante:**
```typescript
// JWT Token Structure
{
  userId: "user_123",
  email: "dan@example.com",
  exp: 1234567890 // Expiration timestamp
}

// Password Hashing (bcrypt)
const hash = await bcrypt.hash("password123", 10);
const isValid = await bcrypt.compare("password123", hash);
```

---

### **Săptămâna 2: Features + Deployment**

#### **Ziua 6: CRUD Tranzacții**
- API Routes pentru transactions (GET, POST, PATCH, DELETE)
- Listing tranzacții cu filtre
- Categorii & Bănci
- Bulk operations

**Fișiere cheie:**
- `app/api/transactions/route.ts`
- `app/api/categories/route.ts`
- `app/api/banks/route.ts`

#### **Ziua 7: Upload Excel/CSV** ⭐ **CEL MAI COMPLEX**
- Papa Parse (CSV) + XLSX (Excel)
- Excel Serial Numbers conversion
- Diacritice românești (Ă → Ä encoding fix)
- Auto-categorizare

**Fișiere cheie:**
- `lib/utils/file-parser.ts` - **CORE PARSING LOGIC**
- `app/dashboard/upload/page.tsx`

**Resurse:**
- [📖 EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md) - **CITEȘTE OBLIGATORIU!**

**Probleme comune:**
1. **Excel Serial Numbers**: Excel salvează datele ca `45996.33` (zile de la 1 ian 1900)
2. **Diacritice**: Excel exportă "Sumă" ca "SumÄ " (cu Ä + spațiu!)
3. **Schema Date Type**: Folosim `date` (string YYYY-MM-DD), NU `timestamp`!

#### **Ziua 8: Dashboard & Reports**
- Statistici (total income/expenses, top categories)
- Charts cu Victory (React charting library)
- Pivot reports (group by month/category)
- Date filtering

**Fișiere cheie:**
- `app/dashboard/page.tsx`
- `app/dashboard/reports/page.tsx`
- `app/api/reports/stats/route.ts`

#### **Ziua 9: AI Integration** ⭐ **FEATURE PREMIUM**
- Claude AI integration (Anthropic SDK)
- Financial Health Score (0-10 cu grade A+ to F)
- Budget Recommendations
- Anomaly Detection

**Fișiere cheie:**
- `lib/ai/claude.ts`
- `app/api/ai/health-score/route.ts`
- `app/api/ai/budget-recommendations/route.ts`
- `app/api/ai/anomaly-detection/route.ts`

**Cost AI:**
- Claude Sonnet 4.5: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Pentru development: ~$0.50-$1/lună (usage minimal)

#### **Ziua 10: Deployment** ⭐ **PRODUCTION READY**
- Setup Supabase PostgreSQL (Transaction Pooler!)
- Environment variables (Vercel)
- Deploy pe Vercel
- Testing în producție

**Resurse:**
- [📖 DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md) - **GHID PAS-CU-PAS**

**Checklist deployment:**
- [ ] Supabase project creat (region: Ireland)
- [ ] Database migration rulată (SQL schema)
- [ ] Transaction Pooler connection string (port 6543!)
- [ ] Environment variables în Vercel
- [ ] Build successful (fără TypeScript errors)
- [ ] Testing: register → upload Excel → view reports

---

## 🔧 Setup Inițial (Ziua 1)

### 1. Prerequisites

**Software necesar:**
```bash
# Node.js 18+ (verifică versiunea)
node --version  # Trebuie >= 18.17

# npm (vine cu Node.js)
npm --version

# Git
git --version

# Editor recomandat: VS Code
code --version
```

**Instalare Node.js:**
- Windows: [nodejs.org](https://nodejs.org/)
- macOS: `brew install node`
- Linux: `sudo apt install nodejs npm`

### 2. Crearea Proiectului

```bash
# Clonează repository-ul
git clone https://github.com/yourusername/vibe-budget.git
cd vibe-budget

# Instalează dependințele
npm install

# Copiază environment variables
cp .env.example .env.local
```

### 3. Configurare `.env.local`

```env
# JWT Secret (generează cu: openssl rand -base64 32)
JWT_SECRET=r+14vbL8ssEAZRKN5QZuWCxEGVx/xUyOLS1PatjFvHs=

# Anthropic Claude API (get from: https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Database - Local SQLite (pentru development)
# (nu trebuie setat pentru local, e default)

# Pentru production (Supabase) - vezi Ziua 10
# DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Resend Email (pentru forgot password - opțional)
# RESEND_API_KEY=re_YOUR_KEY_HERE
```

### 4. Inițializare Database

```bash
# Creează schema SQLite local
npx tsx scripts/init-db.ts

# Creează user de test
npx tsx scripts/create-test-user.ts

# (Opțional) Adaugă tranzacții demo
npx tsx scripts/add-december-to-existing-user.ts test@vibe-budget.com
```

### 5. Start Development Server

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000)

**Credentials test:**
- Email: `test@vibe-budget.com`
- Password: `password123`

---

## 📚 Concepte Cheie de Înțeles

### 1. Next.js App Router

**Diferența față de Pages Router:**

```
app/                         pages/
├── page.tsx                ├── index.tsx
├── dashboard/              ├── dashboard.tsx
│   └── page.tsx           └── api/
└── api/                        └── transactions.ts
    └── transactions/
        └── route.ts
```

**App Router (Next.js 13+):**
- Folder-based routing
- Server Components by default
- Layout support built-in
- Loading/error states automatic

### 2. Server vs Client Components

```typescript
// SERVER COMPONENT (default)
// - Rulează pe server
// - Poate accesa direct database
// - Nu poate folosi useState, useEffect, onClick
export default async function Page() {
  const data = await db.select().from(users); // OK!
  return <div>{data.length}</div>;
}

// CLIENT COMPONENT
// - Rulează în browser
// - Poate folosi hooks (useState, useEffect)
// - NU poate accesa direct database
"use client";
export default function Page() {
  const [count, setCount] = useState(0); // OK!
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 3. API Routes (Route Handlers)

```typescript
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Handle GET /api/transactions
  return NextResponse.json({ transactions: [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST /api/transactions
  return NextResponse.json({ success: true }, { status: 201 });
}
```

### 4. Drizzle ORM

**Schema Definition:**
```typescript
import { pgTable, text, decimal, date } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date", { mode: 'string' }).notNull(), // YYYY-MM-DD
  amount: decimal("amount", { precision: 10, scale: 2, mode: 'number' }),
  description: text("description").notNull(),
});
```

**Query Examples:**
```typescript
// SELECT * FROM transactions WHERE user_id = '123'
const data = await db
  .select()
  .from(schema.transactions)
  .where(eq(schema.transactions.userId, "123"));

// INSERT INTO transactions
await db.insert(schema.transactions).values({
  id: "tx_123",
  userId: "user_123",
  date: "2025-12-13",
  amount: 45.99,
  description: "MEGA IMAGE"
});
```

### 5. TypeScript Basics

**Type Safety:**
```typescript
// Interface pentru Transaction
interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
}

// Function cu tipuri
function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} RON`;
}

// TypeScript previne erori:
formatAmount("100"); // ❌ Error: string not assignable to number
formatAmount(100);   // ✅ OK
```

---

## 🐛 Debugging & Troubleshooting

### Browser DevTools

**Console Tab:**
```javascript
// În cod (pentru debug):
console.log('[DEBUG] Parsed transactions:', transactions);

// În browser:
// - F12 sau Cmd+Option+I (Mac)
// - Console tab
// - Vezi log-urile
```

**Network Tab:**
- Vezi API requests (POST /api/transactions)
- Verifică request payload (ce trimiți)
- Verifică response (ce primești)

**React DevTools:**
- Instalează extensia: [React Developer Tools](https://react.dev/learn/react-developer-tools)
- Vezi component tree
- Inspectează props & state

### Common Errors

#### 1. "Module not found"
```bash
# Soluție: Reinstalează dependențele
rm -rf node_modules package-lock.json
npm install
```

#### 2. "Port 3000 already in use"
```bash
# Soluție: Kill process pe port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 3. TypeScript Errors
```bash
# Verifică tipurile
npm run build

# Cele mai comune:
# - "Type 'string' is not assignable to type 'number'"
#   → Verifică tipurile în interface
# - "Property 'xyz' does not exist"
#   → Verifică că ai definit proprietatea în interface
```

#### 4. Database Errors
```bash
# Re-inițializează database
rm -f local.db
npx tsx scripts/init-db.ts
npx tsx scripts/create-test-user.ts
```

---

## 🎯 Exerciții Practice

### Exercițiu 1: Adaugă Câmp Nou (Difficulty: ⭐)

**Task:** Adaugă câmpul `notes` (text opțional) la tranzacții.

**Pași:**
1. Modifică schema (`lib/db/schema.ts`):
```typescript
notes: text("notes") // Opțional, fără .notNull()
```

2. Modifică interfața (`app/dashboard/transactions/page.tsx`):
```typescript
interface Transaction {
  // ... alte câmpuri
  notes?: string; // ? = opțional
}
```

3. Adaugă în UI (tabel tranzacții):
```typescript
<td>{transaction.notes || "-"}</td>
```

4. Testează!

### Exercițiu 2: Filtrare pe Interval de Date (Difficulty: ⭐⭐)

**Task:** Adaugă filtre pentru "Data de start" și "Data de final".

**Pași:**
1. Adaugă state în `transactions/page.tsx`:
```typescript
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
```

2. Adaugă inputs în UI:
```typescript
<input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>
<input
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
/>
```

3. Modifică fetch pentru a include parametrii:
```typescript
const params = new URLSearchParams();
if (startDate) params.append("startDate", startDate);
if (endDate) params.append("endDate", endDate);

const url = `/api/transactions?${params.toString()}`;
```

4. API Route deja suportă filtrele (vezi `route.ts`)!

### Exercițiu 3: Categorie Nouă Auto-Detect (Difficulty: ⭐⭐⭐)

**Task:** Adaugă auto-categorizare pentru "Netflix" → "Streaming".

**Pași:**
1. Creează categoria "Streaming" în UI sau database
2. Modifică `lib/auto-categorization/categories-rules.ts`:
```typescript
// Găsește funcția autoCategorizeByCategoryName
if (desc.includes("netflix") || desc.includes("spotify")) {
  return "Streaming";
}
```

3. Upload un CSV cu "Netflix" în descriere
4. Verifică că e categorizat automat!

---

## 📖 Resurse Suplimentare

### Documentație Oficială
- [Next.js Docs](https://nextjs.org/docs) - **CITEȘTE ZILNIC**
- [React Docs](https://react.dev/) - Hooks, Components
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)

### Video Tutorials (Recomandate)
- [Next.js 14 Full Course](https://www.youtube.com/watch?v=wm5gMKuwSYk) - Traversy Media
- [TypeScript for Beginners](https://www.youtube.com/watch?v=d56mG7DezGs) - Programming with Mosh
- [Tailwind CSS Crash Course](https://www.youtube.com/watch?v=UBOj6rqRUME) - Traversy Media

### Ghidurile Acestui Proiect
1. **[EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md)** - Parsare Excel cu diacritice
2. **[DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md)** - Deploy Vercel + Supabase
3. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Erori comune

---

## ✅ Checklist Final

### Săptămâna 1 - Fundamente
- [ ] Next.js project setup
- [ ] TypeScript configured
- [ ] Tailwind CSS working
- [ ] Database schema created
- [ ] Register/Login functional
- [ ] Protected routes working
- [ ] Dashboard page created

### Săptămâna 2 - Features
- [ ] CRUD tranzacții complet
- [ ] Upload Excel/CSV funcțional
- [ ] Categorizare automată
- [ ] Dashboard cu statistici
- [ ] Rapoarte & Charts
- [ ] AI Integration (Health Score)
- [ ] Deploy Vercel + Supabase
- [ ] Testing în producție

---

## 🎓 Sfaturi pentru Succes

### 1. **Citește Codul Existent**
Nu începe să scrii cod nou fără să înțelegi ce există deja. Deschide fișierele și citește comentariile.

### 2. **Debug cu console.log()**
Când ceva nu merge, adaugă log-uri:
```typescript
console.log('[DEBUG] Data received:', data);
console.log('[DEBUG] Type:', typeof data);
```

### 3. **Folosește TypeScript Errors**
TypeScript te oprește să faci greșeli. Dacă vezi eroare roșie în VS Code, **citește-o**!

### 4. **Testează des**
Nu scrie 100 linii de cod fără să testezi. Testează la fiecare 10-20 linii.

### 5. **Commits Frecvente**
```bash
git add .
git commit -m "Add transaction filter by date"
git push
```

### 6. **Nu Copia-Lipește Fără să Înțelegi**
Dacă copiezi cod de pe Stack Overflow, **citește-l** și **înțelege-l** înainte!

### 7. **Cere Ajutor**
Blocat > 30 minute pe o problemă? Întreabă!

---

## 🚀 Next Steps După Curs

**Extensii posibile:**
1. **Email Notifications** - Notificări săptămânale cu statistici
2. **Recurring Transactions** - Abonamente recurente
3. **Budget Goals** - Setare bugete pe categorie
4. **Multi-user** - Sharing budgets cu familia
5. **Mobile App** - React Native version
6. **Export PDF** - Generate rapoarte PDF

---

**Versiune:** 1.0
**Ultima actualizare:** Decembrie 2025
**Autori:** Dan & Claude Code

**Succes la curs! 🎉**
