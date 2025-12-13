# ✅ Instructor Checklist - Curs Vibe Budget (2 Săptămâni)

## 📋 Pregătire Înainte de Curs

### 1. Setup Personal & Testing

- [ ] **Clone repository local**
  ```bash
  git clone https://github.com/yourusername/vibe-budget.git
  cd vibe-budget
  npm install
  ```

- [ ] **Testează aplicația local**
  ```bash
  cp .env.example .env.local
  # Editează .env.local cu JWT_SECRET și ANTHROPIC_API_KEY proprii
  npx tsx scripts/init-db.ts
  npx tsx scripts/create-test-user.ts
  npm run dev
  ```

- [ ] **Verifică toate features funcționează:**
  - [ ] Register/Login
  - [ ] Upload CSV/Excel (testează cu extract Revolut)
  - [ ] Dashboard cu statistici
  - [ ] Rapoarte (Stats & Pivot)
  - [ ] AI Insights (Health Score)

- [ ] **Testează deployment Vercel + Supabase** (urmărește [DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md))

### 2. Materiale pentru Cursanți

- [ ] **Citește documentația completă:**
  - [ ] [STUDENT_GUIDE_COMPLETE.md](./STUDENT_GUIDE_COMPLETE.md) - curriculum principal
  - [ ] [EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md) - cel mai complex topic
  - [ ] [DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md) - deployment production

- [ ] **Pregătește fișiere demo:**
  - [ ] Extract CSV Revolut (românesc)
  - [ ] Extract Excel ING/BT (românesc)
  - [ ] Screenshot-uri cu pașii cheie
  - [ ] Exemple de erori comune + soluții

- [ ] **Creează checklist pentru cursanți:**
  - [ ] Prerequisites (Node.js, Git, VS Code)
  - [ ] Account-uri necesare (GitHub, Vercel, Supabase, Anthropic)
  - [ ] Template `.env.local` completat

### 3. Infrastructură Cloud (pentru Demo)

- [ ] **Supabase:**
  - [ ] Creează project de demo
  - [ ] Setup Transaction Pooler (port 6543!)
  - [ ] Rulează migration SQL (vezi [DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md))
  - [ ] Testează connection string

- [ ] **Vercel:**
  - [ ] Import repository demo
  - [ ] Configurează environment variables
  - [ ] Verifică build successful

- [ ] **Anthropic Claude:**
  - [ ] API Key activ
  - [ ] Budget alocat (~$10-20 pentru tot cursul)
  - [ ] Testează toate endpoint-urile AI

---

## 📅 Plan Săptămânal

### Săptămâna 1: Fundamente

#### **Ziua 1 (Luni) - Intro & Setup**

**Obiectiv:** Cursanții au proiect Next.js funcțional local.

**Agenda (3-4 ore):**
1. **Prezentare curs (30 min)**
   - Ce vom construi (demo live aplicație)
   - Tech stack overview
   - Structură curs 2 săptămâni

2. **Setup tools (60 min)**
   - Node.js, npm, Git
   - VS Code + extensii (ESLint, Prettier, TypeScript)
   - GitHub account
   - Terminal basics (cd, ls, mkdir, etc.)

3. **Next.js basics (90 min)**
   - `npx create-next-app@latest`
   - App Router vs Pages Router
   - Folder structure (`app/`, `public/`, `lib/`)
   - Primul route: `app/page.tsx`
   - Server vs Client Components

4. **Homework:**
   - Creează 3 pagini simple: `/`, `/about`, `/contact`
   - Styling cu Tailwind CSS

**Checkpoint:**
- [ ] Toți cursanții au `npm run dev` funcțional
- [ ] Înțeleg diferența Server vs Client Components

---

#### **Ziua 2 (Marți) - TypeScript & Tailwind**

**Obiectiv:** Înțeleg TypeScript type safety și Tailwind styling.

