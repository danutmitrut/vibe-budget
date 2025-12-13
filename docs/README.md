# 📚 Vibe Budget - Documentație Deployment

Documentație completă pentru deploy-ul aplicației Vibe Budget pe Vercel + Supabase PostgreSQL.

---

## 📖 Ghiduri Disponibile

### 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Ghid pas-cu-pas complet pentru deploy**

- ✅ Setup Supabase (creare proiect, tabele, configurare)
- ✅ Obținere connection string corect (Transaction Pooler)
- ✅ Deploy pe Vercel
- ✅ Configurare Environment Variables
- ✅ Testing și verificare

**Timp estimat:** 30-45 minute

**Pentru cine:** Cursanți care deploy-ază prima dată

---

### 🗄️ [DATABASE_SETUP.md](./DATABASE_SETUP.md)
**Configurare corectă database și explicații tehnice**

- ✅ Cod complet `lib/db/index.ts` (copy-paste ready)
- ✅ Explicații pentru `prepare: false`, `max: 1`, `ssl`
- ✅ Diferența Direct Connection vs Transaction Pooler
- ✅ Format connection string corect
- ✅ Scripts de testing și verificare

**Pentru cine:**
- Cursanți care vor să înțeleagă **DE CE** configurăm așa
- Instructori care vor să explice conceptele tehnice

---

### 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Rezolvarea problemelor comune**

- ✅ Toate erorile frecvente cu soluții pas-cu-pas
- ✅ Diagnostic tools și scripts de debugging
- ✅ Pre-deploy checklist
- ✅ "Nuclear option" când totul eșuează

**Pentru cine:**
- Cursanți care întâmpină erori la deploy
- Instructori pentru suport rapid

---

## 🎯 Quick Start

### Pentru Cursanți

