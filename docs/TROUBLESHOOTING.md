# 🔧 Troubleshooting Guide: Vibe Budget Deployment

Ghid rapid pentru diagnosticarea și rezolvarea problemelor comune la deploy-ul pe Vercel + Supabase.

---

## 🚨 Erori Frecvente

### 1. `getaddrinfo ENOTFOUND db.*.supabase.co`

```
Error: getaddrinfo ENOTFOUND db.yctmwqwrwoeqdavqjnko.supabase.co
    at GetAddrInfoReqWrap.onlookup [as oncomplete]
```

**Cauză:** Folosești **Direct Connection** (IPv6) în loc de **Transaction Pooler** (IPv4)

**Cum recunoști:**
- Connection string conține: `db.*.supabase.co:5432`
- Vercel nu poate găsi hostname-ul

**Soluție:**

1. **Mergi în Supabase:**
   - Settings → Database → Connection string
   - Method: **"Transaction pooler"** (NU "Direct connection"!)
   - Copiază noul connection string

2. **Actualizează în Vercel:**
   - Settings → Environment Variables
   - Editează `DATABASE_URL`
   - Valoarea trebuie să conțină:
     - Host: `aws-X-region.pooler.supabase.com`
     - Port: `6543`
   - Save

3. **Redeploy:**
   - Deployments → Click pe ultimul → "Redeploy"
   - **DEBIFEAZA** "Use existing Build Cache"

**Verificare:**
```bash
# Connection string CORECT:
postgresql://postgres.PROJECT:pass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Connection string GREȘIT:
postgresql://postgres:pass@db.PROJECT.supabase.co:5432/postgres
```

---

### 2. `prepared statements not supported`

```
Error: prepared statements are not supported in transaction pooling mode
```

**Cauză:** Lipsește `prepare: false` în configurarea postgres client

**Locație problemă:** `lib/db/index.ts`

**Soluție:**

```typescript
// ❌ GREȘIT
const client = postgres(connectionString, {
  max: 1,
  ssl: { rejectUnauthorized: false },
});

// ✅ CORECT
const client = postgres(connectionString, {
  prepare: false,  // ← Adaugă această linie!
  max: 1,
  ssl: { rejectUnauthorized: false },
});
```

**Commit și push:**
```bash
git add lib/db/index.ts
git commit -m "fix: Add prepare: false for Supabase pooler"
git push
```

---

### 3. `Failed query: select ... from users`

```
Error: Failed query: select "id", "email" from "users"
    [cause]: Error: permission denied for table users
```

**Cauză 1: Row Level Security (RLS) este activat**

**Soluție:**
1. Mergi în Supabase SQL Editor
2. Rulează:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE banks DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
```

**Cauză 2: Permissions lipsă**

**Soluție:**
```sql
GRANT ALL ON TABLE users TO postgres;
GRANT ALL ON TABLE banks TO postgres;
GRANT ALL ON TABLE categories TO postgres;
GRANT ALL ON TABLE transactions TO postgres;
GRANT ALL ON TABLE currencies TO postgres;
GRANT ALL ON TABLE subscriptions TO postgres;
GRANT ALL ON TABLE reports TO postgres;
GRANT ALL ON TABLE rate_limits TO postgres;
```

---

### 4. `relation "users" does not exist`

```
Error: relation "users" does not exist
```

**Cauză:** Tabelele nu au fost create în Supabase

**Verificare:**
1. Mergi în Supabase → Table Editor
2. Verifică dacă vezi tabelele: `users`, `banks`, `categories`, etc.

**Soluție:**
1. Mergi în Supabase → SQL Editor
2. Click "New query"
3. Copiază tot SQL-ul din `docs/DEPLOYMENT_GUIDE.md` (secțiunea Pasul 1.2)
4. Click "Run"
5. Verifică că vezi mesaj success pentru fiecare tabel

---

### 5. `Error: missing environment variable DATABASE_URL`

```
Error: Connection string is required
    at postgres (postgres-js)
```

**Cauză:** `DATABASE_URL` nu este setată în Vercel sau `.env.local`

**Soluție pentru Local:**
```bash
# Verifică .env.local
cat .env.local | grep DATABASE_URL

# Dacă lipsește, adaugă:
echo 'DATABASE_URL=postgresql://postgres.PROJECT:PASS@aws-REGION.pooler.supabase.com:6543/postgres' >> .env.local
```

**Soluție pentru Vercel:**
1. Vercel → Settings → Environment Variables
2. Add New Variable:
   - Name: `DATABASE_URL`
   - Value: Connection string de la Supabase (Transaction Pooler!)
   - Environments: Production, Preview, Development
3. Save
4. Redeploy

---

### 6. `Eroare la înregistrare` (Generic 500 Error)

**Cauză:** Multe cauze posibile

**Pași de diagnosticare:**

1. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments
   - Click pe deployment → Functions
   - Click pe `/api/auth/register` → Vezi logs detaliate

2. **Activează Detailed Error Logging:**

În `app/api/auth/register/route.ts`, asigură-te că returnezi detalii:

```typescript
} catch (error: any) {
  console.error("Register error:", error);

  return NextResponse.json(
    {
      error: "Eroare la înregistrare",
      details: error?.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    },
    { status: 500 }
  );
}
```

3. **Verifică toate environment variables:**
```bash
# Local
cat .env.local

# Vercel
# Settings → Environment Variables → Verifică că toate sunt setate
```

4. **Testează conexiunea direct:**

Creează `scripts/test-connection.ts`:
```typescript
import { db } from '../lib/db';
import { users } from '../lib/db/schema';