**Agenda (3-4 ore):**
1. **TypeScript basics (90 min)**
   - Interfaces vs Types
   - Type inference
   - Common types: string, number, boolean, array, object
   - TypeScript în React (props, state)

2. **Tailwind CSS (90 min)**
   - Utility classes (`bg-blue-500`, `text-white`, etc.)
   - Responsive design (`md:`, `lg:`)
   - Hover states (`hover:bg-blue-600`)
   - Layout (flexbox, grid)

3. **Practice: Build Login Page**
   - Form cu email + password inputs
   - Submit button
   - Styling complet cu Tailwind

**Checkpoint:**
- [ ] Cursanții pot scrie interfaces TypeScript
- [ ] Pot stiliza componente cu Tailwind fără CSS manual

---

#### **Ziua 3 (Miercuri) - Database & Drizzle ORM**

**Obiectiv:** Înțeleg database schema și cum să query-uiască cu Drizzle.

**Agenda (3-4 ore):**
1. **Database concepts (60 min)**
   - Relational databases (tables, rows, columns)
   - Primary keys, foreign keys
   - PostgreSQL vs SQLite

2. **Drizzle ORM (120 min)**
   - Schema definition (`pgTable`, `text`, `decimal`, `date`)
   - Type safety (schema → TypeScript types)
   - Query examples (select, insert, update, delete)
   - Relations (users → transactions)

3. **Practice:**
   - Rulează `scripts/init-db.ts`
   - Explorează `lib/db/schema.ts`
   - Scrie query simplu: "Get all transactions pentru user X"

**Checkpoint:**
- [ ] Înțeleg schema `users`, `transactions`, `categories`, `banks`
- [ ] Pot scrie query SELECT cu filtre

**📖 Resurse:**
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

---

#### **Ziua 4-5 (Joi-Vineri) - Autentificare Custom**

**Obiectiv:** Sistem complet de autentificare (register, login, protected routes).

**Agenda Ziua 4 (3-4 ore):**
1. **JWT & Bcrypt (90 min)**
   - Ce este JWT (header + payload + signature)
   - Bcrypt pentru password hashing (de ce NU plain text!)
   - Token generation & verification

2. **API Routes (90 min)**
   - `app/api/auth/register/route.ts`
   - `app/api/auth/login/route.ts`
   - NextRequest & NextResponse
   - Error handling (status codes 400, 401, 500)

3. **Practice:**
   - Creează API route `/api/test` care returnează JSON
   - Testează cu `curl` sau Postman

**Agenda Ziua 5 (3-4 ore):**
1. **Protected Routes (90 min)**
   - Middleware cu `getCurrentUser()`
   - Verificare token JWT din headers
   - Redirect la `/login` dacă neautentificat

2. **Frontend Integration (90 min)**
   - Login page cu form
   - Salvare token în `localStorage`
   - Trimite token în headers: `Authorization: Bearer <token>`

3. **Practice:**
   - Register user nou
   - Login & primește token
   - Accesează `/dashboard` (protected route)

**Checkpoint:**
- [ ] Register funcționează (user salvat în DB)
- [ ] Login returnează JWT token
- [ ] Dashboard accesibil doar după login

**⚠️ Common Errors:**
- "401 Unauthorized" → Token invalid sau expirat
- "500 Internal Server Error" → Verifică JWT_SECRET în `.env.local`

---

### Săptămâna 2: Features & Production

#### **Ziua 6 (Luni) - CRUD Tranzacții**

**Obiectiv:** API complet pentru tranzacții (GET, POST, PATCH, DELETE).

**Agenda (3-4 ore):**
1. **API Routes (120 min)**
   - `GET /api/transactions` - List cu filtre (bankId, categoryId, startDate, endDate)
   - `POST /api/transactions` - Bulk insert
   - `PATCH /api/transactions/[id]` - Update (ex: categorizare)
   - `DELETE /api/transactions/[id]` - Ștergere

2. **Frontend (60 min)**
   - Lista tranzacții cu tabel
   - Filtre (dropdown bancă, checkbox "doar necategorizate")
   - Categorization dropdown

