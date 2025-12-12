# 🚀 Ghid Deployment Vercel - Vibe Budget

## ✅ Checklist Pre-Deployment

- [x] **Cod push-at pe GitHub** → https://github.com/danutmitrut/vibe-budget
- [x] **`.env.local` exclus** din Git (verificat cu `.gitignore`)
- [x] **README.md** completat cu instrucțiuni
- [x] **Database scripts** funcționale
- [ ] **Vercel account** activ
- [ ] **Environment variables** pregătite

---

## 📋 Pasul 1: Pregătește Environment Variables

Înainte de deployment, generează un **JWT_SECRET NOU** pentru producție:

```bash
openssl rand -base64 32
```

**Output exemplu:** `xK7mP2nQ9vR8sW1tY4zB6cD0eF3gH5jL`

**IMPORTANT:**
- ❌ **NU FOLOSI** cheia din `.env.local` (e pentru development)
- ✅ **Generează una nouă** pentru producție
- 🔒 **Păstrează-o în siguranță** (1Password, Bitwarden, etc.)

---

## 📋 Pasul 2: Import Proiect în Vercel

### Opțiunea A: Vercel Dashboard (Recomandat)

1. **Mergi la Vercel**
   - Deschide: https://vercel.com
   - Click pe **"Add New..."** → **"Project"**

2. **Conectează GitHub**
   - Click pe **"Import Git Repository"**
   - Caută repository-ul: `danutmitrut/vibe-budget`
   - Click **"Import"**

3. **Configurare Proiect**
   - **Framework Preset:** Next.js (auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detect)
   - **Output Directory:** `.next` (auto-detect)
   - **Install Command:** `npm install` (auto-detect)

4. **NU DA CLICK PE DEPLOY ÎNCĂ!**
   - Trebuie să adaugi environment variables mai întâi

---

### Opțiunea B: Vercel CLI (Avansat)

```bash
# Instalează Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (interactiv)
vercel

# Urmează instrucțiunile:
# - Set up and deploy? Yes
# - Which scope? (selectează contul tău)
# - Link to existing project? No
# - Project name? vibe-budget
# - Directory? ./
# - Override settings? No
```

---

## 📋 Pasul 3: Setează Environment Variables

### În Vercel Dashboard:

1. **Mergi la Settings**
   - Click pe proiectul tău (după import)
   - Click pe **"Settings"** din navbar
   - Click pe **"Environment Variables"** în sidebar

2. **Adaugă variabilele (TOATE trei):**

   **Variabila 1:**
   ```
   Key:   JWT_SECRET
   Value: <paste-generated-secret>
   ```
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   **Variabila 2:**
   ```
   Key:   ANTHROPIC_API_KEY
   Value: sk-ant-api03-your-key-here
   ```
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   **Variabila 3 (Opțională):**
   ```
   Key:   NEXT_PUBLIC_APP_URL
   Value: https://vibe-budget.vercel.app
   ```
   - Environment: ✅ Production
   - Click **"Save"**

3. **Verifică că ai 2-3 variabile salvate**

---

## 📋 Pasul 4: Deploy!

### Deployment Inițial:

1. **Click "Deploy" (dacă încă nu ai dat deploy)**
   - Sau mergi la **"Deployments"** → **"Redeploy"**

2. **Așteaptă 2-3 minute**
   - Build-ul va rula automat
   - Vercel va afișa progress în timp real

3. **Verifică Build Logs**
   - Dacă apare eroare, click pe deployment → **"View Function Logs"**
   - Caută erori în output

---

## 📋 Pasul 5: Verifică Deployment

### 1. Deschide aplicația

URL-ul va fi: `https://vibe-budget-<unique-id>.vercel.app`

Sau custom domain: `https://vibe-budget.vercel.app`

### 2. Testează funcționalități cheie:

**Test 1: Register**
- Mergi la `/register`
- Creează cont nou
- Verifică că primești JWT token

**Test 2: Login**
- Loghează-te cu contul creat
- Verifică redirect la `/dashboard`

**Test 3: AI Features**
- ❌ **NU VOR FUNCȚIONA ÎNCĂ** - database-ul e gol!
- Trebuie să populezi database-ul în producție

---

## 🗄️ Pasul 6: Database în Producție

### Problema: SQLite Local vs Producție

**În development:**
- SQLite local (`local.db`)
- Fișierul e pe disk-ul tău

**În producție (Vercel):**
- ❌ SQLite local NU funcționează (serverless environment)
- ✅ Trebuie să folosești un database cloud

---

### Opțiunea A: Turso (Recomandat pentru SQLite)

**De ce Turso:**
- SQLite în cloud (compatibil 100%)
- Edge deployment (latență mică)
- Free tier: 500MB, 1B rows
- URL simplu: `libsql://your-db.turso.io`

**Setup Turso:**

1. **Creează cont:**
   - https://turso.tech
   - Sign up with GitHub

2. **Creează database:**
   ```bash
   # Instalează Turso CLI
   brew install tursodatabase/tap/turso

   # Login
   turso auth login

   # Creează database
   turso db create vibe-budget

   # Get connection URL
   turso db show vibe-budget
   ```

3. **Copiază URL-ul:**
   ```
   libsql://vibe-budget-<your-org>.turso.io
   ```

4. **Get Auth Token:**
   ```bash
   turso db tokens create vibe-budget
   ```

5. **Adaugă în Vercel Environment Variables:**
   ```
   DATABASE_URL=libsql://vibe-budget-<your-org>.turso.io
   DATABASE_AUTH_TOKEN=<your-token>
   ```

