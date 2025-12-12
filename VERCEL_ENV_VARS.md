# 🔑 Environment Variables pentru Vercel - LISTĂ COMPLETĂ

## ⚠️ IMPORTANT: Trebuie să adaugi TOATE 4 variabilele!

Mergi la: **Vercel Dashboard → Settings → Environment Variables**

---

## 📋 VARIABILA 1: JWT_SECRET

```
Name:  JWT_SECRET
Value: r+14vbL8ssEAZRKN5QZuWCxEGVx/xUyOLS1PatjFvHs=
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

**Ce face:** Cheie secretă pentru semnarea JWT tokens (autentificare utilizatori)

---

## 📋 VARIABILA 2: ANTHROPIC_API_KEY

```
Name:  ANTHROPIC_API_KEY
Value: <copiază din .env.local - API key-ul tău Anthropic>
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

**Ce face:** API key pentru Claude AI (Health Score, Recommendations, Anomaly Detection)

---

## 📋 VARIABILA 3: NEXT_PUBLIC_SUPABASE_URL

```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://yctmwqwrwoeqdavqjnko.supabase.co
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

**Ce face:** URL-ul proiectului Supabase (database cloud)

**IMPORTANT:** Are prefix `NEXT_PUBLIC_` = va fi expus în browser (e OK, e public!)

---

## 📋 VARIABILA 4: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_kVBVHEHE-HNRKNsaUe8Y5A_nlyGqzBl
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

**Ce face:** Anon (public) key pentru Supabase - protejat de Row Level Security

**IMPORTANT:** Are prefix `NEXT_PUBLIC_` = va fi expus în browser (e OK, protejat de RLS!)

---

## ✅ CHECKLIST FINAL

După ce adaugi toate 4 variabilele, verifică:

- [ ] Ai exact **4 environment variables** în Vercel
- [ ] Toate au bifat **Production**, **Preview**, **Development**
- [ ] `JWT_SECRET` e diferit de cel din `.env.local` (optional, dar recomandat)
- [ ] `ANTHROPIC_API_KEY` începe cu `sk-ant-api03-`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` începe cu `https://`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` începe cu `sb_publishable_`

---

## 🔄 DUPĂ CE ADAUGI VARIABILELE

**Redeploy aplicația:**

1. Mergi la **Deployments** în Vercel
2. Click pe ultimul deployment (cel verde sau roșu)
3. Click pe butonul **"Redeploy"** (sus-dreapta)
4. Așteaptă 2-3 minute
5. Testează site-ul live!

---

## ⚠️ PROBLEME CUNOSCUTE

### **Database NU va funcționa încă în Vercel!**

**De ce:**
- SQLite local nu funcționează în Vercel (serverless)
- Trebuie să migrezi la Supabase PostgreSQL SAU Turso

**Soluție:**
- Vezi `SUPABASE_MIGRATION_GUIDE.md` pentru migrare completă
- SAU folosește Turso pentru migrare rapidă (30 min)

**Ce VA funcționa:**
- ✅ Site-ul se încarcă
- ✅ UI-ul arată corect
- ✅ Environment variables sunt setate

**Ce NU va funcționa:**
- ❌ Register/Login (database lipsă)
- ❌ Transactions (database lipsă)
- ❌ AI Features (nu au date de analizat)

---

## 🎯 NEXT STEP: Migrare Database

**Opțiuni:**

1. **Turso** (30 min) - SQLite în cloud, zero schimbări cod
2. **Supabase Parțial** (1h) - PostgreSQL + păstrezi JWT auth
3. **Supabase Complet** (2-3h) - PostgreSQL + Supabase Auth

Vezi `SUPABASE_MIGRATION_GUIDE.md` pentru detalii!

---

**📝 COPY-PASTE RAPID:**

```
JWT_SECRET=r+14vbL8ssEAZRKN5QZuWCxEGVx/xUyOLS1PatjFvHs=
ANTHROPIC_API_KEY=<your-anthropic-api-key>
NEXT_PUBLIC_SUPABASE_URL=https://yctmwqwrwoeqdavqjnko.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kVBVHEHE-HNRKNsaUe8Y5A_nlyGqzBl
```

*Generat: 12 Decembrie 2025*
