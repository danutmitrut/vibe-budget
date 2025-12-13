# 📄 PDF to CSV Converter - Plan Complet Aplicație Cross-Platform

## 🎯 Obiectiv

Aplicație **cross-platform** (iPhone, Android, Windows, macOS) pentru conversie extrase bancare PDF → CSV, funcționând **100% local** (fără upload cloud).

---

## 🏗️ Arhitectură Recomandată

### **Opțiunea 1: PWA (Progressive Web App) cu Next.js** ⭐⭐⭐ RECOMANDAT

**De ce PWA?**
- ✅ Un singur codebase pentru TOATE platformele
- ✅ Next.js (același stack ca Vibe Budget)
- ✅ Instalabil pe telefon & desktop (ca aplicație nativă)
- ✅ Offline-capable cu service workers
- ✅ Procesare 100% în browser (nu trimite PDF-ul nicăieri)
- ✅ Zero costuri backend

**Tech Stack:**
```
Frontend: Next.js 16 + React 19 + TypeScript
Styling: Tailwind CSS 4
PDF Parsing: PDF.js (Mozilla) - browser-compatible
CSV Generation: PapaParse (inversare - unparse)
File System: File System Access API (Chrome/Edge) + fallback
Deployment: Vercel (gratis)
```

---

## 📋 Features Complete

### **Core Features**
1. **Upload PDF** (drag & drop sau file picker)
2. **Preview tabel** (afișează ce a detectat din PDF)
3. **Edit manual** (corectare erori parsing)
4. **Export CSV** (download direct)
5. **Templates** (Revolut, ING, BT presets)
6. **Offline mode** (funcționează fără internet după prima încărcare)

### **Advanced Features**
7. **OCR Support** (pentru PDF-uri scanate - via Tesseract.js)
8. **Multi-page PDF** (procesare PDF cu 10-50 pagini)
9. **Auto-detect bank** (recunoaște format Revolut vs ING vs BT)
10. **Column mapping** (user alege ce coloană = dată, sumă, descriere)
11. **Batch processing** (upload 5-10 PDF-uri deodată)
12. **History** (salvează ultimele 10 conversii în localStorage)

---

## 🎨 UI/UX Design

### **Layout Principal (Single Page App)**

```
┌─────────────────────────────────────────┐
│  PDF to CSV Converter                   │
│  [Logo] [Home] [History] [Settings]    │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐  │
│   │   📄 Drag & Drop PDF here       │  │
│   │   or click to browse            │  │
│   │                                  │  │
│   │   [Upload PDF Button]           │  │
│   └─────────────────────────────────┘  │
│                                         │
│   Bank Template:                        │
│   [Revolut ▼] [ING] [BT] [Generic]    │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │ Preview Table (10 rows)         │  │
│   │ ┌─────┬──────┬──────┬──────┐   │  │
│   │ │Date │Desc  │Amount│Currency│   │  │
│   │ ├─────┼──────┼──────┼──────┤   │  │
│   │ │05.12│MEGA  │-45.99│RON     │   │  │
│   │ │04.12│Uber  │-32.50│RON     │   │  │
│   │ └─────┴──────┴──────┴──────┘   │  │
│   └─────────────────────────────────┘  │
│                                         │
│   [Edit Table] [Download CSV]          │
│                                         │
└─────────────────────────────────────────┘
```

### **Workflow Steps**

```
Step 1: Upload PDF
    ↓
Step 2: Select Bank Template (auto-detect sau manual)
    ↓
Step 3: Preview extracted data în tabel
    ↓
Step 4: (Optional) Edit manual erori
    ↓
Step 5: Download CSV
```

---

## 🔧 Implementare Tehnică

### **1. PDF Parsing cu PDF.js**

```typescript
// lib/pdf-parser/pdf-to-csv.ts
import * as pdfjsLib from 'pdfjs-dist';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
}

export async function parsePDF(file: File): Promise<Transaction[]> {
  // Load PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const transactions: Transaction[] = [];

  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract text items
    const items = textContent.items.map((item: any) => item.str);

    // Parse transactions (logic specific pe bancă)
    const pageTransactions = parseTransactionsFromText(items);
    transactions.push(...pageTransactions);
  }

  return transactions;
}

function parseTransactionsFromText(textItems: string[]): Transaction[] {
  // Detectează pattern-uri specifice:
  // Revolut: "05 Dec 2025  MEGA IMAGE  -45.99 RON"
  // ING: "05.12.2025  Transfer  100.00  RON"
  // BT: Similar la ING

  const transactions: Transaction[] = [];

  // Regex pentru Revolut
  const revolutPattern = /(\d{2}\s+\w{3}\s+\d{4})\s+(.+?)\s+([-+]?\d+\.\d{2})\s+(\w{3})/g;

  const text = textItems.join(' ');
  let match;

  while ((match = revolutPattern.exec(text)) !== null) {
    transactions.push({
      date: convertDate(match[1]), // "05 Dec 2025" -> "2025-12-05"
      description: match[2].trim(),
      amount: parseFloat(match[3]),
      currency: match[4]
    });
  }

  return transactions;
}

function convertDate(dateStr: string): string {
  // "05 Dec 2025" -> "2025-12-05"
  // Sau "05.12.2025" -> "2025-12-05"
  // ... (logic similar cu file-parser.ts din Vibe Budget)
}
```