6. **Actualizează `lib/db/index.ts`:**
   ```typescript
   import { drizzle } from 'drizzle-orm/libsql';
   import { createClient } from '@libsql/client';

   const client = createClient({
     url: process.env.DATABASE_URL!,
     authToken: process.env.DATABASE_AUTH_TOKEN!
   });

   export const db = drizzle(client);
   ```

7. **Push schema:**
   ```bash
   npx drizzle-kit push:sqlite
   ```

---

### Opțiunea B: Neon PostgreSQL (Alternative)

**Setup Neon:**

1. https://neon.tech
2. Creează database PostgreSQL
3. Copiază connection string
4. Actualizează Drizzle config pentru Postgres
5. Redeploy

---

### Opțiunea C: PlanetScale MySQL

Similar cu Neon, dar MySQL în loc de PostgreSQL.

---

## 📋 Pasul 7: Custom Domain (Opțional)

### Adaugă domeniu propriu:

1. **În Vercel Dashboard:**
   - Settings → **"Domains"**
   - Click **"Add Domain"**

2. **Introdu domeniul:**
   - Exemplu: `vibebudget.com`
   - Click **"Add"**

3. **Configurează DNS:**
   - La provider-ul tău (GoDaddy, Namecheap, etc.)
   - Adaugă record:
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     ```

4. **Așteaptă propagare DNS (5-60 min)**

---

## 🎯 Checklist Final Deployment

- [ ] Vercel deployment SUCCESS (green checkmark)
- [ ] Environment variables setate (JWT_SECRET, ANTHROPIC_API_KEY)
- [ ] Database cloud configurat (Turso/Neon/PlanetScale)
- [ ] Register funcționează
- [ ] Login funcționează
- [ ] Dashboard se încarcă
- [ ] Poți adăuga tranzacții
- [ ] AI Features funcționează (Health Score, Recommendations)
- [ ] Custom domain configurat (opțional)
- [ ] SSL certificate activ (auto cu Vercel)

---

## 🐛 Troubleshooting

### Eroare: "Internal Server Error"

**Cauză:** Environment variables lipsă

**Soluție:**
1. Mergi la Vercel → Settings → Environment Variables
2. Verifică că `JWT_SECRET` și `ANTHROPIC_API_KEY` sunt setate
3. Redeploy: Deployments → Redeploy

---

### Eroare: "Database not found"

**Cauză:** SQLite local nu funcționează în Vercel

**Soluție:**
1. Configurează Turso (vezi Pasul 6)
2. Sau folosește Neon/PlanetScale
3. Actualizează `lib/db/index.ts`
4. Redeploy

---

### Eroare: "AI features return generic data"

**Cauză:** ANTHROPIC_API_KEY invalid sau lipsă

**Soluție:**
1. Verifică că API key-ul e corect în Vercel
2. Testează API key local:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-sonnet-4-5-20250929","max_tokens":1024,"messages":[{"role":"user","content":"test"}]}'
   ```
3. Dacă returnează 200 OK → key-ul e valid
4. Dacă returnează 401/403 → regenerează key în Anthropic Console

---

### Build Failed: "Type error"

**Cauză:** TypeScript errors

**Soluție:**
1. Rulează local: `npm run build`
2. Fix toate erorile TypeScript
3. Commit & push
4. Vercel va redeploy automat

---

## 🔐 Securitate Best Practices

### 1. Regenerează JWT_SECRET pentru producție
```bash
openssl rand -base64 32
```

### 2. Adaugă rate limiting în API routes
```typescript
// lib/rate-limit.ts
import { RateLimiter } from 'limiter';

export const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "minute"
});
```

### 3. Validare input în toate API routes
```typescript
if (!email || !email.includes('@')) {
  return NextResponse.json({ error: "Invalid email" }, { status: 400 });
}
```

### 4. CORS headers pentru API
```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://vibebudget.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    }
  });
}
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Recomandat)

1. **Activează Analytics:**
   - Settings → **"Analytics"**
   - Click **"Enable"**

2. **Monitorizează:**
   - Page views
   - Response time
   - Error rate
   - Geographic distribution

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs

# Configurează automat
npx @sentry/wizard@latest -i nextjs
```

---

## 🚀 Continuous Deployment

**Auto-deploy la fiecare push pe GitHub:**

1. Vercel detectează automat push-uri pe `main`
2. Rulează build automat
3. Dacă build SUCCESS → deploy în producție
4. Dacă build FAIL → notificare email

**Preview deployments pentru PR-uri:**
- Fiecare PR primește un URL unic de preview
- Poți testa changes înainte de merge
- Exemplu: `https://vibe-budget-pr123.vercel.app`

---

## 📝 Next Steps După Deployment

1. **Monitorizează costuri AI:**
   - Anthropic Console → Usage
   - Implementează caching (reduce cost cu 90%)

2. **Backup database:**
   - Turso: automatic backups
   - Sau setup manual backup script

3. **Add uptime monitoring:**
   - UptimeRobot.com (free tier)
   - Notificări când site-ul e down

4. **Setup email notifications:**
   - Vercel → Settings → Notifications
   - Primești email la deploy fail

---

**✅ Deployment complet!**

**Live URL:** https://vibe-budget.vercel.app
**GitHub:** https://github.com/danutmitrut/vibe-budget
**Dashboard:** https://vercel.com/danutmitrut/vibe-budget

---

*Generat: 12 Decembrie 2025*
*Proiect: Vibe Budget - Personal Finance Management App*
