# 📊 Fișiere de Test pentru Vibe Budget

Acest folder conține fișiere CSV de test pentru a simula importul de tranzacții bancare reale.

## 📁 Fișiere Disponibile

### 1. **ING_Tranzactii_Noiembrie_2024.csv**
- **Bancă**: ING Bank România
- **Perioadă**: Noiembrie 2024
- **Moneda**: RON
- **Număr tranzacții**: 16
- **Tipuri**:
  - 14 cheltuieli (supermarketuri, utilități, restaurante, subscripții)
  - 2 venituri (salariu, transfer primit)

**Categorii sugerate:**
- Supermarket: Kaufland, Mega Image, Lidl, Carrefour, Cora
- Utilități: Plată întreținere
- Transport: Benzinărie Petrom
- Subscripții: Netflix
- Restaurant: Trattoria, Starbucks
- Sănătate: Farmacia Catena
- Telecomunicații: Orange

### 2. **BCR_Extras_Octombrie_2024.csv**
- **Bancă**: BCR (Banca Comercială Română)
- **Perioadă**: Octombrie 2024
- **Moneda**: RON
- **Număr tranzacții**: 14
- **Tipuri**:
  - 11 cheltuieli
  - 2 venituri (salariu, bonus vacanță)
  - 1 transfer economii

**Categorii sugerate:**
- Venituri: Salariu, Bonus vacanță
- Utilități: Întreținere, Electrica, Digi, Vodafone
- Supermarket: Auchan, Penny, Profi
- Shopping: Decathlon, Leroy Merlin
- Divertisment: Cinema City
- Economii: Transfer către economii

### 3. **Revolut_Statement_Nov_2024.csv**
- **Bancă**: Revolut (UK)
- **Perioadă**: Noiembrie 2024
- **Moneda**: GBP (Lire Sterline)
- **Număr tranzacții**: 13
- **Tipuri**:
  - 10 cheltuieli
  - 2 venituri (salariu, freelance)
  - 1 schimb valutar

**Categorii sugerate:**
- Venituri: Salary, Freelance Project
- Restaurant: Starbucks, Nando's
- Transport: Uber, TFL Transport
- Supermarket: Tesco
- Shopping: Amazon, Apple Store, Zara
- Subscripții: Spotify Premium
- Cash: ATM Withdrawal
- Schimb valutar: GBP to EUR Exchange

### 4. **PayPal_Tranzactii_Septembrie_2024.csv**
- **Platforma**: PayPal
- **Perioadă**: Septembrie 2024
- **Monede**: USD, EUR
- **Număr tranzacții**: 8
- **Tipuri**:
  - 5 cheltuieli (subscripții, cursuri online, servicii)
  - 3 venituri (plăți freelance, proiecte)

**Categorii sugerate:**
- Educație: Udemy, Coursera
- Subscripții: Adobe Creative Cloud, GitHub Pro
- Servicii Online: Fiverr, Envato Market
- Venituri Freelance: Plăți clienți

---

## 🚀 Cum să Testezi Aplicația

### Pasul 1: Pornește Aplicația

```bash
cd /Users/danmitrut/vibe-budget
npm run dev
```

Aplicația va rula la: http://localhost:3000

### Pasul 2: Înregistrare și Login

1. Accesează http://localhost:3000
2. Click pe **"Începe gratuit"**
3. Înregistrează-te cu:
   - **Nume**: Test User
   - **Email**: test@example.com
   - **Parolă**: test1234
   - **Moneda nativă**: RON
4. Vei fi redirecționat automat la dashboard

### Pasul 3: Adaugă Băncile

1. Click pe **"🏦 Gestionează bănci"**
2. Adaugă băncile tale:

**ING Bank:**
- Nume: ING Cont Principal
- Tip: ING
- Culoare: #FF6200 (portocaliu ING)

**BCR:**
- Nume: BCR Salariu
- Tip: BCR
- Culoare: #FFD500 (galben BCR)

**Revolut:**
- Nume: Revolut UK
- Tip: Revolut
- Culoare: #0075EB (albastru Revolut)

**PayPal:**
- Nume: PayPal Business
- Tip: PayPal
- Culoare: #003087 (albastru PayPal)

### Pasul 4: Adaugă Categorii

Click pe **"📁 Categorii"** și creează:

