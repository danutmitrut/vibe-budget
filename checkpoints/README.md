# Checkpoints - Cod de referință pentru fiecare etapă

## Ce sunt checkpoints?

Fiecare folder conține **codul complet și funcțional** pentru acea zi din curs.

Folosește-le când:
- Ești blocat și nu poți continua
- Vrei să compari codul tău cu cel corect
- Ai sărit o zi și vrei să prinzi din urmă

## Structura

```
checkpoints/
├── day-03-database/    # După Ziua 3: Schema DB funcțională
├── day-05-auth/        # După Ziua 5: Autentificare completă
├── day-07-upload/      # După Ziua 7: Upload Excel/CSV funcțional
└── day-10-final/       # Proiect complet, gata de deploy
```

## Cum folosești un checkpoint

### Opțiunea 1: Compară fișierele

Deschide fișierul din checkpoint și compară cu al tău:
- VS Code: Click dreapta → "Select for Compare" → apoi "Compare with Selected"
- Terminal: `diff -u checkpoints/day-05-auth/lib/auth/utils.ts lib/auth/utils.ts`

### Opțiunea 2: Copiază un fișier specific

```bash
# Exemplu: copiază utils.ts din checkpoint-ul day-05
cp checkpoints/day-05-auth/lib/auth/utils.ts lib/auth/utils.ts
```

### Opțiunea 3: Resetează la checkpoint (ATENȚIE!)

Dacă vrei să pornești complet de la un checkpoint:

```bash
# ATENȚIE: Pierzi modificările tale!
# Mai întâi, salvează-ți codul
git stash

# Copiază checkpoint-ul peste codul curent
cp -r checkpoints/day-05-auth/* .

# Reinstalează dependențele (dacă package.json s-a schimbat)
npm install
```

## Ce conține fiecare checkpoint

### day-03-database
- `lib/db/schema.ts` - Schema completă (users, transactions, categories, banks)
- `lib/db/index.ts` - Conexiune DB
- `scripts/init-db.ts` - Script inițializare
- `scripts/create-test-user.ts` - Script creare user test

### day-05-auth
- Tot din day-03 +
- `lib/auth/utils.ts` - JWT generation/verification
- `lib/auth/get-current-user.ts` - Auth middleware
- `app/api/auth/register/route.ts` - Register endpoint
- `app/api/auth/login/route.ts` - Login endpoint
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Register page
- `middleware.ts` - Route protection

### day-07-upload
- Tot din day-05 +
- `lib/utils/file-parser.ts` - Excel/CSV parsing cu diacritice
- `lib/auto-categorization/` - Reguli auto-categorizare
- `app/dashboard/upload/page.tsx` - Upload page
- `app/api/transactions/route.ts` - CRUD transactions
- `app/api/transactions/bulk/route.ts` - Bulk import

### day-10-final
- Proiectul complet, gata de deploy
- Include AI integration
- Include toate paginile dashboard
- Testat pentru Vercel + Supabase

## Notă importantă

Checkpoints sunt pentru **referință și debug**, nu pentru copiat orbește.

Încercă să rezolvi singur înainte să te uiți la checkpoint.
Dacă copiezi, **citește și înțelege** codul copiat.

## Actualizare checkpoints (pentru instructori)

După fiecare modificare majoră în proiect, actualizează checkpoints:

```bash
# Exemplu: actualizează day-10-final cu codul curent
rm -rf checkpoints/day-10-final/*
cp -r app lib scripts package.json checkpoints/day-10-final/
```