**Checkpoint:**
- [ ] CRUD complet funcțional
- [ ] Filtrare pe bancă/categorie
- [ ] Auto-refresh după operații

---

#### **Ziua 7 (Marți) - Upload Excel/CSV** ⭐ **CEL MAI COMPLEX**

**Obiectiv:** Import tranzacții din fișiere Excel/CSV cu diacritice românești.

**⚠️ IMPORTANT:** Această zi necesită **cel mai mult timp și atenție**!

**Agenda (4-5 ore):**
1. **File Upload Basics (60 min)**
   - Input `<input type="file" accept=".csv,.xlsx" />`
   - Read file cu FileReader
   - Papa Parse (CSV) & XLSX library (Excel)

2. **Parsare & Diacritice (120 min)** ⭐⭐⭐
   - Excel Serial Numbers (45996 → 2025-12-05)
   - Diacritice encoding (Ă → Ä fix)
   - Column detection (case-insensitive, trim, multiple variants)
   - **Citește obligatoriu:** [EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md)

3. **Auto-Categorizare (60 min)**
   - Rules în `lib/auto-categorization/categories-rules.ts`
   - Match description → category name
   - Creează categorii custom

4. **Practice:**
   - Upload extract Revolut România (Excel)
   - Verifică datele sunt corecte (NU 01.01.1970!)
   - Verifică auto-categorizare funcționează

**Checkpoint:**
- [ ] Upload Excel funcționează
- [ ] Datele afișate corect (05.12.2025, nu 1970)
- [ ] Auto-categorizare pentru minimum 5 categorii

**🐛 Debugging Session:**
Dedică **30-60 min** să arăți cum să debug-uiești:
- Console logs în `file-parser.ts`
- Network tab (verifică payload POST /api/transactions)
- Database query direct (verifică ce s-a salvat)

---

#### **Ziua 8 (Miercuri) - Dashboard & Reports**

**Obiectiv:** Statistici vizuale și rapoarte pivot.

**Agenda (3-4 ore):**
1. **API Statistics (90 min)**
   - Total income vs expenses
   - Top categories (group by + sum)
   - Monthly trends (group by month)

2. **Charts cu Victory (90 min)**
   - Bar chart (income vs expenses pe lună)
   - Pie chart (top categorii)
   - Responsive design

3. **Pivot Reports (optional):**
   - Group by: month x category
   - Matrix view

**Checkpoint:**
- [ ] Dashboard afișează statistici corecte
- [ ] Charts responsive (funcționează pe mobile)

---

#### **Ziua 9 (Joi) - AI Integration**

**Obiectiv:** Claude AI pentru Financial Health Score și recomandări.

**Agenda (3-4 ore):**
1. **Anthropic SDK Setup (30 min)**
   - API Key în `.env.local`
   - `@anthropic-ai/sdk` usage
   - Cost estimation (~$0.01-0.05 per request)

2. **Health Score Endpoint (90 min)**
   - Calculează cash flow, diversification, savings rate
   - Prompt engineering (structurat pentru Claude)
   - Parse JSON response

3. **Budget Recommendations (60 min)**
   - Identifică categorii cu spending ridicat
   - Suggestions cu impact (ex: "-30 RON/lună pe Cafenele = 360 RON/an")

4. **Practice:**
   - Testează cu date reale
   - Ajustează prompt pentru rezultate mai bune

**Checkpoint:**
- [ ] Health Score funcționează (returnează 0-10 + grade A-F)
- [ ] Recomandări relevante pentru spending patterns

**💡 Pro Tip:** Arată cursanților cum să citească documentația Anthropic API!

---

#### **Ziua 10 (Vineri) - Production Deployment** ⭐

**Obiectiv:** Aplicație live pe Vercel + Supabase.

**⚠️ CRITICAL:** Urmărește **exact** pașii din [DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md)!

