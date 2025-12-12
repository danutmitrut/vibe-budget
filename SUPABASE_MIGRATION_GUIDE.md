# 🔄 Ghid Migrare de la SQLite la Supabase PostgreSQL

## ✅ CE AM FĂCUT PÂNĂ ACUM:

1. ✅ Instalat `@supabase/supabase-js`
2. ✅ Creat proiect Supabase: `vibe-budget`
3. ✅ Adăugat credentials în `.env.local`
4. ✅ Testat conexiunea - funcționează!

---

## 🎯 CE URMEAZĂ (3 OPȚIUNI)

### **Opțiunea 1: MIGRARE COMPLETĂ (Recomandat - 2-3 ore)**

**Ce presupune:**
- Migrezi TOATĂ aplicația de la SQLite la Supabase
- Folosești Supabase Auth în loc de JWT custom
- Row Level Security (RLS) pentru securitate
- Realtime features (optional)

**Avantaje:**
- ✅ Production-ready database
- ✅ Auth integrat (nu mai scrii cod de JWT)
- ✅ Securitate automată (RLS)
- ✅ Realtime updates (gratis)
- ✅ Backup automat

**Dezavantaje:**
- ⏳ Trebuie să rescrii auth logic
- ⏳ Trebuie să adaptezi toate API routes
- ⏳ ~2-3 ore de lucru

---

### **Opțiunea 2: MIGRARE PARȚIALĂ (Compromis - 1 oră)**

**Ce presupune:**
- Folosești Supabase DOAR pentru database (PostgreSQL)
- Păstrezi JWT custom pentru auth
- Folosești Drizzle ORM + Supabase connection

**Avantaje:**
- ✅ Database cloud funcțional
- ✅ Minimă schimbare de cod
- ✅ Deploy rapid

**Dezavantaje:**
- ❌ Nu folosești Supabase Auth (pierzi features)
- ❌ Trebuie să configurezi Drizzle pentru PostgreSQL

---

### **Opțiunea 3: TURSO (Alternative - 30 min)**

**Ce presupune:**
- SQLite în cloud (Turso)
- ZERO schimbări de cod
- Doar schimbi connection string

**Avantaje:**
- ✅ CEL MAI RAPID setup
- ✅ 100% compatibil cu codul actual
- ✅ Free tier generos

**Dezavantaje:**
- ❌ Nu ai Supabase Auth
- ❌ Nu ai Realtime features

---

## 📊 COMPARAȚIE

| Feature | SQLite Local | Turso | Supabase (Partial) | Supabase (Full) |
|---------|--------------|-------|-------------------|-----------------|
| **Setup Time** | ✅ 0 min | ✅ 30 min | ⚠️ 1h | ❌ 2-3h |
| **Works in Vercel** | ❌ Nu | ✅ Da | ✅ Da | ✅ Da |
| **Auth Built-in** | ❌ Nu | ❌ Nu | ❌ Nu | ✅ Da |
| **Realtime** | ❌ Nu | ❌ Nu | ❌ Nu | ✅ Da |
| **Code Changes** | ✅ 0 | ✅ Minimal | ⚠️ Moderate | ❌ Major |
| **Free Tier** | ✅ Unlimited | ✅ 500MB | ✅ 500MB | ✅ 500MB |
| **Best For** | Development | Quick MVP | Current App | New Features |

---

## 🎯 RECOMANDAREA MEA

**Pentru Vibe Budget (AI Finance App):**

### **OPȚIUNEA 2: MIGRARE PARȚIALĂ** 👈 **RECOMANDAT ACUM**

**De ce:**
1. ✅ Deployment funcționează ASTĂZI
2. ✅ Database cloud (Vercel compatible)
3. ✅ Minimă schimbare de cod (~1 oră)
4. ✅ Păstrăm JWT auth (deja funcționează local)
5. ✅ Mai târziu poți migra la Supabase Auth dacă vrei

**Apoi, în viitor (Phase 2):**
- Adaugi Supabase Auth pentru social login
- Adaugi Realtime pentru sync devices
- Adaugi Storage pentru receipts/invoices

---

## 🚀 OPȚIUNEA 2: PAȘI CONCRET

### **Pasul 1: Creează Schema în Supabase**

În Supabase Dashboard → SQL Editor, rulează:

\`\`\`sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  native_currency TEXT DEFAULT 'RON',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banks table
CREATE TABLE banks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  is_system_category INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currencies table
CREATE TABLE currencies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_banks_user ON banks(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
\`\`\`

### **Pasul 2: Configurează Row Level Security (RLS)**

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users văd doar propriile date
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own banks" ON banks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own banks" ON banks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own banks" ON banks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own banks" ON banks FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own currencies" ON currencies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own currencies" ON currencies FOR INSERT WITH CHECK (user_id = auth.uid());
\`\`\`

### **Pasul 3: Actualizează `lib/db/index.ts`**

\`\`\`typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
  'https://',
  'postgresql://postgres:YOUR_DATABASE_PASSWORD@'
).replace('.supabase.co', '.supabase.co:5432/postgres');

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
\`\`\`

**SAU mai simplu, folosește direct Supabase client:**

\`\`\`typescript
// lib/db/supabase-db.ts
import { supabase } from '@/lib/supabase/client';

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(\`
      *,
      bank:banks(*),
      category:categories(*)
    \`)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}
\`\`\`

### **Pasul 4: Actualizează API Routes**

Exemplu: `app/api/transactions/route.ts`

\`\`\`typescript
// ÎNAINTE (SQLite + Drizzle):
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

const transactions = await db
  .select()
  .from(schema.transactions)
  .where(eq(schema.transactions.userId, user.id));

// DUPĂ (Supabase):
import { supabase } from '@/lib/supabase/client';

const { data: transactions, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id);

if (error) throw error;
\`\`\`

---

## ⏱️ TIMP ESTIMAT PENTRU OPȚIUNEA 2:

- ⏰ **Setup Supabase Schema:** 15 min
- ⏰ **RLS Policies:** 10 min
- ⏰ **Actualizare `lib/db`:** 10 min
- ⏰ **Actualizare API routes:** 20-30 min
- ⏰ **Testing:** 10 min
- ⏰ **Deployment:** 5 min

**TOTAL: ~1 oră**

---

## 🎯 SAU OPȚIUNEA 3: TURSO (CEL MAI RAPID)

Dacă vrei să deploy-uiești **IMEDIAT** (30 min):

\`\`\`bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth login

# Create database
turso db create vibe-budget

# Get connection URL
turso db show vibe-budget
turso db tokens create vibe-budget

# Update .env.local
DATABASE_URL=libsql://vibe-budget-your-org.turso.io
DATABASE_AUTH_TOKEN=your-token

# Update lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!
});

export const db = drizzle(client);

# Push schema
npx drizzle-kit push:sqlite

# DONE! Zero code changes!
\`\`\`

---

## 🤔 CE RECOMAND SĂ FACI ACUM?

**Întrebare pentru tine:**

1. **Vrei deployment RAPID astăzi?** → **Turso (30 min)**
2. **Vrei Supabase pentru features viitoare?** → **Opțiunea 2 (1h)**
3. **Vrei să folosești toate features Supabase?** → **Opțiunea 1 (2-3h, altă zi)**

**Recomandarea mea:**
- **Acum:** Turso pentru deployment rapid
- **Weekend:** Migrare la Supabase Opțiunea 2
- **Viitor:** Adaugă Supabase Auth când vrei social login

---

**Spune-mi ce opțiune vrei și continuăm!** 🚀
