/**
 * API ROUTE: PARSE PDF
 *
 * EXPLICAȚIE:
 * Endpoint pentru parsarea PDF-urilor (server-side only)
 * Folosește pdfjs-dist (Mozilla PDF.js) pentru extragere text
 */

import { NextRequest, NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currency?: string;
  type?: "debit" | "credit";
}

/**
 * POST /api/parse-pdf
 *
 * Body: FormData cu fișierul PDF
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Niciun fișier trimis" },
        { status: 400 }
      );
    }

    // Convertim File în Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Parsăm PDF-ul cu pdfjs
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    // Extragem textul din toate paginile
    let fullText = "";
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    console.log("[parsePDF] Extracted text length:", fullText.length);
    console.log("[parsePDF] First 500 chars:", fullText.substring(0, 500));

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "PDF-ul este gol sau este o imagine scanată (nu conține text)",
        },
        { status: 400 }
      );
    }

    // Parsăm textul în tranzacții
    const transactions = parsePDFTextToTransactions(fullText);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nu s-au putut extrage tranzacții din PDF. Format nesuportat sau PDF scanat.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions,
      rowCount: transactions.length,
    });
  } catch (error: any) {
    console.error("[parsePDF] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Eroare la parsarea PDF-ului",
      },
      { status: 500 }
    );
  }
}

/**
 * HELPER: Parsează textul extras din PDF în tranzacții
 */
function parsePDFTextToTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split("\n");

  console.log("[parsePDFText] Processing", lines.length, "lines");

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
          const amountStr = match[3].replace(",", "."); // RON folosește virgulă
          const currency = match[4] || "RON";

          // Validări
          if (!description || description.length < 3) continue;
          if (isNaN(parseFloat(amountStr))) continue;

          const amount = parseFloat(amountStr);

          transactions.push({
            date: formatDate(dateStr),
            description: description.substring(0, 200), // Limitează lungimea
            amount: amount,
            currency: currency,
            type: amount < 0 ? "debit" : "credit",
          });

          console.log(
            `[parsePDFText] Found transaction: ${dateStr} | ${description.substring(0, 30)} | ${amount} ${currency}`
          );
          break; // Am găsit match, trecem la următoarea linie
        } catch (err) {
          console.warn("[parsePDFText] Failed to parse line:", line, err);
        }
      }
    }
  }

  return transactions;
}

/**
 * Formatează data în format ISO (YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") {
    console.warn("[formatDate] Invalid date string:", dateStr);
    return new Date().toISOString().split("T")[0];
  }

  const cleanStr = dateStr.trim();

  // Dacă e deja ISO format (cu sau fără timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    return cleanStr.split(" ")[0].split("T")[0];
  }

  // Format Revolut: DD MMM YYYY (ex: "01 Dec 2024")
  const revolutPattern = /^(\d{2})\s+(\w{3})\s+(\d{4})$/;
  const revolutMatch = cleanStr.match(revolutPattern);

  if (revolutMatch) {
    const monthMap: { [key: string]: string } = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const day = revolutMatch[1];
    const monthName = revolutMatch[2];
    const year = revolutMatch[3];
    const month = monthMap[monthName];

    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Parsăm formate românești: DD.MM.YYYY sau DD/MM/YYYY
  const parts = cleanStr.split(/[./-]/);

  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Fallback: returnăm data curentă (cu warning)
  console.warn("[formatDate] Could not parse date, using current date:", dateStr);
  return new Date().toISOString().split("T")[0];
}