**Agenda (4-5 ore):**
1. **Supabase Setup (90 min)**
   - Creează project (region: Ireland)
   - **Transaction Pooler** (port 6543!) - NU Direct Connection!
   - Rulează SQL migration
   - Test connection string local

2. **Vercel Deployment (90 min)**
   - Import GitHub repository
   - Environment variables (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)
   - First deploy (verifică build logs)

3. **Testing în Production (60 min)**
   - Register user nou
   - Upload Excel
   - Verifică dashboard
   - Testează AI features

4. **Troubleshooting Common Errors:**
   - "getaddrinfo ENOTFOUND" → Transaction Pooler!
   - TypeScript build errors → Date type mismatch
   - "All dates are NULL" → Schema migration not run

**Checkpoint:**
- [ ] Build successful pe Vercel (0 TypeScript errors)
- [ ] Register/Login funcționează
- [ ] Upload Excel funcționează (datele corecte)
- [ ] AI features funcționează (Health Score)

**🎉 Celebration:** Aplicație LIVE pe internet!

---

## 🔧 Troubleshooting - Erori Comune

### 1. "Module not found" sau Dependency Errors

**Cauză:** `node_modules` corupt sau `package-lock.json` out of sync.

**Soluție:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. "Port 3000 already in use"

**Soluție:**
```bash
# macOS/Linux:
lsof -ti:3000 | xargs kill

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3. TypeScript Errors "Type X is not assignable to Y"

**Cauză:** Schema TypeScript nu match-uiește cu datele.

**Soluție:**
- Verifică interfața (`interface Transaction { ... }`)
- Verifică schema database (`lib/db/schema.ts`)
- Verifică API response (Network tab)

### 4. Database Connection Failed (local)

**Soluție:**
```bash
# Re-create database
rm -f local.db
npx tsx scripts/init-db.ts
npx tsx scripts/create-test-user.ts
```

### 5. Vercel Build Failed

**Cauză:** TypeScript errors sau environment variables lipsă.

**Soluție:**
1. Rulează local: `npm run build`
2. Fixează toate TypeScript errors
3. Verifică env vars în Vercel dashboard
4. Redeploy cu cache disabled

### 6. Excel Upload: "0 transactions"

**Cauză:** Diacritice encoding sau column detection.

**Soluție:**
- Verifică `console.log` în browser (ce coloane detectează?)
- Adaugă variante la keywords (`sumă`, `sumä`, `suma`)
- Vezi [EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md) secțiunea Debugging

---

## 📊 Evaluare & Criterii

### Proiect Final Cursanți (Individual sau echipă de 2)

**Cerințe Minimum (Nota 6-7):**
- [ ] Autentificare funcțională (register + login)
- [ ] CRUD tranzacții (add, list, delete)
- [ ] Upload CSV (cel puțin 1 format)
- [ ] Dashboard cu statistici de bază
- [ ] Deploy Vercel + Supabase funcțional

**Cerințe Mediu (Nota 8):**
- [ ] Toate de mai sus +
- [ ] Upload Excel cu diacritice românești
- [ ] Auto-categorizare (minimum 5 reguli)
- [ ] Filtrare tranzacții (bancă, categorie, date)
- [ ] Rapoarte cu charts (Victory)

**Cerințe Avansate (Nota 9-10):**
- [ ] Toate de mai sus +
- [ ] AI Integration (Health Score + Recommendations)
- [ ] Bulk operations (select multiple → delete)
- [ ] Feature nou (de exemplu: Recurring transactions, Export PDF, Budget Goals)
- [ ] Cod curat (TypeScript strict, comentarii, no console.log în production)

### Criterii Evaluare

| Criteriu | Punctaj | Observații |
|----------|---------|------------|
| **Funcționalitate** | 40% | Toate features funcționează fără bugs majore |
| **Code Quality** | 30% | TypeScript types, structură clară, fără duplicate code |
| **UI/UX** | 15% | Design curat, responsive, user-friendly |
| **Deployment** | 10% | Production deployment funcțional |
| **Creativitate** | 5% | Features extra sau îmbunătățiri originale |

---

## 🎯 Sfaturi pentru Instructor

### 1. **Timpul Real vs Timpul Planificat**

Planificarea de mai sus presupune 3-4 ore/zi. În realitate:
- Ziua 7 (Excel parsing) poate lua **5-6 ore** → Planifică extra time!
- Ziua 10 (Deployment) poate avea probleme → **Buffer de 1-2 ore**

### 2. **Live Coding vs Slides**

**Recomandare:** 80% live coding, 20% slides.
- Cursanții înțeleg mai bine văzând erori reale și cum le rezolvi
- Commitează frecvent (`git commit -m "Add login API"`) să poată urmări

### 3. **Debugging Sessions**

Dedică **15-30 min/zi** la debugging live:
- Arată browser DevTools (Console, Network, React DevTools)
- Arată cum să citești TypeScript errors
- Arată cum să folosești `console.log()` eficient

### 4. **Pair Programming**

Ziua 7 (Excel parsing) este ideală pentru pair programming:
- Împarte cursanții în perechi
- Unul scrie cod, celălalt navigă (switch la 30 min)
- Instructor merge prin sală și ajută

### 5. **Git Workflow**

Învață cursanții să folosească Git corect:
```bash
git add .
git commit -m "Descriptive message"
git push origin main
```

**Pro Tip:** Creează branch-uri pentru fiecare feature:
```bash
git checkout -b feature/excel-upload
# ... work ...
git push origin feature/excel-upload
```

### 6. **Resurse Suplimentare**

Împărtășește link-uri utile:
- [Next.js Learn Course](https://nextjs.org/learn) - Interactive tutorial
- [TypeScript Playground](https://www.typescriptlang.org/play) - Test TypeScript online
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---

## 📚 Materiale de Distribuit

### Ziua 1 - Onboarding
- [ ] Link repository GitHub
- [ ] [STUDENT_GUIDE_COMPLETE.md](./STUDENT_GUIDE_COMPLETE.md) (curriculum complet)
- [ ] Template `.env.local` (cu placeholders)
- [ ] Checklist prerequisites (Node.js, Git, VS Code)

### Ziua 7 - Excel Parsing
- [ ] [EXCEL_PARSING_GUIDE.md](./EXCEL_PARSING_GUIDE.md) (obligatoriu!)
- [ ] Fișiere demo (CSV Revolut, Excel ING)
- [ ] Screenshot-uri cu column detection

### Ziua 10 - Deployment
- [ ] [DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md) (pas-cu-pas)
- [ ] Checklist Vercel + Supabase
- [ ] Troubleshooting guide

---

## ✅ Final Checklist (După Curs)

### Pentru Instructor:
- [ ] Toate materiale uploadate pe GitHub
- [ ] Video recordings (dacă se filmează)
- [ ] Feedback form pentru cursanți
- [ ] Certificat de finalizare (template)

### Pentru Cursanți:
- [ ] Proiect final deployed pe Vercel
- [ ] Repository GitHub cu README complet
- [ ] Prezentare scurtă (5 min) - ce ai învățat & ce feature ți-a plăcut cel mai mult

---

## 🎉 Success Stories - Ce Ar Trebui Să Poată Face Cursanții După Curs

1. **Să înțeleagă Next.js App Router** și să poată crea aplicații full-stack
2. **Să scrie TypeScript** cu type safety complet
3. **Să integreze AI** (Anthropic Claude) în orice proiect
4. **Să deploy-uiască production apps** pe Vercel + Supabase
5. **Să debug-uiască eficient** folosind DevTools și console logs
6. **Să parseze Excel/CSV** cu encoding complex (diacritice românești)
7. **Să construiască API-uri REST** cu autentificare JWT

---

**Versiune:** 1.0
**Data:** Decembrie 2025
**Autor:** Dan & Claude Code

**Mult succes la predare! 🚀**
