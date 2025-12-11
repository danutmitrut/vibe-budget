/**
 * PAGINA: DASHBOARD (Tabloul de bord principal)
 *
 * EXPLICAȚIE:
 * Aceasta este pagina principală a aplicației după autentificare.
 * Aici utilizatorul va vedea:
 * - Sumar tranzacții
 * - Grafice
 * - Linkuri către managementul băncilor, categoriilor, etc.
 *
 * DEOCAMDATĂ: Placeholder simplu care confirmă că user e logat.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  nativeCurrency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // PASUL 1: Verificăm dacă user e autentificat
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // Nu există token, redirectăm la login
        router.push("/login");
        return;
      }

      try {
        // Verificăm token-ul cu backend-ul
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Token invalid");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        // Token invalid, redirectăm la login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // PASUL 2: Funcția de logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-800">Se încarcă...</div>
      </div>
    );
  }

  // PASUL 3: Render dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vibe Budget</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-800">
                Bună, {user?.name}!
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bine ai venit, {user?.name}! 🎉
          </h2>
          <p className="text-gray-800 mb-4">
            Moneda ta nativă: <span className="font-semibold">{user?.nativeCurrency}</span>
          </p>
          <p className="text-gray-800">
            Email: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/upload" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📤</div>
            <h3 className="text-lg font-semibold mb-2">Importă tranzacții</h3>
            <p className="text-gray-700 text-sm">
              Încarcă fișiere CSV sau Excel
            </p>
          </Link>

          <Link href="/dashboard/transactions" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="text-lg font-semibold mb-2">Tranzacții</h3>
            <p className="text-gray-700 text-sm">
              Vezi și categorizează tranzacții
            </p>
          </Link>

          <Link href="/dashboard/reports" className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold mb-2">Rapoarte și Grafice</h3>
            <p className="text-white/90 text-sm">
              Statistici vizuale și analize
            </p>
          </Link>

          <Link href="/dashboard/reports/pivot" className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Raport Pivot</h3>
            <p className="text-white/90 text-sm">
              Tabel pivot: categorii × luni
            </p>
          </Link>

          <Link href="/dashboard/banks" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">🏦</div>
            <h3 className="text-lg font-semibold mb-2">Gestionează bănci</h3>
            <p className="text-gray-700 text-sm">
              Adaugă și editează băncile tale
            </p>
          </Link>

          <Link href="/dashboard/categories" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-semibold mb-2">Categorii</h3>
            <p className="text-gray-700 text-sm">
              Creează categorii personalizate
            </p>
          </Link>

          <Link href="/dashboard/currencies" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">💱</div>
            <h3 className="text-lg font-semibold mb-2">Valute</h3>
            <p className="text-gray-700 text-sm">
              Gestionează valutele tale
            </p>
          </Link>
        </div>

        {/* Future features */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">🚀 Funcționalități viitoare</h3>
          <p className="text-lg mb-2">
            Următoarele funcționalități vor fi implementate:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/90">
            <li>Categorizare automată cu AI (OpenAI)</li>
            <li>Conversii valutare (exchange rates API)</li>
            <li>Exportare rapoarte PDF</li>
            <li>Notificări pentru bugete depășite</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
