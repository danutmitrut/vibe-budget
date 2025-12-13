/**
 * UTILITĂȚI PARSARE FIȘIERE
 *
 * EXPLICAȚIE:
 * Funcții pentru parsarea fișierelor CSV, Excel și PDF în tranzacții.
 *
 * CONCEPTE:
 * - CSV = Comma-Separated Values (valori separate prin virgulă)
 * - Excel = Format binar (.xlsx) al Microsoft
 * - PDF = Portable Document Format (extrase bancare)
 * - Parser = Funcție care transformă text/binary în obiecte JavaScript
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";

/**
 * Tipul pentru o tranzacție parsată
 */
export interface ParsedTransaction {
  date: string; // Format: YYYY-MM-DD
  description: string;
  amount: number;
  currency?: string;
  type?: "debit" | "credit";
  originalData?: any; // Datele originale din fișier
}

/**
 * Rezultatul parsării
 */
export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  error?: string;
  rowCount?: number;
}

/**
 * FUNCȚIA 1: Parse CSV
 *
 * Parsează un fișier CSV și extrage tranzacțiile.
 *
 * PARAMETRI:
 * @param file - Fișierul CSV (File object din input)
 * @returns Promise cu rezultatul parsării
 *
 * EXEMPLU CSV:
 * Data,Descriere,Suma,Moneda
 * 01.12.2025,MEGA IMAGE,-45.50,RON
 * 02.12.2025,Salariu,5000.00,RON
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true, // Prima linie = header-e (nume coloane)
      skipEmptyLines: true, // Ignoră liniile goale
      complete: (results) => {
        try {
          // Verificăm dacă avem date
          if (!results.data || results.data.length === 0) {
            resolve({
              success: false,
              transactions: [],
              error: "Fișierul CSV este gol",
            });
            return;
          }

          // Transformăm fiecare rând în tranzacție
          const transactions: ParsedTransaction[] = [];

          results.data.forEach((row: any, index: number) => {
            try {
              // Detectăm automat coloanele (flexibil pentru diverse formate)
              const date = detectDate(row);
              const description = detectDescription(row);
              const amount = detectAmount(row);
              const currency = detectCurrency(row);

              if (date && description && amount !== null) {
                transactions.push({
                  date: formatDate(date),
                  description: description.trim(),
                  amount: parseFloat(amount),
                  currency: currency || "RON",
                  type: parseFloat(amount) < 0 ? "debit" : "credit",
                  originalData: row, // Păstrăm datele originale
                });
              }
            } catch (err) {
              console.warn(`Eroare la parsarea rândului ${index + 1}:`, err);
            }
          });

          resolve({
            success: true,
            transactions,
            rowCount: results.data.length,
          });
        } catch (error: any) {
          resolve({
            success: false,
            transactions: [],
            error: error.message,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          transactions: [],
          error: error.message,
        });
      },
    });
  });
}

/**
 * FUNCȚIA 2: Parse Excel
 *
 * Parsează un fișier Excel (.xlsx) și extrage tranzacțiile.
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            transactions: [],
            error: "Nu s-a putut citi fișierul",
          });
          return;
        }

        // Parsăm Excel-ul
        const workbook = XLSX.read(data, { type: "binary" });

        // Luăm prima foaie (sheet)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertim în JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          resolve({
            success: false,
            transactions: [],
            error: "Fișierul Excel este gol",
          });
          return;
        }

        // Transformăm în tranzacții (similar cu CSV)
        const transactions: ParsedTransaction[] = [];

        jsonData.forEach((row: any) => {
          try {
            const date = detectDate(row);
            const description = detectDescription(row);
            const amount = detectAmount(row);
            const currency = detectCurrency(row);

            if (date && description && amount !== null) {
              transactions.push({
                date: formatDate(date),
                description: description.trim(),
                amount: parseFloat(amount),
                currency: currency || "RON",
                type: parseFloat(amount) < 0 ? "debit" : "credit",
                originalData: row,
              });
            }
          } catch (err) {
            console.warn("Eroare la parsarea rândului:", err);
          }
        });

        resolve({
          success: true,
          transactions,
          rowCount: jsonData.length,
        });
      } catch (error: any) {
        resolve({
          success: false,
          transactions: [],
          error: error.message,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        error: "Eroare la citirea fișierului",
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * FUNCȚIA 3: Parse PDF
 *
 * Parsează un fișier PDF (extrase bancare) și extrage tranzacțiile.
 *
 * BĂNCI SUPORTATE:
 * - ING Bank Romania (format standard)
 * - BCR (format standard)
 * - BRD (format standard)
 * - Revolut (format standard)
 *
 * IMPORTANT: PDF-urile trebuie să fie text-based, nu scanări (imagini).
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve({
            success: false,
            transactions: [],
            error: "Nu s-a putut citi fișierul PDF",
          });
          return;
        }

        // Parsăm PDF-ul
        const data = await pdf(Buffer.from(arrayBuffer));
        const text = data.text;

        console.log('[parsePDF] Extracted text length:', text.length);
        console.log('[parsePDF] First 500 chars:', text.substring(0, 500));

        if (!text || text.trim().length === 0) {
          resolve({
            success: false,
            transactions: [],
            error: "PDF-ul este gol sau este o imagine scanată (nu conține text)",
          });
          return;
        }

        // Parsăm textul în tranzacții folosind pattern matching
        const transactions = parsePDFTextToTransactions(text);

        if (transactions.length === 0) {
          resolve({
            success: false,
            transactions: [],
            error: "Nu s-au putut extrage tranzacții din PDF. Format nesuportat sau PDF scanat.",
          });
          return;
        }

        resolve({
          success: true,
          transactions,
          rowCount: transactions.length,
        });
      } catch (error: any) {
        console.error('[parsePDF] Error:', error);
        resolve({
          success: false,
          transactions: [],
          error: error.message || "Eroare la parsarea PDF-ului",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        error: "Eroare la citirea fișierului PDF",
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * HELPER: Parsează textul extras din PDF în tranzacții
 *
 * Caută pattern-uri comune în extrase bancare:
 * - Data (DD.MM.YYYY sau DD/MM/YYYY)
 * - Suma (cu - sau + prefix, sau coloane separate Debit/Credit)
 * - Descriere
 */
function parsePDFTextToTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  console.log('[parsePDFText] Processing', lines.length, 'lines');

  // Pattern pentru ING/BCR/BRD: DD.MM.YYYY ... Descriere ... -123.45 RON
  // Pattern pentru Revolut: DD MMM YYYY ... Descriere ... -123.45 RON
  const patterns = [
    // Pattern 1: DD.MM.YYYY sau DD/MM/YYYY la început de linie
    /^(\d{2}[.\/]\d{2}[.\/]\d{4})\s+(.+?)\s+([-+]?\d+[,.]?\d*)\s*(\w{3})?/,

    // Pattern 2: Revolut style - DD MMM YYYY
    /^(\d{2}\s+\w{3}\s+\d{4})\s+(.+?)\s+([-+]?\d+[,.]?\d*)\s*(\w{3})?/,

    // Pattern 3: Format cu descriere mai lungă
    /(\d{2}[.\/]\d{2}[.\/]\d{4})\s+(.{10,}?)\s+([-+]?\d+[,.]?\d*)\s*(\w{3})?$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip linii goale sau prea scurte
    if (line.length < 10) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match) {
        try {
          const dateStr = match[1];
          const description = match[2].trim();
          const amountStr = match[3].replace(',', '.'); // RON folosește virgulă
          const currency = match[4] || 'RON';

          // Validări
          if (!description || description.length < 3) continue;
          if (isNaN(parseFloat(amountStr))) continue;

          const amount = parseFloat(amountStr);

          transactions.push({
            date: formatDate(dateStr),
            description: description.substring(0, 200), // Limitează lungimea
            amount: amount,
            currency: currency,
            type: amount < 0 ? 'debit' : 'credit',
          });

          console.log(`[parsePDFText] Found transaction: ${dateStr} | ${description.substring(0, 30)} | ${amount} ${currency}`);
          break; // Am găsit match, trecem la următoarea linie
        } catch (err) {
          console.warn('[parsePDFText] Failed to parse line:', line, err);
        }
      }
    }
  }

  return transactions;
}

/**
 * FUNCȚII HELPER - Detectare automată coloane
 *
 * Aceste funcții încearcă să ghicească care coloană conține ce informație.
 * Funcționează cu diverse formate de extrase bancare.
 */

