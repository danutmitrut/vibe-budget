# 🗄️ Configurare Corectă Database pentru Vercel + Supabase

Acest document explică **configurația exactă** pentru conexiunea la Supabase PostgreSQL în aplicații Next.js deploy-ate pe Vercel.

---

## 📝 Configurația Corectă: `lib/db/index.ts`

### Cod Complet (Copiere-Pastă pentru Cursanți)

```typescript
/**
 * CONEXIUNE LA BAZA DE DATE - SUPABASE PostgreSQL
 *
 * EXPLICAȚIE:
 * Aici creăm "podul" dintre aplicația noastră și baza de date Supabase.
 * Supabase = PostgreSQL în cloud (pentru production).
 *
 * CONCEPTE:
 * - Database = PostgreSQL (mai puternic decât SQLite)
 * - Drizzle = Biblioteca care ne ajută să vorbim cu baza de date
 * - Connection string = URL-ul către baza de date Supabase
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * PASUL 1: Creăm conexiunea la Supabase PostgreSQL
 *
 * Connection string format (Transaction Pooler - IPv4 compatible):
 * postgresql://postgres.[project-ref]:[password]@aws-X-region.pooler.supabase.com:6543/postgres
 */
const connectionString = process.env.DATABASE_URL!;

/**
 * PASUL 2: Configurăm client-ul PostgreSQL
 *
 * prepare: false - NECESAR pentru Supabase Transaction Pooler
 * max: 1 - NECESAR pentru Vercel serverless (conexiuni scurte)
 * ssl: { rejectUnauthorized: false } - NECESAR pentru Supabase
 */
const client = postgres(connectionString, {
  prepare: false,              // ⚠️ OBLIGATORIU pentru Transaction Pooler!
  max: 1,                       // ⚠️ OBLIGATORIU pentru Vercel serverless!
  ssl: { rejectUnauthorized: false }, // ⚠️ OBLIGATORIU pentru Supabase!
});

/**
 * PASUL 3: Conectăm Drizzle la PostgreSQL
 *
 * Drizzle = traducătorul nostru
 * Noi scriem în TypeScript, Drizzle traduce în SQL (limbajul bazei de date)
 */
export const db = drizzle(client, { schema });

/**
 * EXPORT pentru a folosi în toată aplicația
 *
 * UTILIZARE în alte fișiere:
 * import { db } from '@/lib/db';
 * const users = await db.select().from(schema.users);
 */
export { schema };
```

---

## 🔑 Configurații Critice (NU SCHIMBA!)

### 1. `prepare: false`

**De ce?** Supabase Transaction Pooler **NU suportă prepared statements**.

```typescript
// ✅ CORECT
const client = postgres(connectionString, {
  prepare: false,
});

// ❌ GREȘIT (va da eroare: "prepared statements not supported")
const client = postgres(connectionString, {
  prepare: true,  // NU FUNCȚIONEAZĂ cu Pooler!
});
```

**Eroarea dacă lipsește:**
```
Error: prepared statements are not supported in transaction pooling mode
```

---

### 2. `max: 1`

**De ce?** Vercel serverless functions sunt **stateless** - fiecare request creează o nouă instanță.

```typescript
// ✅ CORECT pentru Vercel serverless
const client = postgres(connectionString, {
  max: 1,  // 1 conexiune per serverless function
});

// ❌ GREȘIT pentru serverless (risipă de resurse)
const client = postgres(connectionString, {
  max: 10,  // Prea multe conexiuni!
});
```

**Explicație:**
- Serverless functions = **nu au conexiuni persistente**
- Fiecare request = **conexiune nouă**
- `max: 1` = **exact ce avem nevoie**
- `max: 10` = **risipă** (nu vor fi folosite niciodată)

---

### 3. `ssl: { rejectUnauthorized: false }`

**De ce?** Supabase folosește SSL pentru conexiuni, dar certificatul nu e întotdeauna verificabil în toate environments.

```typescript
// ✅ CORECT
const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
});

// ❌ GREȘIT (poate da eroare SSL în production)
const client = postgres(connectionString, {
  ssl: true,  // Prea strict!
});
```

---

## 🔗 Connection String Format

### ✅ CORECT: Transaction Pooler (IPv4 Compatible)

```
postgresql://postgres.[project-ref]:[password]@aws-X-region.pooler.supabase.com:6543/postgres
```

**Caracteristici:**
- Username: `postgres.[project-ref]` (cu punct!)
- Host: `aws-X-region.pooler.supabase.com` (pooler!)
- Port: `6543` (pooler port)
- Database: `postgres`

**Exemplu real:**
```
postgresql://postgres.yctmwqwrwoeqdavqjnko:MyPassword123@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

---

### ❌ GREȘIT: Direct Connection (IPv6 Only)

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**De ce nu merge pe Vercel:**
- Host: `db.[project-ref].supabase.co` → **IPv6 only!**
- Vercel = **IPv4 network**
- Rezultat: `getaddrinfo ENOTFOUND` error

---

## 🎯 Cum Obții Connection String Corect

### În Supabase Dashboard:

1. Settings → Database
2. Connection string → **"Connection string"** tab
3. **Method dropdown:** Selectează **"Transaction pooler"** (NU "Direct connection"!)
4. Copiază string-ul afișat

### Verificare rapidă:

```bash
# ✅ Corect dacă vezi:
- "pooler.supabase.com" în host
- Port 6543
- Username conține punct: "postgres.PROJECT"

