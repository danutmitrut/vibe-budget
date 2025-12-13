# Ghid Complet: Parsare Excel cu Diacritice Românești

## Contextul Problemei

Când lucrezi cu fișiere Excel exportate din aplicații românești (Revolut, bănci, etc.), vei întâlni două probleme majore:

1. **Excel Serial Numbers**: Excel stochează datele ca numere (zile de la 1 ianuarie 1900)
2. **Encodare Diacritice**: Excel exportă `Ă` (A-breve) ca `Ä` (A-umlaut)

## Problema Reală Întâlnită

### Ce am primit din Revolut România:
```
Coloană Excel: "Data de Änceput" (cu Ä în loc de Ă)
Valoare: 45996.338541666664 (Excel serial number)

Coloană Excel: "SumÄ " (cu Ä și spațiu la final!)
Valoare: -3.99
```

### Ce așteptam:
```
Coloană: "Data de Început"
Valoare: "2025-12-05"

Coloană: "Sumă"
Valoare: -3.99
```

## Soluția Completă

### 1. Normalizare Coloane cu Diacritice

**Problema**: Excel exportă `Ă` → `Ä`, plus adaugă spații invizibile.

**Soluție**:
```typescript
function detectAmount(row: any): string | null {
  // Adăugăm TOATE variantele posibile de diacritice
  const amountKeys = [
    "sumă",   // Ă corect (A-breve)
    "sumä",   // Ä exportat de Excel (A-umlaut)
    "suma",   // Fără diacritice
    "amount",
    "valoare",
    "value",
    "total"
  ];

  for (const key of Object.keys(row)) {
    // IMPORTANT: lowercase + trim pentru a elimina spații
    const normalizedKey = key.toLowerCase().trim();

    if (amountKeys.some((k) => normalizedKey.includes(k))) {
      return row[key];
    }
  }

  return null;
}
```

**De ce funcționează**:
- `.toLowerCase()` → "SumÄ " devine "sumä "
- `.trim()` → "sumä " devient "sumä"
- `.includes("sumä")` → MATCH! ✅

### 2. Conversie Excel Serial Numbers

**Problema**: Excel stochează `2025-12-05` ca `45996.338541666664`

**Explicație**:
- Excel numără zilele de la **1 ianuarie 1900**
- `45996` = 45996 zile după 1 ian 1900 = 5 dec 2025
- Partea decimală (`.338...`) = ora din zi (ignorăm)

**Formula de Conversie**:
```typescript
function excelSerialToDate(serial: number): string {
  // Excel epoch: 1 ianuarie 1900
  const excelEpoch = new Date(1900, 0, 1);

  // Excel are un BUG: consideră 1900 an bisect (nu e!)
  // Din cauza asta scădem 2 zile, nu 0
  const days = Math.floor(serial) - 2;

  // Convertim zile în milisecunde
  const milliseconds = days * 24 * 60 * 60 * 1000;

  // Calculăm data finală
  const date = new Date(excelEpoch.getTime() + milliseconds);

  // Formatăm ca YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
```

**Test**:
```typescript
excelSerialToDate(45996.338541666664)
// Output: "2025-12-05" ✅
```

**Detectare Automată**:
```typescript
function formatDate(dateStr: string | number): string {
  // Convertim la număr
  const asNumber = typeof dateStr === 'number' ? dateStr : parseFloat(String(dateStr));

  // Verificăm dacă e Excel serial (40000-60000 = 2009-2064)
  if (!isNaN(asNumber) && asNumber > 40000 && asNumber < 60000) {
    return excelSerialToDate(asNumber);
  }

  // Altfel, parsăm ca string normal
  // ... (alte formate)
}
```

### 3. Database Schema: Date vs Timestamp

**Problema Inițială**:
```typescript
// ❌ GREȘIT - timestamp nu acceptă string direct
date: timestamp("date").notNull()

// În API trimitem:
date: new Date("2025-12-05") // Creează timezone issues!
```

**Rezultat**: PostgreSQL salvează `NULL` pentru toate datele.

**Soluția**:
```typescript
// ✅ CORECT - date acceptă string YYYY-MM-DD
import { date } from "drizzle-orm/pg-core";

date: date("date", { mode: 'string' }).notNull()

// În API trimitem direct string:
date: "2025-12-05" // ✅ Funcționează perfect!
```

**Migrație SQL** (executată în Supabase):
```sql
-- Schimbă tipul coloanei de la TIMESTAMP la DATE
ALTER TABLE transactions ADD COLUMN date_new DATE;
UPDATE transactions SET date_new = date::date WHERE date IS NOT NULL;
ALTER TABLE transactions DROP COLUMN date;
ALTER TABLE transactions RENAME COLUMN date_new TO date;
ALTER TABLE transactions ALTER COLUMN date SET NOT NULL;
```

### 4. Fix Date Comparisons în Queries

**Problema**:
```typescript
// ❌ GREȘIT - date e acum string, nu Date object
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const transactions = await db
  .select()
  .where(gte(schema.transactions.date, threeMonthsAgo)); // TypeScript error!
```

