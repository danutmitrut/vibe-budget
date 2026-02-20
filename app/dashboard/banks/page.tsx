/**
 * PAGINA: DASHBOARD/BANKS (Gestionare Bănci)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul:
 * - Vede lista băncilor sale
 * - Poate adăuga bănci noi
 * - Poate șterge bănci existente
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/supabase/auth-headers";

interface Bank {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
}

export default function BanksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", color: "#6366f1" });
  const [error, setError] = useState("");

  // PASUL 1: Încărcăm băncile la mount
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
    } finally {
      setLoading(false);
    }
  };

  // PASUL 2: Adăugăm o bancă nouă
  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/banks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify(newBank),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      // Resetăm formularul și reîncărcăm lista
      setNewBank({ name: "", color: "#6366f1" });
      await fetchBanks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // PASUL 3: Ștergem o bancă
  const handleDeleteBank = async (id: string) => {
    if (!confirm("Ștergi banca? Acțiunea e permanentă.")) return;

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/banks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Eroare la ștergerea băncii");
      }

      await fetchBanks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-800">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestionare Bănci</h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Înapoi la Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formular adăugare bancă */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Adaugă bancă nouă</h2>
          <form onSubmit={handleAddBank} className="flex gap-4">
            <input
              type="text"
              placeholder="Numele băncii (ex: ING Bank)"
              value={newBank.name}
              onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-800">Culoare:</label>
              <input
                type="color"
                value={newBank.color}
                onChange={(e) => setNewBank({ ...newBank, color: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {adding ? "Adaugă..." : "Adaugă"}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Lista bănci */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Băncile tale ({banks.length})</h2>
          {banks.length === 0 ? (
            <p className="text-gray-800 text-center py-8">
              Nicio bancă adăugată. Începe prin a adăuga banca ta mai sus.
            </p>
          ) : (
            <div className="space-y-3">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: bank.color || "#6366f1" }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                      <p className="text-sm text-gray-800">
                        {new Date(bank.createdAt).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