**Cheltuieli:**
- 🛒 Supermarket (verde #10B981)
- 🏠 Utilități (albastru #3B82F6)
- 🚗 Transport (portocaliu #F97316)
- 🍕 Restaurant (roșu #EF4444)
- 📱 Subscripții (violet #8B5CF6)
- 👕 Shopping (roz #EC4899)
- 🎓 Educație (indigo #6366F1)
- 🏥 Sănătate (cyan #06B6D4)
- 🎬 Divertisment (lime #84CC16)
- 💳 Servicii Online (teal #14B8A6)

**Venituri:**
- 💰 Salariu (verde închis #059669)
- 💼 Freelance (albastru închis #0284C7)
- 🎁 Bonusuri (auriu #CA8A04)
- 🔄 Transfer Primit (gri #6B7280)

### Pasul 5: Adaugă Valute

Click pe **"💱 Valute"** și adaugă:

**RON (Leu Românesc):**
- Simbol: lei
- Rată de schimb: 1.0 (moneda nativă)

**GBP (Lire Sterline):**
- Simbol: £
- Rată de schimb: 6.2 (1 GBP = 6.2 RON)

**USD (Dolari Americani):**
- Simbol: $
- Rată de schimb: 4.7 (1 USD = 4.7 RON)

**EUR (Euro):**
- Simbol: €
- Rată de schimb: 5.0 (1 EUR = 5.0 RON)

### Pasul 6: Importă Tranzacții

1. Click pe **"📤 Importă tranzacții"**
2. Selectează banca din dropdown (ex: ING Cont Principal)
3. Click pe **"Choose File"** și selectează `ING_Tranzactii_Noiembrie_2024.csv`
4. Click pe **"Importă Tranzacții"**
5. Așteaptă confirmarea: "16 tranzacții importate cu succes"
6. Repetă pentru celelalte fișiere:
   - BCR_Extras_Octombrie_2024.csv → BCR Salariu
   - Revolut_Statement_Nov_2024.csv → Revolut UK
   - PayPal_Tranzactii_Septembrie_2024.csv → PayPal Business

### Pasul 7: Categorizează Tranzacțiile

1. Click pe **"📊 Tranzacții"**
2. Vei vedea toate tranzacțiile importate
3. Pentru fiecare tranzacție necategorizată:
   - Click pe dropdown-ul "Alege categorie..."
   - Selectează categoria potrivită
   - Tranzacția va fi salvată automat

**Exemple de categorizare:**
- "Kaufland Bucuresti" → 🛒 Supermarket
- "Netflix Subscription" → 📱 Subscripții
- "Salariu" → 💰 Salariu
- "Benzinarie Petrom" → 🚗 Transport
- "Restaurant Trattoria" → 🍕 Restaurant

### Pasul 8: Vezi Rapoartele

1. Click pe **"📈 Rapoarte și Grafice"**
2. Selectează perioada:
   - **Luna Curentă** (implicit)
   - **Anul Curent**
   - Sau alege date personalizate

**Ce vei vedea:**
- **Summary Cards**: Venituri, Cheltuieli, Balanță
- **Grafic Categorii (Pie Chart)**: Distribuție pe categorii
- **Grafic Bănci (Bar Chart)**: Distribuție pe bănci
- **Tabel Detalii**: Sume și număr tranzacții per categorie/bancă

---

## 📊 Date Demo Statistici Așteptate

După importul tuturor fișierelor, vei avea aproximativ:

### Total Tranzacții: ~51
- ING: 16 tranzacții
- BCR: 14 tranzacții
- Revolut: 13 tranzacții
- PayPal: 8 tranzacții

### Venituri Totale (în RON echivalent):
- Salariu ING: 8,500 RON
- Salariu BCR: 7,800 RON
- Bonus BCR: 2,500 RON
- Salariu Revolut: 1,850 GBP × 6.2 = ~11,470 RON
- Freelance Revolut: 500 GBP × 6.2 = ~3,100 RON
- Freelance PayPal: 850 EUR × 5.0 + 320 USD × 4.7 = ~5,754 RON
- Transferuri: 300 RON

**Total Venituri: ~39,424 RON**

### Cheltuieli Totale (în RON echivalent):
- ING: ~4,720 RON
- BCR: ~3,876 RON
- Revolut: ~1,500 GBP × 6.2 = ~9,300 RON
- PayPal: ~328 USD × 4.7 = ~1,542 RON

**Total Cheltuieli: ~19,438 RON**

### Balanță: ~19,986 RON (pozitiv) ✅

---

## 🎯 Scenarii de Testare

### Scenariul 1: Utilizator Nou
1. Înregistrare → Adaugă bănci → Adaugă categorii → Import tranzacții → Categorizare → Rapoarte

### Scenariul 2: Import Multiplu
1. Importă toate cele 4 fișiere
2. Verifică că nu există duplicări
3. Verifică conversiile valutare (GBP, USD, EUR → RON)

### Scenariul 3: Filtrare Perioade
1. Vezi rapoarte pentru "Luna Curentă" (vor apărea doar Nov 2024)
2. Vezi rapoarte pentru "Anul Curent" (Sept + Oct + Nov 2024)
3. Alege date personalizate (01.09.2024 - 30.11.2024)

### Scenariul 4: Paginare Tranzacții
1. Dacă ai peste 50 tranzacții, verifică paginarea
2. Navighează între pagini
3. Verifică că toate tranzacțiile apar

---

## ⚠️ Probleme Comune și Soluții

### Problema: "Token invalid" după refresh
**Soluție:** Token-ul JWT expiră după 7 zile. Loghează-te din nou.

### Problema: Tranzacțiile nu apar în rapoarte
**Cauză:** Perioada selectată nu include tranzacțiile.
**Soluție:** Selectează "Anul Curent" sau alege date personalizate.

### Problema: Conversiile valutare sunt greșite
**Cauză:** Ratele de schimb nu sunt setate corect.
**Soluție:**
1. Mergi la "💱 Valute"
2. Verifică că ratele sunt: GBP=6.2, USD=4.7, EUR=5.0

### Problema: CSV-ul nu se importă
**Cauză:** Format incompatibil sau bancă neselectată.
**Soluție:**
1. Verifică că ai selectat banca din dropdown ÎNAINTE de upload
2. Verifică că fișierul este CSV valid (nu .txt sau alt format)

---

## 🧪 Test Checklist

După testare, verifică:

- [ ] ✅ Înregistrare și login funcționează
- [ ] ✅ Adăugare bănci (4 bănci)
- [ ] ✅ Adăugare categorii (minimum 10 categorii)
- [ ] ✅ Adăugare valute (RON, GBP, USD, EUR)
- [ ] ✅ Import CSV ING (16 tranzacții)
- [ ] ✅ Import CSV BCR (14 tranzacții)
- [ ] ✅ Import CSV Revolut (13 tranzacții)
- [ ] ✅ Import CSV PayPal (8 tranzacții)
- [ ] ✅ Categorizare manuală (minimum 10 tranzacții)
- [ ] ✅ Vizualizare rapoarte luna curentă
- [ ] ✅ Vizualizare rapoarte an curent
- [ ] ✅ Grafic categorii (Pie Chart) afișat corect
- [ ] ✅ Grafic bănci (Bar Chart) afișat corect
- [ ] ✅ Conversii valutare corecte (GBP, USD, EUR → RON)
- [ ] ✅ Paginare tranzacții funcționează
- [ ] ✅ Logout și relogin funcționează

---

## 📝 Note pentru Studenți

### Ce să Observați:

1. **Parsarea diferită per bancă:**
   - ING: Coloane "Debit" și "Credit" separate
   - BCR: Coloană unică "Suma" cu "Tip" (Debit/Credit)
   - Revolut: Format complex cu "Type", "Product", "State"
   - PayPal: Format CSV foarte detaliat cu multe coloane

2. **Conversii valutare:**
   - Toate sumele în GBP, USD, EUR sunt convertite în RON
   - Raportul folosește doar sumele în moneda nativă (RON)

3. **Categorii vs Tip:**
   - **Tip**: income sau expense (automat determinat)
   - **Categorie**: user o alege manual (supermarket, salariu, etc.)

4. **Date în diferite formate:**
   - ING: DD.MM.YYYY (01.11.2024)
   - BCR: DD.MM.YYYY
   - Revolut: YYYY-MM-DD HH:MM (2024-11-01 10:30)
   - PayPal: DD/MM/YYYY (15/09/2024)

---

## 🚀 Next Steps

După testare cu succes:

1. **Deploy pe Vercel** pentru access remote
2. **Adaugă AI categorization** pentru categorizare automată
3. **Integrare Exchange Rates API** pentru conversii automate
4. **Export PDF** pentru rapoarte printabile
5. **Notificări email** pentru bugete depășite

---

**Succes la testare! 🎉**

**Creat pentru cursul Vibe Coding**
© 2025 - Fișiere demo educaționale
