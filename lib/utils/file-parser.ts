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

        console.log('[parseExcel] Sheet name:', sheetName);
        console.log('[parseExcel] Total rows:', jsonData.length);
        console.log('[parseExcel] First row sample:', jsonData[0]);
        console.log('[parseExcel] Column headers:', Object.keys(jsonData[0] || {}));

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

        jsonData.forEach((row: any, index: number) => {
          try {
            const date = detectDate(row);
            const description = detectDescription(row);
            const amount = detectAmount(row);
            const currency = detectCurrency(row);

            if (index < 3) {
              console.log(`[parseExcel] Row ${index}:`, {
                date,
                description,
                amount,
                currency,
                rawRow: row
              });
            }

            if (date && description && amount !== null) {
              transactions.push({
                date: formatDate(date),
                description: description.trim(),
                amount: parseFloat(amount),
                currency: currency || "RON",
                type: parseFloat(amount) < 0 ? "debit" : "credit",
                originalData: row,
              });
            } else {
              if (index < 5) {
                console.warn(`[parseExcel] Skipping row ${index} - missing data:`, {
                  hasDate: !!date,
                  hasDescription: !!description,
                  hasAmount: amount !== null,
                  row
                });
              }
            }
          } catch (err) {
            console.warn(`[parseExcel] Eroare la parsarea rândului ${index}:`, err);
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
 * FUNCȚIA 3: Parse PDF - TEMPORAR DEZACTIVATĂ
 *
 * PDF parsing este complex în environment serverless.
 *
 * ALTERNATIVE PENTRU UTILIZATORI:
 * 1. Convertiți PDF → CSV folosind https://www.ilovepdf.com/pdf_to_excel
 * 2. Majoritatea băncilor oferă export CSV direct din aplicație
 * 3. Folosiți Google Sheets pentru a deschide PDF și exporta ca CSV
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  return {
    success: false,
    transactions: [],
    error: 'PDF support este temporar indisponibil. Vă rugăm să convertești PDF-ul în CSV folosind https://www.ilovepdf.com/pdf_to_excel sau să descărcați extractul direct în format CSV de la bancă.',
  };
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
  // Adăugăm "început" pentru Revolut România (Data de început)
  const dateKeys = ["completed", "data", "date", "început", "inceput", "start", "data operatiunii", "data tranzactiei"];

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
  // Adăugăm variante cu diacritice pentru Revolut România
  const descKeys = ["descriere", "description", "detalii", "details", "beneficiar"];

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (descKeys.some((k) => lowerKey.includes(k))) {
      console.log('[detectDescription] Found description column:', key, '→', row[key]);
      return row[key];
    }
  }

  console.warn('[detectDescription] No description found in row:', Object.keys(row));
  return null;
}

function detectAmount(row: any): string | null {
  // Adăugăm "sumă" cu diacritice pentru Revolut România
  const amountKeys = ["sumă", "suma", "amount", "valoare", "value", "total"];

  // DEBUG: Afișăm toate cheile pentru a vedea ce primim exact
  console.log('[detectAmount] All keys in row:', Object.keys(row).map(k => `"${k}"`));

  // Căutăm o coloană cu suma
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim(); // Adăugăm trim() pentru spații
    console.log('[detectAmount] Checking key:', `"${key}"`, '→ lowercase:', `"${lowerKey}"`);
    if (amountKeys.some((k) => lowerKey.includes(k))) {
      console.log('[detectAmount] Found amount column:', key, '→', row[key]);
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
    console.log('[detectAmount] Found debit value:', debitValue);
    return `-${debitValue}`;
  }
  if (creditValue && creditValue.trim() !== "") {
    console.log('[detectAmount] Found credit value:', creditValue);
    return creditValue;
  }

  console.warn('[detectAmount] No amount found in row:', Object.keys(row));
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
 * Convertește Excel serial number în dată
 * Excel stochează datele ca număr de zile de la 1 ianuarie 1900
 */
function excelSerialToDate(serial: number): string {
  // Excel epoch: 1 ianuarie 1900 (cu bug: consideră 1900 an bisect)
  const excelEpoch = new Date(1900, 0, 1);
  const days = Math.floor(serial) - 2; // -2 pentru bug-ul Excel 1900
  const milliseconds = days * 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch.getTime() + milliseconds);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatează data în format ISO (YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  // DEBUG: Log intrare
  console.log('[formatDate] Input:', JSON.stringify(dateStr), 'Type:', typeof dateStr);

  // Verificăm dacă e Excel serial number (număr > 40000 = post-2009)
  const asNumber = parseFloat(dateStr);
  if (!isNaN(asNumber) && asNumber > 40000 && asNumber < 60000) {
    console.log('[formatDate] Excel serial number detected:', asNumber);
    const result = excelSerialToDate(asNumber);
    console.log('[formatDate] Converted to date:', result);
    return result;
  }

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
