# Ghid Complet Deployment: Vibe Budget pe Vercel + Supabase

## 🎯 Obiectiv
Deploy complet al aplicației **Vibe Budget** cu:
- ✅ Next.js pe Vercel (serverless)
- ✅ PostgreSQL pe Supabase
- ✅ Autentificare Custom (JWT + bcrypt)
- ✅ Email cu Resend
- ✅ Upload Excel cu diacritice românești

---

## 📋 Pași Completi (Testați și Funcționali)

### 1. Setup Supabase Database

#### A. Creează Proiect
1. Mergi la https://supabase.com
2. Creează cont / Log in
3. **New Project** → numele `vibe-budget-prod`
4. Alege regiunea: **Europe West (Ireland)** - `eu-west-1`
5. Generează parolă puternică (salvează-o!)

#### B. Obține Connection String
1. În Supabase Dashboard → **Project Settings** → **Database**
2. Scroll la **Connection String**
3. Selectează **Transaction Pooler** (NU Direct Connection!)
4. Copiază connection string-ul:
```
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANT**: Folosește **Transaction Pooler** (port `6543`), NU Direct Connection!
- Direct Connection = IPv6 → Nu funcționează pe Vercel
- Transaction Pooler = IPv4 → Funcționează perfect pe Vercel

#### C. Rulează Migrația pentru Schema Corectă

Deschide **SQL Editor** în Supabase și rulează:

```sql
-- Migration: Fix date column type from TIMESTAMP to DATE
ALTER TABLE transactions ADD COLUMN date_new DATE;
UPDATE transactions SET date_new = date::date WHERE date IS NOT NULL;
ALTER TABLE transactions DROP COLUMN date;
ALTER TABLE transactions RENAME COLUMN date_new TO date;
ALTER TABLE transactions ALTER COLUMN date SET NOT NULL;
```

**De ce**: Schema folosește `date` (doar YYYY-MM-DD), nu `timestamp with timezone`.

### 2. Setup Resend Email

#### A. Creează Cont Resend
1. Mergi la https://resend.com
2. Sign up cu email
3. Verifică email-ul

#### B. Adaugă Domeniu (Opțional)
Pentru producție:
1. **Domains** → **Add Domain**
2. Adaugă domeniul tău (ex: `vibe-budget.com`)
3. Configurează DNS records (MX, TXT, CNAME)

Pentru development/testing:
- Poți folosi adresa de test Resend fără domeniu propriu

#### C. Generează API Key
1. **API Keys** → **Create API Key**
2. Nume: `vibe-budget-production`
3. Copiază cheia (începe cu `re_...`)

### 3. Setup Environment Variables

#### A. Creează `.env.local` (Local Development)

```env
# Database (Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_SUPABASE_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# JWT Secret (generează cu: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here

# Resend Email API Key
RESEND_API_KEY=re_your_resend_api_key_here

# Anthropic API (pentru AI features)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Generare JWT Secret**:
```bash
openssl rand -base64 32
```

#### B. Configurează în Vercel

1. Mergi la https://vercel.com
2. Import repository din GitHub
3. **Settings** → **Environment Variables**
4. Adaugă fiecare variabilă:
   - `DATABASE_URL` = Connection string Supabase (Transaction Pooler!)
   - `JWT_SECRET` = Secret generat cu openssl
   - `RESEND_API_KEY` = Cheia Resend
   - `ANTHROPIC_API_KEY` = Cheia Claude AI (opțional)

### 4. Deploy pe Vercel

#### A. Connect GitHub Repository

```bash
# Dacă nu ai făcut deja:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vibe-budget.git
git push -u origin main
```

#### B. Import în Vercel
1. https://vercel.com/new
2. **Import Git Repository**
3. Selectează repo-ul `vibe-budget`
4. Framework Preset: **Next.js** (autodetectat)
5. Click **Deploy**

#### C. Verifică Build
- Așteaptă build-ul (~2-3 minute)
- Dacă vezi erori TypeScript, verifică că schema folosește `date` și nu `timestamp`

### 5. Post-Deployment Setup

#### A. Testează Connection Database
1. Deschide aplicația pe Vercel URL (ex: `vibe-budget.vercel.app`)
2. Înregistrează un cont de test
3. Verifică în Supabase → **Table Editor** că userul apare

#### B. Testează Email
1. Click pe "Forgot Password"
2. Introdu email-ul de test
3. Verifică în inbox că primești email de reset

#### C. Testează Upload Excel
1. Download extract Revolut România în format Excel
2. Upload în aplicație
3. Verifică că:
   - Datele apar corecte (05.12.2025, nu 01.01.1970)
   - Sumele sunt corecte
   - Categoriile sunt auto-detectate

---

## 🔧 Troubleshooting Probleme Comune

### Problemă 1: "getaddrinfo ENOTFOUND" la deploy