function detectDate(row: any): string | null {
  // Căutăm o coloană care arată ca o dată
  // Adăugăm "completed" pentru Revolut (Completed Date)
  const dateKeys = ["completed", "data", "date", "data operatiunii", "data tranzactiei"];

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (dateKeys.some((k) => lowerKey.includes(k))) {
      const dateValue = row[key];
      console.log('[detectDate] Found date column:', key, '→', JSON.stringify(dateValue));
      return dateValue;
    }
  }

  // Dacă nu găsim, luăm prima coloană care arată ca o dată
  for (const value of Object.values(row)) {
    if (typeof value === "string" && isDate(value)) {
      console.log('[detectDate] Found date by pattern:', JSON.stringify(value));
      return value;
    }
  }

  console.warn('[detectDate] No date found in row:', row);
  return null;
}

function detectDescription(row: any): string | null {
  const descKeys = ["descriere", "description", "detalii", "details", "beneficiar"];

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (descKeys.some((k) => lowerKey.includes(k))) {
      return row[key];
    }
  }

  return null;
}

function detectAmount(row: any): string | null {
  const amountKeys = ["suma", "amount", "valoare", "value", "total"];

  // Căutăm o coloană cu suma
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (amountKeys.some((k) => lowerKey.includes(k))) {
      return row[key];
    }
  }

  // Dacă nu găsim, verificăm dacă există coloane separate Debit/Credit (format ING)
  const debitKeys = ["debit"];
  const creditKeys = ["credit"];

  let debitValue: string | null = null;
  let creditValue: string | null = null;

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (debitKeys.some((k) => lowerKey.includes(k))) {
      debitValue = row[key];
    }
    if (creditKeys.some((k) => lowerKey.includes(k))) {
      creditValue = row[key];
    }
  }

  // Dacă avem Debit/Credit, returnăm valoarea care nu e goală
  // Debit = negativ (cheltuială), Credit = pozitiv (venit)
  if (debitValue && debitValue.trim() !== "") {
    return `-${debitValue}`;
  }
  if (creditValue && creditValue.trim() !== "") {
    return creditValue;
  }

  return null;
}

function detectCurrency(row: any): string | null {
  const currencyKeys = ["moneda", "currency", "valuta"];

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (currencyKeys.some((k) => lowerKey.includes(k))) {
      return row[key];
    }
  }

  return null;
}

/**
 * Verifică dacă un string arată ca o dată
 */
function isDate(str: string): boolean {
  // Formate acceptate: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYY-MM-DD HH:MM (cu timestamp)
  const dateRegex = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$|^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2})?$/;
  return dateRegex.test(str);
}

/**
 * Formatează data în format ISO (YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  // DEBUG: Log intrare
  console.log('[formatDate] Input:', JSON.stringify(dateStr), 'Type:', typeof dateStr);

  // Validare: dacă nu primim string valid, returnăm data curentă
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn('[formatDate] Invalid date string:', dateStr);
    return new Date().toISOString().split("T")[0];
  }

  // Curățăm string-ul (trim whitespace)
  const cleanStr = dateStr.trim();
  console.log('[formatDate] After trim:', JSON.stringify(cleanStr));

  // Dacă e deja ISO format (cu sau fără timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    // Extragem doar partea de dată (fără timestamp)
    const result = cleanStr.split(" ")[0].split("T")[0];
    console.log('[formatDate] ISO format detected. Result:', result);
    return result;
  }

  // Format Revolut: DD MMM YYYY (ex: "01 Dec 2024")
  const revolutPattern = /^(\d{2})\s+(\w{3})\s+(\d{4})$/;
  const revolutMatch = cleanStr.match(revolutPattern);

  if (revolutMatch) {
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const day = revolutMatch[1];
    const monthName = revolutMatch[2];
    const year = revolutMatch[3];
    const month = monthMap[monthName];

    if (month) {
      const result = `${year}-${month}-${day}`;
      console.log('[formatDate] Revolut format detected. Result:', result);
      return result;
    }
  }

  // Parsăm formate românești: DD.MM.YYYY sau DD/MM/YYYY
  const parts = cleanStr.split(/[./-]/);
  console.log('[formatDate] Parsed parts:', parts);

  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const result = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    console.log('[formatDate] Romanian format detected. Result:', result);
    return result;
  }

  // Fallback: returnăm data curentă (cu warning)
  console.warn('[formatDate] Could not parse date, using current date:', dateStr);
  return new Date().toISOString().split("T")[0];
}
