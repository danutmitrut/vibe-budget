/**
 * PAGINA: DASHBOARD/REPORTS (Rapoarte și Grafice)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul vede rapoarte vizuale despre cheltuielile sale.
 * Include grafice pentru:
 * - Distribuție pe categorii (PIE CHART = Grafic circular)
 * - Distribuție pe bănci (BAR CHART = Grafic cu bare)
 * - Totaluri generale (venituri, cheltuieli, balanță)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * INTERFEȚE TYPESCRIPT
 * Definim cum arată datele returnate de API
 */
interface StatsSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  uncategorizedCount: number;
}

interface CategoryStats {
  name: string;
  amount: number;
  count: number;
  color: string;
  icon: string;
  type: string;
}

interface BankStats {
  name: string;
  amount: number;
  count: number;
  color: string;
}

interface StatsResponse {
  period: {
    startDate: string;
    endDate: string;
    type: string;
  };
  summary: StatsSummary;
  byCategory: CategoryStats[];
  byBank: BankStats[];
}

interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  suggestedReduction: number;
  potentialSavings: number;
  actionItems: string[];
}

export default function ReportsPage() {
  const router = useRouter();

  // STATE pentru datele raportului
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);

  // STATE pentru filtre
  const [period, setPeriod] = useState("month"); // "month" sau "year"
  const [customDates, setCustomDates] = useState({ startDate: "", endDate: "" });

  // STATE pentru opțiuni grafic
  const [chartSize, setChartSize] = useState(150); // Outer radius
  const [showLabels, setShowLabels] = useState(true); // Arată procentaje pe grafic
  const [minPercentage, setMinPercentage] = useState(0); // Filtrează categoriile sub X%

  /**
   * EFECT: Încarcă raportul la montarea paginii
   */
  useEffect(() => {
    fetchStats();
    fetchRecommendations();
  }, [period]); // Re-fetch când se schimbă perioada

  /**
   * FUNCȚIE: Fetch statistics from API
   */
  const fetchStats = async () => {
    try {
      

      setLoading(true);

      // Construim URL-ul cu parametrii
      let url = `/api/reports/stats?period=${period}`;

      // Dacă avem date custom, le adăugăm
      if (customDates.startDate && customDates.endDate) {
        url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      }

      const response = await fetch(url, {
        
      });

      if (!response.ok) {
        throw new Error("Eroare la încărcarea statisticilor");
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FUNCȚIE: Fetch AI Budget Recommendations
   */
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/ai/budget-recommendations", {
        
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      // Recommendations sunt opționale, nu arătăm eroare
      console.log("AI recommendations unavailable");
    }
  };

  /**
   * FUNCȚIE: Format number to Romanian currency format
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * FUNCȚIE: Format date to Romanian format
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * HANDLER: Custom date range submit
   */
  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDates.startDate && customDates.endDate) {
      fetchStats();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-800">Se încarcă raportul...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Rapoarte și Grafice</h1>
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
        {/* Filtre Perioadă */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Selectează Perioada</h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setPeriod("month")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                period === "month"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Luna Curentă
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                period === "year"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Anul Curent
            </button>
          </div>

          {/* Date Custom */}
          <form onSubmit={handleCustomDateSubmit} className="border-t pt-4">
            <h3 className="font-semibold mb-3">Sau alege o perioadă personalizată:</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de start:
                </label>
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de final:
                </label>
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, endDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Aplică
                </button>
              </div>
            </div>
          </form>

          {/* Perioada selectată */}
          <div className="mt-4 text-sm text-gray-800">
            <strong>Perioada selectată:</strong>{" "}
            {formatDate(stats.period.startDate)} - {formatDate(stats.period.endDate)}
          </div>
        </div>

        {/* Summary Cards (Carduri cu Totaluri) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Venituri */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Venituri</h3>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.summary.totalIncome)} RON
            </p>
          </div>

          {/* Cheltuieli */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Cheltuieli</h3>
              <span className="text-3xl">💸</span>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.summary.totalExpenses)} RON
            </p>
          </div>

          {/* Balanță */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">Balanță</h3>
              <span className="text-3xl">
                {stats.summary.netBalance >= 0 ? "✅" : "⚠️"}
              </span>
            </div>
            <p
              className={`text-3xl font-bold ${
                stats.summary.netBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(stats.summary.netBalance)} RON
            </p>
          </div>
        </div>

        {/* Statistici Generale */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Statistici Generale</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-800 font-medium">Tranzacții totale:</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.summary.transactionCount}
              </p>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Tranzacții necategorizate:</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.summary.uncategorizedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Grafic Categorii (PIE CHART) */}
        {stats.byCategory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Distribuție pe Categorii</h2>

            {/* Controale Zoom și Filtrare */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-6">
                {/* Zoom Controls */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Zoom:</span>
                  <button
                    onClick={() => setChartSize(Math.max(100, chartSize - 25))}
                    disabled={chartSize <= 100}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    🔍− Zoom Out
                  </button>
                  <button
                    onClick={() => setChartSize(Math.min(250, chartSize + 25))}
                    disabled={chartSize >= 250}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    🔍+ Zoom In
                  </button>
                  <span className="text-sm text-gray-800 font-medium">
                    (Dimensiune: {chartSize}px)
                  </span>
                </div>

                {/* Toggle Labels */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Arată procentaje pe grafic
                    </span>
                  </label>
                </div>

                {/* Filter by Percentage */}
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <span className="text-sm font-semibold text-gray-700">
                    Ascunde categorii sub:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={minPercentage}
                    onChange={(e) => setMinPercentage(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-indigo-600 min-w-[60px]">
                    {minPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={Math.max(500, chartSize * 2 + 200)}>
              <PieChart>
                <Pie
                  data={stats.byCategory.filter((cat) => {
                    // Filtrăm categoriile sub pragul minim
                    const total = stats.byCategory.reduce((sum, c) => sum + c.amount, 0);
                    const percent = (cat.amount / total) * 100;
                    return percent >= minPercentage;
                  }) as any}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={chartSize}
                  label={
                    showLabels
                      ? (entry: any) => {
                          // Arătăm doar procentul pe fiecare segment
                          const filteredData = stats.byCategory.filter((cat) => {
                            const total = stats.byCategory.reduce((sum, c) => sum + c.amount, 0);
                            const percent = (cat.amount / total) * 100;
                            return percent >= minPercentage;
                          });
                          const total = filteredData.reduce((sum, cat) => sum + cat.amount, 0);
                          const percent = ((entry.amount / total) * 100).toFixed(1);
                          return `${percent}%`;
                        }
                      : undefined
                  }
                  labelLine={false}
                >
                  {stats.byCategory
                    .filter((cat) => {
                      const total = stats.byCategory.reduce((sum, c) => sum + c.amount, 0);
                      const percent = (cat.amount / total) * 100;
                      return percent >= minPercentage;
                    })
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${formatCurrency(value)} RON (${props.payload.count} tranzacții)`,
                    `${props.payload.icon} ${name}`,
                  ]}
                />
                <Legend
                  formatter={(value: string, entry: any) => `${entry.payload.icon} ${value}`}
                  wrapperStyle={{ paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Tabel categorii */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Detalii pe categorii:</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Categorie</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Sumă</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Tranzacții</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((cat, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-white font-semibold"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.icon} {cat.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatCurrency(cat.amount)} RON
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">{cat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grafic Bănci (BAR CHART) */}
        {stats.byBank.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Distribuție pe Bănci</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.byBank as any}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${formatCurrency(value)} RON`}
                />
                <Legend />
                <Bar dataKey="amount" fill="#6366f1" name="Sumă totală (RON)">
                  {stats.byBank.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tabel bănci */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Detalii pe bănci:</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Bancă</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Sumă</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Tranzacții</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byBank.map((bank, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: bank.color }}
                          />
                          <span className="font-semibold">{bank.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatCurrency(bank.amount)} RON
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">{bank.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Budget Recommendations Widget */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  💡 Recomandări de Economisire
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sugestii inteligente de la Claude AI pentru a-ți optimiza bugetul
                </p>
              </div>
              <Link
                href="/dashboard/ai-insights"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
              >
                Vezi toate insights →
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-5 shadow border-2 border-green-300 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{rec.category}</h3>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Cheltuieli actuale</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(rec.currentSpending)} RON
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Poți economisi</span>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(rec.potentialSavings)} RON/an
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Acțiuni sugerate:
                    </div>
                    <ul className="space-y-1">
                      {rec.actionItems.slice(0, 2).map((action, aidx) => (
                        <li key={aidx} className="text-sm text-gray-700 flex items-start gap-1">
                          <span className="text-green-600 mt-0.5">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {recommendations.length > 3 && (
              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/ai-insights"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  + {recommendations.length - 3} recomandări suplimentare
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Mesaj dacă nu sunt date */}
        {stats.byCategory.length === 0 && stats.byBank.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">Nu există date pentru această perioadă</p>
            <p>Importă tranzacții pentru a vedea grafice și statistici.</p>
            <Link
              href="/dashboard/upload"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Importă Tranzacții
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
