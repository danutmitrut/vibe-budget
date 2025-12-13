# 🚀 Ghid Complet: Deploy Vibe Budget pe Vercel + Supabase

Acest ghid te va ajuta să deploy-ezi aplicația **fără erori**, evitând capcanele comune.

---

## 📋 Prerequisite

- Cont [GitHub](https://github.com)
- Cont [Vercel](https://vercel.com)
- Cont [Supabase](https://supabase.com)
- Aplicația Vibe Budget clonată local

---

## Partea 1: Configurare Supabase Database

### Pasul 1.1: Creează Proiect Supabase

1. Mergi pe https://supabase.com/dashboard
2. Click pe **"New Project"**
3. Completează:
   - **Name**: `vibe-budget` (sau alt nume)
   - **Database Password**: Generează o parolă puternică (SALVEAZĂ-O!)
   - **Region**: Alege cea mai apropiată (ex: `Europe (Frankfurt)`)
4. Click **"Create new project"**
5. **AȘTEAPTĂ 2-3 minute** până proiectul e gata

---

### Pasul 1.2: Creează Tabelele în Supabase

**IMPORTANT:** Folosește **SQL Editor** din Supabase, NU Table Editor!

1. În dashboard Supabase, click pe **"SQL Editor"** (sidebar stânga)
2. Click pe **"New query"**
3. **Copiază și PASTE** tot codul SQL de mai jos:

```sql
-- ============================================
-- VIBE BUDGET - SUPABASE DATABASE SCHEMA
-- ============================================

-- 1. TABEL UTILIZATORI
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  native_currency TEXT DEFAULT 'RON',
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL SUBSCRIPTIONS (pentru Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL REPORTS (pentru rapoarte generate)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL RATE LIMITS (pentru limitare rate-uri)
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL BANKS
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  balance NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'RON',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RON',
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL CURRENCIES
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  rate NUMERIC(10, 6) DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIGURARE SECURITATE (FOARTE IMPORTANT!)
-- ============================================

-- DEZACTIVĂM Row Level Security pentru că aplicația folosește custom auth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE banks DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;

-- DAM PERMISSIONS COMPLETE utilizatorului postgres
GRANT ALL ON TABLE users TO postgres;
GRANT ALL ON TABLE subscriptions TO postgres;
GRANT ALL ON TABLE reports TO postgres;
GRANT ALL ON TABLE rate_limits TO postgres;
GRANT ALL ON TABLE banks TO postgres;
GRANT ALL ON TABLE categories TO postgres;
GRANT ALL ON TABLE transactions TO postgres;
GRANT ALL ON TABLE currencies TO postgres;

-- ============================================
-- VERIFICARE: Afișăm toate tabelele create
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

4. Click pe **"Run"** (sau `Ctrl+Enter`)
5. **VERIFICĂ** în output că toate cele 8 tabele au fost create
6. **VERIFICĂ** că vezi "Success. No rows returned" pentru comenzile ALTER și GRANT

---

### Pasul 1.3: Obține Connection String CORECT

**⚠️ ATENȚIE:** Vercel folosește IPv4, deci trebuie să folosim **Transaction Pooler**, NU Direct Connection!

1. În Supabase Dashboard, mergi la **Settings** → **Database**
2. Scroll până la secțiunea **"Connection string"**
3. Click pe **"Connection string"** tab
4. **SCHIMBĂ dropdown-ul "Method"** din **"Direct connection"** în **"Transaction pooler"**
5. **COPIAZĂ** connection string-ul afișat. Ar trebui să arate așa:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-X-region.pooler.supabase.com:6543/postgres
```

**Diferențele critice:**
- ✅ **CORECT** (Transaction Pooler): `postgres.[PROJECT-REF]:password@aws-X-region.pooler.supabase.com:6543`
- ❌ **GREȘIT** (Direct - nu merge pe Vercel): `postgres:password@db.[PROJECT-REF].supabase.co:5432`

**De ce Transaction Pooler?**
- ✅ IPv4 compatible (Vercel e pe IPv4)
- ✅ Ideal pentru serverless functions (Vercel)
- ✅ Conexiuni scurte, stateless
- ✅ Port 6543 (pooler) în loc de 5432 (direct)

6. **SALVEAZĂ** connection string-ul pentru pasul următor!

---

### Pasul 1.4: Testează Local (Opțional dar Recomandat)

1. Deschide fișierul `.env.local` din proiect
2. Actualizează `DATABASE_URL` cu connection string-ul de la Pasul 1.3:

```env
DATABASE_URL=postgresql://postgres.yctmwqwrwoeqdavqjnko:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

3. Rulează local:
```bash
npm run dev
```

4. Testează înregistrarea pe `http://localhost:3000/register`
5. Verifică în Supabase **Table Editor** → **users** că userul a fost creat

---

## Partea 2: Deploy pe Vercel

### Pasul 2.1: Conectează Repo GitHub la Vercel

1. Push codul pe GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Mergi pe https://vercel.com/new
3. Click pe **"Import Git Repository"**
4. Selectează repo-ul `vibe-budget`
5. Click **"Import"**

---

### Pasul 2.2: Configurează Environment Variables

**NU da deploy încă!** Trebuie să configurezi variabilele de mediu mai întâi.

1. În ecranul de import, scroll până la **"Environment Variables"**
2. Adaugă următoarele variabile:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | Connection string de la Pasul 1.3 (Transaction Pooler!) | Production, Preview, Development |
| `JWT_SECRET` | Generează: `openssl rand -base64 32` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Găsește în Supabase: Settings → API → anon/public | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | Cheie Stripe (opțional pentru început) | Production |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret Stripe (opțional) | Production |

**FOARTE IMPORTANT pentru `DATABASE_URL`:**
```
✅ CORECT: postgresql://postgres.PROJECT:pass@aws-region.pooler.supabase.com:6543/postgres
❌ GREȘIT: postgresql://postgres:pass@db.PROJECT.supabase.co:5432/postgres
```

3. Click **"Deploy"**
4. Așteaptă 2-3 minute

---

### Pasul 2.3: Verifică Deploy-ul

1. După ce deploy-ul e gata, click pe **"Visit"**
2. Mergi pe `/register`
3. Înregistrează-te cu un email și parolă
4. Dacă merge → **SUCCESS!** 🎉
5. Verifică în Supabase **Table Editor** → **users** că userul a fost creat

---

## 🔧 Troubleshooting: Probleme Comune

### Eroare: `getaddrinfo ENOTFOUND db.*.supabase.co`

**Cauza:** Folosești Direct Connection în loc de Transaction Pooler

**Soluție:**
1. Mergi în Vercel → Settings → Environment Variables
2. Editează `DATABASE_URL`
3. Asigură-te că folosești **Transaction Pooler** connection string:
   - Host: `aws-X-region.pooler.supabase.com`
   - Port: `6543`
4. Redeploy (fără cache!)

---

### Eroare: `Failed query: select ... from users`

**Cauza:** Row Level Security (RLS) e activat sau lipsesc permissions

**Soluție:**
1. Mergi în Supabase SQL Editor
2. Rulează:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE users TO postgres;
```
3. Repetă pentru toate tabelele

---

### Eroare: `relation "users" does not exist`

**Cauza:** Tabelele nu au fost create în Supabase

**Soluție:**
1. Mergi în Supabase SQL Editor
2. Rulează tot SQL-ul din Pasul 1.2
3. Verifică că vezi tabelele în Table Editor

---

### Deploy-ul nu preia Environment Variables actualizate

**Cauza:** Vercel cache-uiește build-ul

**Soluție:**
1. Mergi în Vercel → Deployments
2. Click pe ultimul deployment → 3 puncte → "Redeploy"
3. **DEBIFEAZA** "Use existing Build Cache"
4. Click "Redeploy"

---

## ✅ Checklist Final

Înainte de a considera deploy-ul finalizat, verifică:

- [ ] Toate cele 8 tabele sunt create în Supabase
- [ ] RLS este DISABLE pentru toate tabelele
- [ ] GRANT ALL permissions sunt setate
- [ ] Folosești **Transaction Pooler** connection string (port 6543, host pooler.supabase.com)
- [ ] `DATABASE_URL` în Vercel conține connection string-ul corect
- [ ] `JWT_SECRET` este setat în Vercel
- [ ] Înregistrarea funcționează pe site-ul live
- [ ] Userul apare în Supabase Table Editor → users

---

## 📚 Resurse Suplimentare

- [Supabase Docs: Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Docs: Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Docs: Deployment](https://nextjs.org/docs/deployment)

---

## 🎓 Pentru Instructori

**Timpul estimat:** 30-45 minute pentru deploy complet

**Puncte critice de menționat cursanților:**
1. **OBLIGATORIU Transaction Pooler** pentru Vercel (IPv4 compatibility)
2. **OBLIGATORIU dezactivare RLS** pentru custom auth
3. **Connection string format diferit** între Direct și Pooler
4. **Redeploy fără cache** când se schimbă env vars

**Demonstrație live recomandată:**
1. Arată diferența dintre Direct Connection și Transaction Pooler în Supabase UI
2. Arată cum se verifică logs în Vercel pentru debugging
3. Arată cum se verifică datele în Supabase Table Editor după înregistrare

---

**✨ Ghid creat de: Dan Mitrut cu Claude Code**
**Data ultimei actualizări: Decembrie 2025**