**Soluția**:
```typescript
// ✅ CORECT - convertim Date → string YYYY-MM-DD
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

const transactions = await db
  .select()
  .where(gte(schema.transactions.date, threeMonthsAgoStr)); // ✅
```

### 5. Fix Date Display în Frontend

**Problema**:
```typescript
// ❌ GREȘIT - timezone conversion schimbă ziua!
{new Date(transaction.date).toLocaleDateString("ro-RO")}
// "2025-12-05" → 04.12.2025 (ziua anterioară!)
```

**Soluția**:
```typescript
// ✅ CORECT - parsăm direct string-ul YYYY-MM-DD
{(() => {
  const dateStr = String(transaction.date).split('T')[0];

  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
  }

  return dateStr; // Fallback
})()}
```

## Flow Complet de la Excel la Display

```
1. EXCEL FILE
   └─ "Data de Änceput": 45996.338541666664
   └─ "SumÄ ": -3.99

2. PARSING (lib/utils/file-parser.ts)
   └─ detectDate() → găsește "änceput" (normalized)
   └─ formatDate() → detectează Excel serial number
   └─ excelSerialToDate(45996.338...) → "2025-12-05"

3. API UPLOAD (app/api/transactions/route.ts)
   └─ Primește: { date: "2025-12-05", amount: -3.99 }
   └─ Trimite la DB: date: "2025-12-05" (string, nu Date object!)

4. POSTGRESQL (Supabase)
   └─ Coloană: date DATE NOT NULL
   └─ Salvează: "2025-12-05" (fără timezone, doar data)

5. API GET (app/api/transactions/route.ts)
   └─ PostgreSQL returnează: { date: "2025-12-05" }
   └─ Trimite la frontend: { date: "2025-12-05" }

6. FRONTEND DISPLAY (app/dashboard/transactions/page.tsx)
   └─ Parsează "2025-12-05" → [2025, 12, 05]
   └─ Afișează: "05.12.2025" (format românesc)
```

## Checklist pentru Debugging

Când parsezi Excel cu probleme, verifică:

### ✅ 1. Encoding Diacritice
```bash
# În browser console după upload:
console.log(Object.keys(row))
# Cauți: "SumÄ" (nu "Sumă")? → Adaugă "sumä" la keywords
```

### ✅ 2. Excel Serial Numbers
```bash
# Verifică tipul și valoarea:
console.log(typeof dateValue, dateValue)
# Dacă vezi: "number 45996.xxx" → Excel serial!
```

### ✅ 3. Database Schema
```sql
-- Verifică tipul coloanei în PostgreSQL:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'date';

-- Dacă vezi "timestamp with time zone" → Schimbă la "date"
```

### ✅ 4. API Request/Response
```bash
# În Network tab, verifică POST /api/transactions:
# Request payload:
{ "date": "2025-12-05" }  # ✅ String, nu Date object

# Response:
{ "date": "2025-12-05" }  # ✅ Tot string
```

### ✅ 5. Frontend Display
```bash
# În browser console:
console.log(transaction.date, typeof transaction.date)
# Ar trebui: "2025-12-05" "string"
```

## Erori Comune și Soluții

### Eroare 1: "undefined.undefined.null"
**Cauză**: PostgreSQL returnează `null` pentru toate datele.
**Soluție**: Schema folosește `timestamp` dar trimiți string → Schimbă la `date`.

### Eroare 2: Toate datele sunt "01.01.1970"
**Cauză**: Frontend convertește greșit date string cu `new Date()`.
**Soluție**: Parsează direct string-ul fără Date object.

### Eroare 3: "No amount found in row"
**Cauză**: Coloana Excel are diacritice (`Ä`) sau spații invizibile.
**Soluție**: Adaugă variante + `.toLowerCase().trim()`.

### Eroare 4: TypeScript - "Date is not assignable to string"
**Cauză**: După schimbare schema la `date` (string), ai rămas cu `new Date()`.
**Soluție**: Convertește toate Date objects la string cu `.toISOString().split('T')[0]`.

## Lecții Învățate

1. **Nu te încrede în Excel**: Verifică ÎNTOTDEAUNA ce encoding folosește
2. **Date ≠ Timestamp**: Dacă nu ai nevoie de oră, folosește `date` (mai simplu!)
3. **String > Date Object**: Pentru date simple, string-urile YYYY-MM-DD sunt mai safe
4. **Normalizare**: Lowercase + Trim + Multiple Variante = Parsing robust
5. **Debug Step-by-Step**: Verifică fiecare transformare (Excel → Parse → DB → API → Frontend)

## Resurse Suplimentare

- [Excel Date System](https://support.microsoft.com/en-us/office/date-systems-in-excel-e7fe7167-48a9-4b96-bb53-5612a800b487)
- [PostgreSQL Date Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Drizzle ORM Date Columns](https://orm.drizzle.team/docs/column-types/pg#date)
- [JavaScript Date Timezone Issues](https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off)

---

**Autor**: Sesiune Claude Code cu Dan
**Data**: Decembrie 2025
**Status**: ✅ Testat și funcțional cu Revolut România Excel exports
