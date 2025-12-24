/**
 * PAGINA: RAPORT PIVOT (Analiză categorii x luni)
 *
 * EXPLICAȚIE:
 * Tabel pivot cu:
 * - Rânduri: Categorii
 * - Coloane: Luni (ultimele 12 luni)
 * - Colorare dinamică pentru sume critice
 * - Analiza creșterilor/scăderilor între luni
 * - Tendințe și statistici
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PivotCell {
  amount: number;
  count: number;
  change?: number;
}

interface PivotRow {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  months: Record<string, PivotCell>;
  total: number;
  average: number;
  topMonth: { month: string; amount: number };
  bottomMonth: { month: string; amount: number };
  maxIncrease: { month: string; change: number };
  maxDecrease: { month: string; change: number };
}

interface PivotData {
  months: string[];
  data: PivotRow[];
  currency: string;
}

export default function PivotReportPage() {
  const router = useRouter();
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthsCount, setMonthsCount] = useState(12);
  const [showPercentages, setShowPercentages] = useState(false);

  useEffect(() => {
    fetchPivotData();
  }, [monthsCount]);

  const fetchPivotData = async () => {
    try {
      

      const response = await fetch(`/api/reports/pivot?months=${monthsCount}`, {
        
      });

      if (!response.ok) throw new Error("Eroare la încărcarea datelor");

      const data = await response.json();
      setPivotData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru colorarea celulelor bazată pe sumă
  const getCellColor = (amount: number, average: number): string => {
    if (amount === 0) return "bg-gray-50 text-gray-400";

    const ratio = amount / average;

    if (ratio >= 1.5) return "bg-red-100 text-red-900 font-bold"; // Critico: 150%+
    if (ratio >= 1.2) return "bg-orange-100 text-orange-900 font-semibold"; // Ridicat: 120%+
    if (ratio >= 0.8) return "bg-yellow-50 text-yellow-900"; // Normal: 80-120%
    return "bg-green-100 text-green-900"; // Sub medie: <80%
  };

  // Funcție pentru colorarea schimbării procentuale
  const getChangeColor = (change: number): string => {
    if (change >= 50) return "text-red-700 font-bold";
    if (change >= 20) return "text-orange-700 font-semibold";
    if (change >= 0) return "text-yellow-700";
    if (change >= -20) return "text-green-700";
    if (change >= -50) return "text-green-800 font-semibold";
    return "text-green-900 font-bold";
  };

  // Formatare lună (2025-12 → Dec 2025)
  const formatMonth = (month: string): string => {
    const [year, m] = month.split("-");
    const monthNames = [
      "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
      "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"
    ];
    return `${monthNames[parseInt(m, 10) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-800">Se încarcă raportul...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Eroare: {error}</div>
      </div>
    );
  }

  if (!pivotData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-800">Nu există date</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📊 Raport Pivot - Analiza pe Luni
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Categorii × Luni cu colorare dinamică și analiză tendințe
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

      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controale */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Număr luni
              </label>
              <select
                value={monthsCount}
                onChange={(e) => setMonthsCount(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={6}>6 luni</option>
                <option value={12}>12 luni</option>
                <option value={18}>18 luni</option>
                <option value={24}>24 luni</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPercentages}
                  onChange={(e) => setShowPercentages(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-700">
                  Arată schimbări procentuale (% față de luna anterioară)
                </span>
              </label>
            </div>
          </div>

          {/* Legendă culori */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Legendă culori:</h3>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Critic (&gt;150% față de medie)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Ridicat (120-150%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
                <span>Normal (80-120%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Sub medie (&lt;80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-gray-50 border border-gray-300 rounded"></div>
                <span>Fără cheltuieli</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Pivot */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="sticky left-0 bg-gray-100 px-4 py-3 text-left font-bold border-r-2 border-gray-300 z-10">
                    Categorie
                  </th>
                  {pivotData.months.map((month) => (
                    <th
                      key={month}
                      className="px-3 py-3 text-center font-semibold border-r border-gray-200 min-w-[100px]"
                    >
                      {formatMonth(month)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-bold border-l-2 border-gray-300 bg-indigo-50">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center font-bold bg-indigo-50">
                    Medie/lună
                  </th>
                </tr>
              </thead>
              <tbody>
                {pivotData.data.map((row) => (
                  <tr key={row.categoryId} className="border-b hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-3 font-semibold border-r-2 border-gray-300 z-10">
                      <div className="flex items-center gap-2">
                        <span>{row.categoryIcon}</span>
                        <span>{row.categoryName}</span>
                      </div>
                    </td>
                    {pivotData.months.map((month) => {
                      const cell = row.months[month];
                      const colorClass = getCellColor(cell.amount, row.average);
                      return (
                        <td
                          key={month}
                          className={`px-3 py-3 text-center border-r border-gray-200 ${colorClass}`}
                        >
                          <div className="font-semibold">
                            {cell.amount > 0
                              ? `${cell.amount.toFixed(0)} ${pivotData.currency}`
                              : "-"}
                          </div>
                          {showPercentages && cell.change !== undefined && (
                            <div className={`text-xs mt-1 ${getChangeColor(cell.change)}`}>
                              {cell.change > 0 ? "+" : ""}
                              {cell.change.toFixed(0)}%
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {cell.count > 0 ? `(${cell.count} tx)` : ""}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold border-l-2 border-gray-300 bg-indigo-50">
                      {row.total.toFixed(0)} {pivotData.currency}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold bg-indigo-50">
                      {row.average.toFixed(0)} {pivotData.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analiză Top Creșteri/Scăderi */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Top Creșteri */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🔥 Top Creșteri Lunare
            </h2>
            <div className="space-y-3">
              {pivotData.data
                .filter((row) => row.maxIncrease.change > 0)
                .sort((a, b) => b.maxIncrease.change - a.maxIncrease.change)
                .slice(0, 5)
                .map((row) => (
                  <div
                    key={row.categoryId}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{row.categoryIcon}</span>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {row.categoryName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatMonth(row.maxIncrease.month)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">
                        +{row.maxIncrease.change.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Scăderi */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              📉 Top Scăderi Lunare
            </h2>
            <div className="space-y-3">
              {pivotData.data
                .filter((row) => row.maxDecrease.change < 0)
                .sort((a, b) => a.maxDecrease.change - b.maxDecrease.change)
                .slice(0, 5)
                .map((row) => (
                  <div
                    key={row.categoryId}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{row.categoryIcon}</span>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {row.categoryName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatMonth(row.maxDecrease.month)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        {row.maxDecrease.change.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
