/**
 * PAGINA: DASHBOARD/CURRENCIES (Gestionare Valute)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Currency {
  id: string;
  code: string;
  symbol: string;
  isNative: boolean;
  createdAt: Date;
}

const commonCurrencies = [
  { code: "RON", symbol: "lei", name: "Leu românesc" },
  { code: "MDL", symbol: "lei", name: "Leu moldovenesc" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Dolar american" },
  { code: "GBP", symbol: "£", name: "Liră sterlină" },
  { code: "CHF", symbol: "CHF", name: "Franc elvețian" },
];

export default function CurrenciesPage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: "EUR", symbol: "€", isNative: false });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      

      const response = await fetch("/api/currencies", {
        
      });

      if (!response.ok) throw new Error("Eroare la încărcarea valutelor");

      const data = await response.json();
      setCurrencies(data.currencies);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/currencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCurrency),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setNewCurrency({ code: "EUR", symbol: "€", isNative: false });
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleQuickAdd = async (curr: { code: string; symbol: string }) => {
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/currencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...curr, isNative: false }),
      });
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi această valută?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/currencies/${id}`, {
        method: "DELETE",
        
      });

      if (!response.ok) throw new Error("Eroare la ștergerea valutei");

      await fetchCurrencies();
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

  const availableCurrencies = commonCurrencies.filter(
    (c) => !currencies.some((curr) => curr.code === c.code)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestionare Valute</h1>
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
        {/* Quick add */}
        {availableCurrencies.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Adăugare rapidă</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleQuickAdd(curr)}
                  disabled={adding}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-semibold">{curr.code}</div>
                    <div className="text-xs text-gray-800">{curr.name}</div>
                  </div>
                  <div className="text-2xl">{curr.symbol}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formular custom */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Adaugă valută personalizată</h2>
          <form onSubmit={handleAddCurrency} className="flex gap-4">
            <input
              type="text"
              placeholder="Cod (ex: EUR)"
              value={newCurrency.code}
              onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value })}
              required
              maxLength={3}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
            />
            <input
              type="text"
              placeholder="Simbol (ex: €)"
              value={newCurrency.symbol}
              onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
              required
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={adding}
              className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
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

        {/* Lista valute */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Valutele tale ({currencies.length})</h2>
          {currencies.length === 0 ? (
            <p className="text-gray-800 text-center py-8">
              Nu ai adăugat încă valute. Începe cu adăugarea rapidă! 💱
            </p>
          ) : (
            <div className="space-y-3">
              {currencies.map((currency) => (
                <div
                  key={currency.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl font-bold text-indigo-700">
                      {currency.symbol}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {currency.code}
                        {currency.isNative && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            Nativă
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-800">
                        {new Date(currency.createdAt).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCurrency(currency.id)}
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
