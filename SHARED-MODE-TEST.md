# Ghid Testing Shared Mode - Vibe Budget

## Status Transformare
✅ **Cod deployed pe Vercel:** https://vibe-budget-main.vercel.app
✅ **RLS Migration aplicat** în Supabase (26 policies șterse, 23 shared create)
✅ **16 API routes** modificate pentru shared access
✅ **GitHub commit:** 6d17b0e - "Transform to shared personal app"

---

## Test Manual - Verificare Shared Mode

### Pregătire
Ai nevoie de:
- 2 browsere diferite (sau Chrome + Chrome Incognito)
- 2 conturi de test (creează dacă nu există):
  - User 1: `test1@example.com` / `password123`
  - User 2: `test2@example.com` / `password123`

### Pași de testare

#### 1. Browser 1 - User 1 creează date

1. Deschide: https://vibe-budget-main.vercel.app/login
2. Login ca `test1@example.com`
3. Mergi la **Banks** → Adaugă o bancă:
   - Nume: "Test Bank User1"
   - IBAN: RO49TEST1234567890
   - Balanță: 1000 RON
4. Mergi la **Transactions** → Adaugă o tranzacție:
   - Descriere: "Test transaction from User1"
   - Sumă: -50 RON
5. **NU închide browser-ul** - lasă-l deschis pe dashboard

#### 2. Browser 2 - User 2 verifică shared access

1. Deschide Chrome Incognito: https://vibe-budget-main.vercel.app/login
2. Login ca `test2@example.com`
3. **VERIFICARE CRITICĂ:**
   - Mergi la **Banks** → Ar trebui să vezi "Test Bank User1" ✅
   - Mergi la **Transactions** → Ar trebui să vezi tranzacția lui User1 ✅

#### 3. Verificare bidirectională

1. În Browser 2 (User 2):
   - Adaugă o bancă: "Test Bank User2"
   - Adaugă o tranzacție: "Test transaction from User2"

2. În Browser 1 (User 1):
   - Refresh pagina Banks → Ar trebui să vezi "Test Bank User2" ✅
   - Refresh pagina Transactions → Ar trebui să vezi tranzacția lui User2 ✅

#### 4. Test Delete Shared

1. În Browser 2 (User 2):
   - Șterge "Test Bank User1" (creată de User1)
   - **Ar trebui să funcționeze** - oricine poate șterge orice ✅

2. În Browser 1 (User 1):
   - Refresh → "Test Bank User1" ar trebui să dispară ✅

---

## Comportament Așteptat (Shared Mode)

✅ **User 2 vede TOATE datele lui User 1** (banks, transactions, categories)
✅ **User 1 vede TOATE datele lui User 2**
✅ **Orice user poate modifica/șterge date create de alt user**
✅ **Nu există mesaje de eroare "nu îți aparține"**
✅ **Dashboard afișează statistici combinate pentru TOȚI userii**

---

## Teste Automate (Opțional)

```bash
# Test API direct (necesită cookie de autentificare)
curl https://vibe-budget-main.vercel.app/api/banks \
  -H "Cookie: sb-iumyeqhmpavbhdhcorcq-auth-token=COOKIE_HERE"

# Expected: Lista TOATE băncile (nu filtrate per user)
```

---

## Rollback (Dacă ceva nu merge)

Dacă shared mode creează probleme:

1. **Restaurează RLS policies vechi:**
   ```sql
   -- Rulează în Supabase SQL Editor
   -- TODO: Creează migration reverse (momentan nu există)
   ```

2. **Revert cod:**
   ```bash
   git revert 6d17b0e
   git push origin main
   ```

---

## Notițe Importante

⚠️ **NU folosi pentru SaaS public** - datele sunt complet partajate
✅ **Potrivit pentru:** familie, prieteni, shared household finances
🔒 **Auth încă funcționează** - doar useri autentificați au acces
📊 **userId păstrat** - pentru tracking "cine a creat ce" (dar nu filtrează)

---

## Status Testing

- [ ] Test manual completat (User1 → User2 vede date)
- [ ] Verificat delete shared (User2 șterge datele lui User1)
- [ ] Verificat bidirectional (ambii useri văd modificările celuilalt)
- [ ] Test production Vercel: https://vibe-budget-main.vercel.app

Completează checklist-ul după testare manuală.
