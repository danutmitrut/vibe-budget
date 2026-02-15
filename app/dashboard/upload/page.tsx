/**
 * PAGINA: DASHBOARD/UPLOAD (Import Tranzacții)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul importă tranzacții din fișiere CSV sau Excel.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCSV, parseExcel, ParsedTransaction } from "@/lib/utils/file-parser";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/supabase/auth-headers";

interface Bank {
  id: string;
  name: string;
  color: string | null;
}

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Încărcăm băncile
  useEffect(() => {
    fetchBanks();
  }, []);


  const fetchBanks = async () => {
    try {
      const authHeaders = await getAuthHeaders();

      const response = await fetch("/api/banks", {
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Eroare la încărcarea băncilor");
      }

      const data = await response.json();
      setBanks(data.banks);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Gestionare drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError("");
    setSuccessMessage("");
    setPreview([]);
    setParsing(true);

    try {
      // Verificăm tipul fișierului
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();

      let result;
      if (fileType === "csv") {
        result = await parseCSV(selectedFile);
      } else if (fileType === "xlsx" || fileType === "xls") {
        result = await parseExcel(selectedFile);
      } else {
        throw new Error("Format nesuportat. Folosește CSV sau Excel (.xlsx, .xls)");
      }

      if (!result.success) {
        throw new Error(result.error || "Eroare la parsarea fișierului");
      }

      setPreview(result.transactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedBankId) {
      setError("Selectează o bancă");
      return;
    }

    if (preview.length === 0) {
      setError("Nu există tranzacții de importat");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const authHeaders = await getAuthHeaders();

      // Adăugăm bankId la fiecare tranzacție
      const transactionsWithBank = preview.map((t) => ({
        ...t,
        bankId: selectedBankId,
        source: "csv",
      }));

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({ transactions: transactionsWithBank }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();

      // Mesaj cu info despre categorizare automată
      const autoCategorized = data.autoCategorizedCount || 0;
      const message = autoCategorized > 0
        ? `✅ ${data.count} tranzacții importate cu succes!\n🤖 ${autoCategorized} au fost categorizate automat.`
        : `✅ ${data.count} tranzacții importate cu succes!`;

      setSuccessMessage(message);
      setError("");

      // Nu mai facem redirect automat - utilizatorul alege ce vrea să facă
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setSelectedBankId("");
    setSuccessMessage("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Import Tranzacții</h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Înapoi
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pasul 1: Selectare bancă */}
        {!successMessage && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Pasul 1: Selectează banca</h2>
            {banks.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                Nu ai bănci adăugate.{" "}
                <Link href="/dashboard/banks" className="underline font-semibold">
                  Adaugă o bancă
                </Link>{" "}
                mai întâi.
              </div>
            ) : (
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Selectează banca...</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Pasul 2: Upload fișier */}
        {!successMessage && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Pasul 2: Încarcă fișierul</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📎</div>
            <p className="text-lg text-gray-700 mb-2">
              Drag & drop fișierul aici sau
            </p>
            <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer">
              Alege fișier
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-800 mt-4">
              Formate acceptate: CSV, Excel (.xlsx, .xls)
            </p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <strong>🔒 Securitate:</strong> Pentru protecția datelor tale financiare,{" "}
                <strong className="text-amber-800">descarcă extractul direct în format CSV/Excel de la bancă</strong>{" "}
                (ING, BCR, BRD, Revolut - toate oferă export CSV din aplicație).{" "}
                <strong className="text-red-700">NU folosi convertoare online</strong> - riști expunerea tranzacțiilor tale!
              </p>
            </div>
          </div>

          {parsing && (
            <div className="mt-4 text-center text-gray-800">
              Se procesează fișierul...
            </div>
          )}

          {file && !parsing && !successMessage && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-800">
                Fișier selectat: <span className="font-semibold">{file.name}</span>
              </p>
              <p className="text-sm text-gray-800">
                Tranzacții găsite: <span className="font-semibold">{preview.length}</span>
              </p>
            </div>
          )}
        </div>
        )}

        {/* Preview tranzacții */}
        {preview.length > 0 && !successMessage && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              Preview ({preview.length} tranzacții)
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Data</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Descriere</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Sumă</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((t, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2 text-sm">{t.date}</td>
                      <td className="px-4 py-2 text-sm">{t.description}</td>
                      <td
                        className={`px-4 py-2 text-sm text-right font-semibold ${
                          t.amount < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {t.amount.toFixed(2)} {t.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-sm text-gray-800 text-center mt-4">
                  ... și încă {preview.length - 10} tranzacții
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mesaj de succes */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg mb-6 p-6">
            <div className="text-green-800 mb-4 whitespace-pre-line">
              {successMessage}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                📎 Încarcă Alt Fișier
              </button>
              <Link
                href="/dashboard/transactions"
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-center"
              >
                👀 Vezi Tranzacțiile
              </Link>
            </div>
          </div>
        )}

        {/* Eroare */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Buton import */}
        {preview.length > 0 && !successMessage && (
          <button
            onClick={handleImport}
            disabled={loading || !selectedBankId}
            className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Se importă..."
              : `Importă ${preview.length} tranzacții`}
          </button>
        )}
      </main>
    </div>
  );
}