### **2. Bank Templates (Preset Patterns)**

```typescript
// lib/pdf-parser/bank-templates.ts

export interface BankTemplate {
  id: string;
  name: string;
  pattern: RegExp;
  dateFormat: string;
  columnOrder: string[];
}

export const BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'revolut',
    name: 'Revolut România',
    pattern: /(\d{2}\s+\w{3}\s+\d{4})\s+(.+?)\s+([-+]?\d+\.\d{2})\s+(\w{3})/g,
    dateFormat: 'DD MMM YYYY',
    columnOrder: ['date', 'description', 'amount', 'currency']
  },
  {
    id: 'ing',
    name: 'ING Bank România',
    pattern: /(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(\d+\.\d{2})\s+(\w{3})/g,
    dateFormat: 'DD.MM.YYYY',
    columnOrder: ['date', 'description', 'amount', 'currency']
  },
  {
    id: 'bt',
    name: 'Banca Transilvania',
    pattern: /(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([-+]?\d+\.\d{2})/g,
    dateFormat: 'DD.MM.YYYY',
    columnOrder: ['date', 'description', 'amount']
  }
];

export function autoDetectBank(text: string): BankTemplate | null {
  // Caută keywords specifice în PDF
  if (text.includes('Revolut') || text.includes('REVOLUT')) {
    return BANK_TEMPLATES.find(t => t.id === 'revolut') || null;
  }

  if (text.includes('ING Bank') || text.includes('ING BANK')) {
    return BANK_TEMPLATES.find(t => t.id === 'ing') || null;
  }

  if (text.includes('Banca Transilvania') || text.includes('BT')) {
    return BANK_TEMPLATES.find(t => t.id === 'bt') || null;
  }

  return null; // Generic template
}
```

### **3. CSV Export**

```typescript
// lib/csv-exporter.ts
import Papa from 'papaparse';

export function exportToCSV(transactions: Transaction[]): string {
  // Convert la format CSV
  const csv = Papa.unparse(transactions, {
    columns: ['date', 'description', 'amount', 'currency'],
    header: true
  });

  return csv;
}

export function downloadCSV(csv: string, filename: string = 'transactions.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  URL.revokeObjectURL(link.href);
}
```

### **4. PWA Setup (Offline Support)**