# ❌ Greșit dacă vezi:
- "db.*.supabase.co" în host
- Port 5432
- Username simplu: "postgres"
```

---

## 📁 Configurare `.env.local`

```env
# Database connection string (Transaction Pooler - IPv4 compatible pentru Vercel)
DATABASE_URL=postgresql://postgres.yctmwqwrwoeqdavqjnko:Rasalgethi2025.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# JWT Secret - Cheie pentru semnarea token-urilor
JWT_SECRET=r+14vbL8ssEAZRKN5QZuWCxEGVx/xUyOLS1PatjFvHs=

# Supabase - Pentru client-side authentication (optional)
NEXT_PUBLIC_SUPABASE_URL=https://yctmwqwrwoeqdavqjnko.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Generare JWT_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🧪 Testing Local

### 1. Test Conexiune

Creează `scripts/test-db.ts`:

```typescript
import { db } from './lib/db';
import { users } from './lib/db/schema';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');

    const result = await db.select().from(users).limit(1);

    console.log('✅ Database connection successful!');
    console.log('Users found:', result.length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
```

Rulează:
```bash
npx tsx scripts/test-db.ts
```

**Output așteptat:**
```
🔍 Testing database connection...
✅ Database connection successful!
Users found: 0
```

---

## 🐛 Debugging: Connection String Issues

### Script de Verificare

```typescript
// scripts/verify-connection-string.ts
const connectionString = process.env.DATABASE_URL!;

console.log('🔍 Verificare Connection String\n');

// Parsează connection string
const url = new URL(connectionString);

console.log('Protocol:', url.protocol);
console.log('Username:', url.username);
console.log('Host:', url.hostname);
console.log('Port:', url.port);
console.log('Database:', url.pathname.slice(1));

// Verificări
const checks = {
  'Protocol is postgresql:': url.protocol === 'postgresql:',
  'Username contains dot': url.username.includes('.'),
  'Host is pooler': url.hostname.includes('pooler'),
  'Port is 6543': url.port === '6543',
  'Database is postgres': url.pathname === '/postgres'
};

console.log('\n✅ Verificări:');
Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

const allPassed = Object.values(checks).every(v => v);
console.log(`\n${allPassed ? '🎉 Toate verificările au trecut!' : '⚠️  Unele verificări au eșuat!'}`);
```

Rulează:
```bash
npx tsx scripts/verify-connection-string.ts
```

---

## 📊 Comparație: Direct vs Pooler

| Caracteristică | Direct Connection | Transaction Pooler |
|----------------|-------------------|-------------------|
| **Host** | `db.*.supabase.co` | `aws-*.pooler.supabase.com` |
| **Port** | 5432 | 6543 |
| **IPv4 Support** | ❌ Nu (IPv6 only) | ✅ Da |
| **Prepared Statements** | ✅ Suportat | ❌ Nu suportat |
| **Vercel Compatible** | ❌ Nu | ✅ Da |
| **Serverless Ideal** | ❌ Nu | ✅ Da |
| **Connection Pool** | Permanent | Temporar |
| **Use Case** | Long-lived apps | Serverless functions |

**Concluzie pentru Vercel:** **ÎNTOTDEAUNA Transaction Pooler!**

---

## 🎓 Pentru Cursanți: Checklist

Înainte de deploy, verifică:

- [ ] `lib/db/index.ts` conține `prepare: false`
- [ ] `lib/db/index.ts` conține `max: 1`
- [ ] `lib/db/index.ts` conține `ssl: { rejectUnauthorized: false }`
- [ ] Connection string conține `pooler.supabase.com`
- [ ] Connection string folosește port `6543`
- [ ] Connection string username conține punct (ex: `postgres.PROJECT`)
- [ ] `.env.local` are `DATABASE_URL` setat corect
- [ ] Test local funcționează (`npm run dev` → înregistrare merge)

---

## 🚨 Erori Comune și Soluții

### Eroare 1: `prepared statements not supported`

**Cauză:** Lipsește `prepare: false`

**Soluție:**
```typescript
const client = postgres(connectionString, {
  prepare: false,  // ← Adaugă asta!
});
```

---

### Eroare 2: `getaddrinfo ENOTFOUND db.*.supabase.co`

**Cauză:** Folosești Direct Connection în loc de Transaction Pooler

**Soluție:** Schimbă connection string-ul la Transaction Pooler (vezi mai sus)

---

### Eroare 3: `Connection terminated unexpectedly`

**Cauză:** SSL configuration incorectă

**Soluție:**
```typescript
const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },  // ← Adaugă asta!
});
```

---

**✨ Document creat de: Dan Mitrut cu Claude Code**
**Data ultimei actualizări: Decembrie 2025**
