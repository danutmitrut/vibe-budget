/**
 * PAGINA: AI INSIGHTS (Insights Financiare Generate de AI)
 *
 * EXPLICAȚIE:
 * Dashboard cu 3 secțiuni majore:
 * 1. Financial Health Score - Scor de sănătate financiară (gamification)
 * 2. Budget Recommendations - Recomandări de economisire
 * 3. Anomaly Detection - Alerte pentru cheltuieli neobișnuite
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Interfețe pentru răspunsuri API
interface HealthScore {
  score: number;
  grade: string;
  breakdown: {
    cashFlow: number;
    diversification: number;
    savingsRate: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  metrics: {
    monthlyIncome: number;
    monthlyExpenses: number;
    balance: number;
    savingsRate: number;
  };
}

interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  potentialSavings: number;
  actionItems: string[];
}

interface Anomaly {
  description: string;
  amount: number;
  category: string;
  date: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export default function AIInsightsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllInsights();
  }, []);

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const sessionToken = data.session?.access_token;
    const storedToken = localStorage.getItem("token");

    if (sessionToken && sessionToken !== storedToken) {
      localStorage.setItem("token", sessionToken);
    }

    if (!sessionToken && storedToken) {
      localStorage.removeItem("token");
    }

    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }
    return headers;
  };

  const fetchAllInsights = async () => {
    try {
      const authHeaders = await getAuthHeaders();

      setLoading(true);

      // Fetch toate cele 3 insights în paralel
      const [healthRes, recsRes, anomRes] = await Promise.all([
        fetch("/api/ai/health-score", {
          headers: authHeaders,
          credentials: "include",
        }),
        fetch("/api/ai/budget-recommendations", {
          headers: authHeaders,
          credentials: "include",
        }),
        fetch("/api/ai/anomaly-detection", {
          headers: authHeaders,
          credentials: "include",
        }),
      ]);

      if (!healthRes.ok && !recsRes.ok && !anomRes.ok) {
        const healthError = await healthRes.json().catch(() => null);
        const recsError = await recsRes.json().catch(() => null);
        const anomError = await anomRes.json().catch(() => null);

        const message =
          healthError?.error ||
          recsError?.error ||
          anomError?.error ||
          "Eroare la încărcarea AI Insights";
        throw new Error(message);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthScore(healthData);
      }

      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecommendations(recsData.recommendations || []);
      }

      if (anomRes.ok) {
        const anomData = await anomRes.json();
        setAnomalies(anomData.anomalies || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800 border-green-300";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800 border-blue-300";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "bg-red-100 text-red-800 border-red-300";
    if (severity === "medium") return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Claude AI analizează datele tale...
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🤖 AI Insights</h1>
              <p className="text-sm text-gray-600 mt-1">
                Analiză financiară inteligentă powered by Claude AI
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Înapoi
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Secțiunea 1: Financial Health Score */}
        {healthScore && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              💪 Scorul Tău de Sănătate Financiară
            </h2>

            {/* Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Overall Score */}
              <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                <div className="text-6xl font-bold text-indigo-600 mb-2">
                  {(healthScore.score || 0).toFixed(1)}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">/ 10</div>
                <div
                  className={`inline-block px-6 py-2 rounded-full text-2xl font-bold border-2 ${getGradeColor(healthScore.grade || 'N/A')}`}
                >
                  {healthScore.grade || 'N/A'}
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">💰 Cash Flow</span>
                    <span className="font-bold">{healthScore.breakdown?.cashFlow || 0}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${((healthScore.breakdown?.cashFlow || 0) / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">📊 Diversificare</span>
                    <span className="font-bold">{healthScore.breakdown?.diversification || 0}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{
                        width: `${((healthScore.breakdown?.diversification || 0) / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">💵 Rată Economisire</span>
                    <span className="font-bold">{healthScore.breakdown?.savingsRate || 0}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full"
                      style={{ width: `${((healthScore.breakdown?.savingsRate || 0) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Venit Lunar</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(healthScore.metrics?.monthlyIncome || 0)} RON
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-gray-600 mb-1">Cheltuieli</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(healthScore.metrics?.monthlyExpenses || 0)} RON
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${(healthScore.metrics?.balance || 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-sm text-gray-600 mb-1">Balanță</div>
                <div className={`text-xl font-bold ${(healthScore.metrics?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(healthScore.metrics?.balance || 0)} RON
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Economii</div>
                <div className="text-xl font-bold text-blue-600">
                  {(healthScore.metrics?.savingsRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-green-600">✅ Puncte Forte</h3>
                <ul className="space-y-2">
                  {(healthScore.strengths || []).map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 text-red-600">⚠️ Puncte Slabe</h3>
                <ul className="space-y-2">
                  {(healthScore.weaknesses || []).map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Secțiunea 2: Budget Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              💡 Recomandări de Economisire
            </h2>

            <div className="space-y-6">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{rec.category}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatCurrency(rec.potentialSavings)} RON
                      </div>
                      <div className="text-sm text-gray-600">economii/an</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Cheltuieli Actuale</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(rec.currentSpending)} RON/lună
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Reducere Sugerată</div>
                      <div className="text-lg font-bold text-orange-600">
                        -{formatCurrency(rec.suggestedReduction)} RON/lună
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">📋 Acțiuni Concrete:</div>
                    <ul className="space-y-1">
                      {rec.actionItems.map((action, aidx) => (
                        <li key={aidx} className="flex items-start gap-2">
                          <span className="text-indigo-600 mt-1">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secțiunea 3: Anomaly Detection */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              🚨 Alerte și Anomalii
            </h2>

            <div className="space-y-4">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{anomaly.description}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {anomaly.category} • {new Date(anomaly.date).toLocaleDateString("ro-RO")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(anomaly.amount)} RON</div>
                      <div
                        className={`text-xs font-semibold uppercase mt-1 ${
                          anomaly.severity === "high"
                            ? "text-red-700"
                            : anomaly.severity === "medium"
                            ? "text-orange-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {anomaly.severity}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded p-3 mt-3">
                    <div className="font-semibold text-sm mb-1">💡 Sugestie:</div>
                    <div className="text-sm">{anomaly.suggestion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Messages */}
        {!healthScore && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Nu există suficiente date</h3>
            <p className="text-gray-700 mb-4">
              Importă mai multe tranzacții pentru a primi insights AI personalizate.
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Importă Tranzacții
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * PENTRU CURSANȚI: UX BEST PRACTICES
 *
 * 1. **Progressive Loading**: Fetch toate datele în paralel (Promise.all)
 * 2. **Visual Hierarchy**: Cele mai importante info sus (health score)
 * 3. **Color Coding**: Verde=bine, Roșu=atenție, Galben=warning
 * 4. **Actionable Insights**: Nu doar "cheltuieli mari", ci "reduce cu X RON"
 * 5. **Gamification**: Score vizibil, progress bars, grade
 */
