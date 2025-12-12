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

interface HealthScore {
  score: number;
  grade: string;
}

interface Anomaly {
  description: string;
  severity: "low" | "medium" | "high";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [showAnomalies, setShowAnomalies] = useState(false);

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

        // Fetch AI insights în background (non-blocking)
        fetchAIInsights(token);
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

  // Fetch AI Insights (non-blocking)
  const fetchAIInsights = async (token: string) => {
    try {
      const [healthRes, anomRes] = await Promise.all([
        fetch("/api/ai/health-score", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/ai/anomaly-detection", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthScore({
          score: healthData.score || 0,
          grade: healthData.grade || "N/A",
        });
      }

      if (anomRes.ok) {
        const anomData = await anomRes.json();
        setAnomalies(anomData.anomalies || []);
      }
    } catch (error) {
      // AI insights sunt opționale, nu blocăm UI-ul
      console.log("AI insights unavailable");
    }
  };

  // PASUL 2: Funcția de logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Helper pentru culori badge Health Score
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800 border-green-300";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800 border-blue-300";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  // Helper pentru culori severity anomalies
  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "bg-red-100 text-red-800";
    if (severity === "medium") return "bg-orange-100 text-orange-800";
    return "bg-yellow-100 text-yellow-800";
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

              {/* Health Score Badge */}
              {healthScore && (
                <Link
                  href="/dashboard/ai-insights"
                  className={`px-3 py-1 rounded-full text-sm font-semibold border-2 hover:opacity-80 transition ${getGradeColor(healthScore.grade)}`}
                  title={`Financial Health Score: ${healthScore.score.toFixed(1)}/10`}
                >
                  💪 {healthScore.grade}
                </Link>
              )}

              {/* Notification Bell cu Anomalies */}
              {anomalies.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowAnomalies(!showAnomalies)}
                    className="relative p-2 hover:bg-gray-100 rounded-full transition"
                    title={`${anomalies.length} alertă${anomalies.length > 1 ? '' : ''}`}
                  >
                    🔔
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {anomalies.length}
                    </span>
                  </button>

                  {/* Dropdown cu anomalies */}
                  {showAnomalies && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50">
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-3">🚨 Alerte</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {anomalies.slice(0, 5).map((anomaly, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg ${getSeverityColor(anomaly.severity)}`}
                            >
                              <div className="font-semibold text-sm">{anomaly.description}</div>
                              <div className="text-xs mt-1 opacity-75">
                                {anomaly.severity.toUpperCase()}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Link
                          href="/dashboard/ai-insights"
                          className="block mt-3 text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          onClick={() => setShowAnomalies(false)}
                        >
                          Vezi toate insights →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

          <Link href="/dashboard/ai-insights" className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-white/90 text-sm">
              Analiză inteligentă by Claude AI
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