```javascript
// public/sw.js (Service Worker)
const CACHE_NAME = 'pdf-to-csv-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/_next/static/css/*.css',
  '/_next/static/js/*.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

```json
// public/manifest.json (PWA Manifest)
{
  "name": "PDF to CSV Converter",
  "short_name": "PDF2CSV",
  "description": "Convert bank statement PDFs to CSV locally",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📱 Instalare pe Platforme

### **iOS (iPhone/iPad)**
1. Deschide site-ul în Safari
2. Tap pe "Share" (iconița share)
3. Scroll jos → "Add to Home Screen"
4. Iconița apare pe home screen ca app

### **Android**
1. Deschide site-ul în Chrome
2. Tap pe "⋮" (trei puncte)
3. "Install app" sau "Add to Home Screen"
4. Iconița apare în launcher

### **Windows**
1. Deschide site-ul în Edge sau Chrome
2. Click pe "⋯" → "Apps" → "Install this site as an app"
3. Apare în Start Menu

### **macOS**
1. Deschide în Chrome/Edge
2. Similar cu Windows (Install as app)
3. Sau folosește Safari → "Add to Dock"

---

## 🔐 Securitate & Privacy

### **IMPORTANT: Zero Backend = Zero Privacy Risk**

✅ **Avantaje:**
- PDF-ul NU este niciodată uploadat pe server
- Procesare 100% în browser (JavaScript local)
- Date financiare NU părăsesc device-ul
- NU necesită cont sau login

✅ **Best Practices:**
- Afișează clar: "Processing happens locally in your browser"
- NO analytics tracking (respect privacy)
- NO cookies (doar localStorage pentru history - optional)

---

## 🚀 Plan Implementare (3-5 Zile)

### **Ziua 1: Setup Proiect & UI**
- [ ] `npx create-next-app@latest pdf-to-csv-converter`
- [ ] Setup Tailwind CSS
- [ ] Design UI principal (upload + preview table)
- [ ] Test file upload (drag & drop)

### **Ziua 2: PDF Parsing Logic**
- [ ] Instalează `pdfjs-dist`
- [ ] Implementează `parsePDF()` function
- [ ] Test cu PDF Revolut real
- [ ] Debugging extraction (console.log items)

### **Ziua 3: Bank Templates & Auto-Detect**
- [ ] Creează templates pentru Revolut, ING, BT
- [ ] Implementează auto-detect
- [ ] UI pentru select template manual
- [ ] Test cu PDF-uri de la toate băncile

### **Ziua 4: CSV Export & PWA**
- [ ] CSV generation cu PapaParse
- [ ] Download button
- [ ] PWA setup (manifest.json + service worker)
- [ ] Test offline mode

### **Ziua 5: Polish & Testing**
- [ ] Edit table functionality (corectare manuală)
- [ ] History (localStorage ultimele 10 conversii)
- [ ] Error handling (PDF invalid, parsing failed)
- [ ] Test pe toate platformele (iOS, Android, Windows, macOS)

---

## 📦 Package.json Dependencies

```json
{
  "dependencies": {
    "next": "16.0.7",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "typescript": "^5",
    "tailwindcss": "^4",
    "pdfjs-dist": "^4.0.0",
    "papaparse": "^5.5.3"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/papaparse": "^5.5.1",
    "@types/node": "^20"
  }
}
```

---

## 🎯 Extensii Viitoare

### **Opțional (După MVP)**
1. **OCR Support** - Pentru PDF-uri scanate (Tesseract.js)
2. **Multi-language** - Română + Engleză
3. **Dark Mode** - Pentru utilizare nocturnă
4. **Export formats** - JSON, Excel (XLSX)
5. **Integration cu Vibe Budget** - Import direct în app
6. **AI Enhancement** - Claude pentru corectare auto-detecții
7. **Batch processing** - Upload 10 PDF-uri deodată

---

## 💡 Alternative: React Native + Expo (Mobile-First)

Dacă vrei **app nativ** pentru iOS/Android (nu PWA):

```bash
# Setup
npx create-expo-app pdf-to-csv-mobile --template blank-typescript

# Install dependencies
npx expo install expo-document-picker expo-file-system expo-sharing

# PDF parsing
npm install react-native-pdf
```

**Avantaje:**
- ✅ Native feel (gestures, animations)
- ✅ Better file system access
- ✅ App Store & Google Play distribution

**Dezavantaje:**
- ❌ Nu funcționează pe desktop (Windows/macOS)
- ❌ Două codebases (mobile + desktop separate)

---

## 📊 Comparație Finală: PWA vs React Native

| Criteriu | PWA (Next.js) | React Native + Expo |
|----------|---------------|---------------------|
| **Platforme** | ✅ iOS, Android, Windows, macOS, Linux | ✅ iOS, Android (❌ desktop) |
| **Instalare** | Browser → Add to Home Screen | App Store / Google Play |
| **Offline** | ✅ Service Workers | ✅ Native offline |
| **File Access** | ⚠️ Limited (File System Access API) | ✅ Full access |
| **Development** | 1 codebase | 1 codebase (mobile only) |
| **Deployment** | Vercel (gratis, instant) | TestFlight + Play Console |
| **Updates** | Instant (reload page) | App Store review process |
| **Bundle Size** | ~5-10 MB (cached) | ~50-100 MB (native app) |

---

## ✅ Recomandarea Finală

### **Pentru cerința ta (toate platformele):** PWA cu Next.js ⭐⭐⭐

**De ce:**
1. Un singur codebase pentru TOATE platformele
2. Același tech stack ca Vibe Budget (ușor pentru cursanți)
3. Zero backend costs
4. Instant deployment (Vercel)
5. Privacy by design (procesare locală)

**Next Steps:**
1. Creez proiect Next.js separat: `pdf-to-csv-converter/`
2. Implementez MVP (Ziua 1-5 din plan)
3. Testăm pe iOS, Android, Windows, macOS
4. Îl pot integra ulterior în Vibe Budget sau păstrăm standalone

---

**Vrei să încep implementarea? Sau preferi varianta React Native pentru mobile?**

**Versiune:** 1.0
**Data:** Decembrie 2025
**Status:** 📋 Plan Ready - Aștept confirmare pentru implementare