**Cauză**: Folosești Direct Connection (IPv6, port 5432) în loc de Transaction Pooler.

**Soluție**:
```env
# ❌ GREȘIT:
DATABASE_URL=postgresql://postgres:password@db.PROJECT_REF.supabase.co:5432/postgres

# ✅ CORECT:
DATABASE_URL=postgresql://postgres.PROJECT_REF:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Verificare**: Port-ul TREBUIE să fie `6543`, NU `5432`!

### Problemă 2: Toate datele sunt NULL în database

**Cauză**: Schema folosește `timestamp` dar API trimite string.

**Soluție**:
1. Schimbă schema:
```typescript
// În lib/db/schema.ts
import { date } from "drizzle-orm/pg-core";

date: date("date", { mode: 'string' }).notNull()
```

2. Rulează migrația SQL (vezi secțiunea 1.C)

3. În API, trimite string direct:
```typescript
// În app/api/transactions/route.ts
date: t.date, // String "2025-12-05", NU new Date()
```

### Problemă 3: Date afișate ca "undefined.undefined.null"

**Cauză**: Frontend încearcă să parseze `null` din database.

**Soluție**: Vezi Problemă 2 (fix schema + migration)

### Problemă 4: "0 transactions" când upload Excel Revolut

**Cauză**: Excel exportă diacritice greșit (`Ă` → `Ä`) și nu sunt detectate.

**Soluție**: Verifică că `file-parser.ts` include:
```typescript
const amountKeys = ["sumă", "sumä", "suma", "amount", ...];
const dateKeys = ["început", "änceput", "inceput", ...];
```

**Debugging**:
```javascript
// În browser console după upload:
console.log(Object.keys(excelRow))
// Cauți: "SumÄ " (cu Ä și spațiu) → Adaugă varianta la keywords
```

### Problemă 5: TypeScript errors cu Date comparisons

**Cauză**: După schimbare la `date` (string), queries încă folosesc `Date` objects.

**Soluție**:
```typescript
// ❌ GREȘIT:
const threeMonthsAgo = new Date();
gte(schema.transactions.date, threeMonthsAgo)

// ✅ CORECT:
const threeMonthsAgo = new Date();
const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
gte(schema.transactions.date, threeMonthsAgoStr)
```

### Problemă 6: Vercel build cache nu actualizează env vars

**Cauză**: Vercel cache-uiește build-ul cu env vars vechi.

**Soluție**:
1. În Vercel → **Deployments** → **⋯ Menu** → **Redeploy**
2. **✓ Use existing Build Cache** → ❌ **Debifează!**
3. Click **Redeploy**

---

## 📊 Checklist Final

### Înainte de Deploy
- [ ] `.env.local` creat cu toate variabilele
- [ ] Supabase folosește Transaction Pooler (port 6543)
- [ ] Schema folosește `date`, nu `timestamp`
- [ ] Migrația SQL rulată în Supabase
- [ ] Resend API key generat
- [ ] JWT secret generat cu openssl

### După Deploy
- [ ] Build successful pe Vercel (fără erori TypeScript)
- [ ] Connection database funcționează (înregistrare user)
- [ ] Email-uri trimise cu succes (forgot password)
- [ ] Upload Excel funcționează (date corecte, nu null)
- [ ] Datele afișate corect (05.12.2025, nu 01.01.1970)
- [ ] Categorii auto-detectate din descrieri

### Testing în Producție
- [ ] Înregistrare cont nou
- [ ] Login funcțional
- [ ] Forgot password → primește email
- [ ] Reset password funcționează
- [ ] Upload Excel Revolut → datele apar corect
- [ ] Dashboard afișează statistici
- [ ] Rapoarte pivot funcționează

---

## 🎓 Lecții Cheie pentru Studenți

### 1. Vercel Serverless = IPv4 Only
**De reținut**: Vercel nu suportă IPv6! Folosește Transaction Pooler pentru Supabase.

### 2. Date vs Timestamp în PostgreSQL
**Regulă**: Dacă nu ai nevoie de oră, folosește `DATE` (mai simplu, fără timezone issues).

### 3. Excel Encoding Problems
**Important**: Excel exportă diacritice greșit. Adaugă TOATE variantele posibile.

### 4. Environment Variables în Vercel
**Atenție**: Schimbări în env vars → Redeploy cu cache disabled!

### 5. TypeScript Strictness
**Beneficiu**: TypeScript te oprește să trimiți `Date` când aștepți `string`. Ascultă erorile!

---

## 📚 Resurse Utile

- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Drizzle ORM Date Types](https://orm.drizzle.team/docs/column-types/pg#date)
- [Excel Date Systems](https://support.microsoft.com/en-us/office/date-systems-in-excel)
- [Resend Email Setup](https://resend.com/docs/send-with-nextjs)

---

**Versiune**: 1.0 - Testată și Funcțională
**Data**: Decembrie 2025
**Status**: ✅ Production Ready