1. **Citește:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Urmează pașii** în ordine (Partea 1 → Partea 2)
3. **Dacă apare eroare:** Consultă [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. **Dacă vrei să înțelegi mai bine:** Citește [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### Pentru Instructori

1. **Pregătire curs:**
   - Citește toate 3 ghidurile
   - Testează deployment-ul pe propriul cont
   - Pregătește demo live cu [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

2. **În timpul cursului:**
   - Arată diferența Direct vs Pooler în Supabase UI
   - Explică de ce `prepare: false` e necesar (folosind [DATABASE_SETUP.md](./DATABASE_SETUP.md))
   - Demonstrează cum să vezi logs în Vercel

3. **Suport cursanți:**
   - Folosește [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) ca referință rapidă
   - Verifică Pre-Deploy Checklist când cineva are probleme

---

## 🔑 Concepte Cheie (MUST KNOW)

### 1. Transaction Pooler vs Direct Connection

| Aspect | Direct | Pooler |
|--------|--------|--------|
| **Host** | `db.*.supabase.co` | `aws-*.pooler.supabase.com` |
| **Port** | 5432 | 6543 |
| **IPv4** | ❌ Nu | ✅ Da |
| **Vercel** | ❌ Nu merge | ✅ Merge |

**REGULA DE AUR:** Vercel = ÎNTOTDEAUNA Transaction Pooler!

---

### 2. Configurații Obligatorii în `lib/db/index.ts`

```typescript
const client = postgres(connectionString, {
  prepare: false,              // ⚠️ OBLIGATORIU pentru Pooler!
  max: 1,                       // ⚠️ OBLIGATORIU pentru Vercel!
  ssl: { rejectUnauthorized: false }, // ⚠️ OBLIGATORIU pentru Supabase!
});
```

**De reținut:**
- `prepare: false` → Pooler nu suportă prepared statements
- `max: 1` → Serverless = 1 conexiune per request
- `ssl: { rejectUnauthorized: false }` → Supabase SSL requirements

---

### 3. Row Level Security (RLS) TREBUIE Disable

**De ce?** Aplicația folosește custom authentication (JWT), NU Supabase Auth.

```sql
-- OBLIGATORIU pentru toate tabelele:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE banks DISABLE ROW LEVEL SECURITY;
-- ... etc pentru toate tabelele
```

---

## ⚠️ Greșeli Frecvente de Evitat

### ❌ Greșeală #1: Direct Connection pe Vercel
```
DATABASE_URL=postgresql://postgres:pass@db.PROJECT.supabase.co:5432/postgres
```
**Rezultat:** `getaddrinfo ENOTFOUND` error

**Fix:** Folosește Transaction Pooler (port 6543, host pooler.supabase.com)

---

### ❌ Greșeală #2: Lipsește `prepare: false`
```typescript
const client = postgres(connectionString, {
  max: 1,
  // prepare: false  ← LIPSEȘTE!
});
```
**Rezultat:** `prepared statements not supported` error

**Fix:** Adaugă `prepare: false`

---

### ❌ Greșeală #3: RLS rămâne enabled
```sql
-- NU s-a rulat:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```
**Rezultat:** `permission denied for table users` error

**Fix:** Disable RLS pentru toate tabelele (vezi SQL în DEPLOYMENT_GUIDE.md)

---

## 📊 Flux de Deployment Recomandat

```
1. Setup Supabase
   ├── Creează proiect
   ├── Rulează SQL pentru tabele
   ├── Disable RLS
   ├── Grant permissions
   └── Obține Transaction Pooler connection string

2. Configurare Locală
   ├── Actualizează .env.local cu DATABASE_URL
   ├── Verifică lib/db/index.ts (prepare: false, max: 1, ssl)
   ├── Test local: npm run dev
   └── Test înregistrare locală

3. Deploy Vercel
   ├── Push pe GitHub
   ├── Import repo în Vercel
   ├── Setează Environment Variables (DATABASE_URL, JWT_SECRET, etc.)
   ├── Deploy
   └── Test înregistrare live

4. Verificare Finală
   ├── Test înregistrare pe site live
   ├── Verifică user în Supabase Table Editor
   ├── Check Vercel logs pentru erori
   └── ✅ SUCCESS!
```

---

## 🛠️ Resurse Utile

### Scripts de Testing

Toate scripturile de testing se găsesc în [DATABASE_SETUP.md](./DATABASE_SETUP.md):
- `scripts/test-db.ts` - Test conexiune simplă
- `scripts/verify-connection-string.ts` - Verificare format connection string
- `scripts/test-db-access.ts` - Test complet (tables, RLS, permissions)

### Links Externe

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Postgres.js Documentation](https://github.com/porsager/postgres)

---

## 🎓 Pentru Instructori: Tips de Predare

### Demo Live Recomandată (30 min)

**Partea 1: Supabase Setup (15 min)**
1. Creează proiect Supabase live
2. Arată SQL Editor și rulează SQL pentru tabele
3. **IMPORTANT:** Arată diferența Direct vs Pooler în UI
4. Explică de ce IPv4 compatibility e critică pentru Vercel

**Partea 2: Vercel Deploy (15 min)**
5. Import repo în Vercel
6. Setează Environment Variables (arată ce e fiecare)
7. Deploy și arată logs în timp real
8. Test înregistrare live și verifică în Supabase

### Puncte Critice de Menționat

1. **Transaction Pooler e OBLIGATORIU pentru Vercel** (repetă de 3 ori!)
2. **`prepare: false` e NECESAR** (arată eroarea fără el)
3. **RLS TREBUIE disable** (explică de ce - custom auth)
4. **Redeploy fără cache** când schimbi env vars

### Q&A Anticipate

**Q: De ce nu merge Direct Connection pe Vercel?**
A: Vercel folosește IPv4, Direct Connection e IPv6-only. Arată în Supabase UI warning-ul "Not IPv4 compatible".

**Q: Pot folosi mai multe conexiuni (max: 10)?**
A: Nu are sens în serverless - fiecare request e o instanță nouă, `max: 1` e perfect.

**Q: De ce disable RLS dacă e un feature de securitate?**
A: Aplicația folosește JWT custom auth, nu Supabase Auth. RLS e util doar cu Supabase Auth.

---

## 📝 Changelog Documentație

### v1.0 (Decembrie 2025)
- ✅ DEPLOYMENT_GUIDE.md - Ghid complet pas-cu-pas
- ✅ DATABASE_SETUP.md - Explicații tehnice detaliate
- ✅ TROUBLESHOOTING.md - Rezolvare probleme comune
- ✅ README.md - Index și quick reference

---

**✨ Documentație creată de: Dan Mitrut cu Claude Code**

**Feedback și sugestii:** Deschide un issue pe GitHub sau contactează instructorul.