async function test() {
  try {
    const result = await db.select().from(users).limit(1);
    console.log('✅ Connection OK, users:', result.length);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

test();
```

Rulează:
```bash
npx tsx scripts/test-connection.ts
```

---

### 7. Environment Variables nu se actualizează în Vercel

**Cauză:** Vercel cache-uiește build-ul și env vars

**Simptome:**
- Schimbi `DATABASE_URL` în Vercel
- Deploy-ul nou tot are connection string vechi

**Soluție:**

1. **Șterge COMPLET variabila:**
   - Settings → Environment Variables
   - Găsește `DATABASE_URL`
   - Click **Delete** (NU Edit!)

2. **Adaugă din nou:**
   - Click "Add New"
   - Name: `DATABASE_URL`
   - Value: [connection string nou]
   - Environments: Toate (Production, Preview, Development)
   - Save

3. **Redeploy fără cache:**
   - Deployments → Ultimul deployment
   - 3 puncte → "Redeploy"
   - **DEBIFEAZA** "Use existing Build Cache"
   - Click "Redeploy"

4. **Verifică în logs:**
   - După deploy, testează register
   - Check logs să vezi dacă connection string-ul nou apare

---

## 🔍 Diagnostic Tools

### Tool 1: Verificare Connection String

Adaugă în `lib/db/index.ts` (temporar, pentru debugging):

```typescript
// DEBUG: Log connection string (ascunde parola)
const debugConnStr = connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
console.log(`[DB] Connecting to: ${debugConnStr}`);
```

**Output așteptat:**
```
[DB] Connecting to: postgresql://postgres.yctmwqwrwoeqdavqjnko:****@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**Red flags:**
- Dacă vezi `db.*.supabase.co` → Greșit, folosești Direct Connection!
- Dacă vezi port `5432` → Greșit, ar trebui `6543`!
- Dacă vezi `postgresql:****@` (fără `//postgres`) → Malformat!

---

### Tool 2: Test Database Access

Creează `scripts/test-db-access.ts`:

```typescript
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function testAccess() {
  console.log('🔍 Testing database access...\n');

  // Test 1: Basic query
  try {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Test 1: Basic query - OK');
  } catch (error) {
    console.log('❌ Test 1: Basic query - FAILED');
    console.error(error);
    return;
  }

  // Test 2: List tables
  try {
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Test 2: List tables - OK');
    console.log('Tables found:', tables.rows.length);
    tables.rows.forEach((row: any) => console.log('  -', row.table_name));
  } catch (error) {
    console.log('❌ Test 2: List tables - FAILED');
    console.error(error);
    return;
  }

  // Test 3: Check RLS status
  try {
    const rls = await db.execute(sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('\n✅ Test 3: RLS status - OK');
    rls.rows.forEach((row: any) => {
      const status = row.rowsecurity ? '🔒 ENABLED' : '🔓 DISABLED';
      console.log(`  ${status} ${row.tablename}`);
    });
  } catch (error) {
    console.log('❌ Test 3: RLS status - FAILED');
    console.error(error);
  }

  console.log('\n✅ All tests completed!');
}

testAccess();
```

Rulează:
```bash
npx tsx scripts/test-db-access.ts
```

---

### Tool 3: Vercel Logs Real-Time

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Watch logs real-time
vercel logs --follow
```

În alt terminal, testează înregistrarea și vezi logs live!

---

## 📋 Pre-Deploy Checklist

Înainte de fiecare deploy, verifică:

### Database Setup
- [ ] Toate tabelele create în Supabase
- [ ] RLS DISABLE pentru toate tabelele
- [ ] GRANT ALL permissions setate
- [ ] Connection string folosește **Transaction Pooler** (port 6543)

### Code Configuration
- [ ] `lib/db/index.ts` conține `prepare: false`
- [ ] `lib/db/index.ts` conține `max: 1`
- [ ] `lib/db/index.ts` conține `ssl: { rejectUnauthorized: false }`

### Environment Variables (Vercel)
- [ ] `DATABASE_URL` setat corect (Transaction Pooler!)
- [ ] `JWT_SECRET` generat și setat
- [ ] `NEXT_PUBLIC_SUPABASE_URL` setat
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` setat

### Testing
- [ ] `npm run dev` funcționează local
- [ ] Înregistrarea funcționează local
- [ ] Userul apare în Supabase Table Editor după înregistrare

---

## 🆘 Când Totul Eșuează: Nuclear Option

Dacă nimic nu merge, **RESET complet:**

### 1. Șterge toate Environment Variables în Vercel
- Settings → Environment Variables
- Șterge TOATE variabilele

### 2. Re-creează tabelele în Supabase
```sql
-- Șterge toate tabelele
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Rulează din nou SQL-ul complet de creare tabele (din DEPLOYMENT_GUIDE.md)
```

### 3. Re-adaugă Environment Variables
- Copiază din `.env.local`
- Adaugă 1 câte 1 în Vercel
- **VERIFICĂ** că `DATABASE_URL` e Transaction Pooler!

### 4. Redeploy de la zero
```bash
# Forțează un commit gol
git commit --allow-empty -m "chore: Trigger redeploy"
git push

# SAU redeploy manual în Vercel (fără cache!)
```

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Postgres.js Issues:** https://github.com/porsager/postgres/issues
- **Drizzle Discord:** https://discord.gg/drizzle

---

**✨ Ghid creat de: Dan Mitrut cu Claude Code**
**Data ultimei actualizări: Decembrie 2025**
