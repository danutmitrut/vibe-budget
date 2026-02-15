# Configurație Supabase - Vibe Budget Demo

**Data salvării:** 15 februarie 2026, 18:06

## Proiect Supabase

- **Nume:** vibe-budget-demo
- **Project Reference:** iumyeqhmpavbhdhcorcq
- **Region:** West EU (Ireland)
- **URL:** https://iumyeqhmpavbhdhcorcq.supabase.co
- **Created:** 2026-02-15 14:50:18

## Connection Strings

### Transaction Pooler (folosit în producție - Vercel)
```
postgresql://postgres.iumyeqhmpavbhdhcorcq:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## Environment Variables

### Vercel Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://iumyeqhmpavbhdhcorcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bXllcWhtcGF2YmhkaGNvcmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjcwMTgsImV4cCI6MjA4Njc0MzAxOH0.nR4IHz0f49g0Tq5sc3ISLDv0ndm5ja_hcc8LfovjpJY
```

### Local (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://iumyeqhmpavbhdhcorcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bXllcWhtcGF2YmhkaGNvcmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjcwMTgsImV4cCI6MjA4Njc0MzAxOH0.nR4IHz0f49g0Tq5sc3ISLDv0ndm5ja_hcc8LfovjpJY
```

## Database Schema

### Tables Created
1. **users** - Utilizatori (legați la Supabase Auth)
2. **banks** - Bănci/conturi bancare
3. **currencies** - Valute
4. **categories** - Categorii de tranzacții
5. **transactions** - Tranzacții financiare
6. **user_keywords** - Keywords pentru categorizare automată

### RLS Policies

#### users table
- **SELECT:** "Users can view their own profile" - `auth.uid()::text = id`
- **UPDATE:** "Users can update their own profile" - `auth.uid()::text = id`
- **INSERT:** "Enable insert for signup" - `WITH CHECK (true)` ⚠️ CRITIC pentru signup!

#### banks table
- **SELECT:** "Users can view their own banks" - `auth.uid()::text = user_id`
- **INSERT:** "Users can insert their own banks" - `auth.uid()::text = user_id`
- **UPDATE:** "Users can update their own banks" - `auth.uid()::text = user_id`
- **DELETE:** "Users can delete their own banks" - `auth.uid()::text = user_id`

#### currencies table
- **SELECT:** "Users can view their own currencies" - `auth.uid()::text = user_id`
- **INSERT:** "Users can insert their own currencies" - `auth.uid()::text = user_id`
- **UPDATE:** "Users can update their own currencies" - `auth.uid()::text = user_id`
- **DELETE:** "Users can delete their own currencies" - `auth.uid()::text = user_id`

#### categories table
- **SELECT:** "Users can view their own categories" - `auth.uid()::text = user_id`
- **INSERT:** "Users can insert their own categories" - `auth.uid()::text = user_id`
- **UPDATE:** "Users can update their own categories" - `auth.uid()::text = user_id`
- **DELETE:** "Users can delete their own non-system categories" - `auth.uid()::text = user_id AND is_system_category = false`

#### transactions table
- **SELECT:** "Users can view their own transactions" - `auth.uid()::text = user_id`
- **INSERT:** "Users can insert their own transactions" - `auth.uid()::text = user_id`
- **UPDATE:** "Users can update their own transactions" - `auth.uid()::text = user_id`
- **DELETE:** "Users can delete their own transactions" - `auth.uid()::text = user_id`

#### user_keywords table
- **SELECT:** "Users can view their own keywords" - `auth.uid()::text = user_id`
- **INSERT:** "Users can insert their own keywords" - `auth.uid()::text = user_id`
- **UPDATE:** "Users can update their own keywords" - `auth.uid()::text = user_id`
- **DELETE:** "Users can delete their own keywords" - `auth.uid()::text = user_id`

## Migrations

### Fișiere
1. `migrations/00000_initial_schema.sql` - Schema inițială (toate tabelele)
2. `migrations/fix_users_insert_policy.sql` - Fix pentru INSERT policy pe users

### Cum se aplică migrations
```bash
# În SQL Editor: https://supabase.com/dashboard/project/iumyeqhmpavbhdhcorcq/sql/new
# Rulează conținutul fișierelor SQL manual
```

## Deploy

### Vercel
- **URL:** https://vibe-budget-main.vercel.app
- **Project:** vibe-budget-main
- **Environment variables:** Setate prin Vercel Dashboard

## Recovery Steps

Dacă trebuie să recreezi totul de la zero:

1. **Creează proiect Supabase nou**
2. **Rulează migrations în ordine:**
   - `migrations/00000_initial_schema.sql`
   - `migrations/fix_users_insert_policy.sql`
3. **Actualizează Vercel env vars:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Actualizează `.env.local`** (local development)
5. **Redeploy Vercel:** `vercel --prod`

## Probleme Cunoscute & Soluții

### ❌ "new row violates row-level security policy for table 'users'"
**Cauză:** Policy de INSERT verifică `auth.uid()` care e NULL la signup

**Soluție:**
```sql
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
CREATE POLICY "Enable insert for signup" ON users FOR INSERT WITH CHECK (true);
```

### ❌ "email rate limit exceeded"
**Cauză:** Prea multe încercări de signup cu același email

**Soluție:** Folosește alt email sau așteaptă ~1 oră

### ❌ "Table 'users' not found"
**Cauză:** Schema nu a fost creată în Supabase

**Soluție:** Rulează `migrations/00000_initial_schema.sql` în SQL Editor

## Links Utile

- **SQL Editor:** https://supabase.com/dashboard/project/iumyeqhmpavbhdhcorcq/sql/new
- **Auth Policies:** https://supabase.com/dashboard/project/iumyeqhmpavbhdhcorcq/auth/policies
- **Database:** https://supabase.com/dashboard/project/iumyeqhmpavbhdhcorcq/database/tables
- **Settings:** https://supabase.com/dashboard/project/iumyeqhmpavbhdhcorcq/settings/general

---

**✨ Document creat automat - 15 februarie 2026**
