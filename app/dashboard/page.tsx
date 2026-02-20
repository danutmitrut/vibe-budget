/**
 * PAGINA: DASHBOARD (Tabloul de bord principal cu Supabase Auth)
 *
 * EXPLICAȚIE:
 * Aceasta este pagina principală a aplicației după autentificare.
 * Aici utilizatorul va vedea:
 * - Sumar tranzacții
 * - Grafice
 * - Linkuri către managementul băncilor, categoriilor, etc.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const supabase = createClient();

  const normalizeUser = (userData: any): User => ({
    id: userData.id,
    email: userData.email,
    name: userData.name,
    nativeCurrency: userData.native_currency,
  });

  // PASUL 1: Verificăm dacă user e autentificat cu Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setProfileError(null);

        // Verificăm sesiunea Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.replace("/login");
          return;
        }

        const userPayload = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Utilizator",
          native_currency: authUser.user_metadata?.native_currency || "RON",
        };

        // Obținem datele utilizatorului din tabela users
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (userError) {
          throw new Error("Nu s-au putut încărca datele utilizatorului");
        }

        if (userData) {
          setUser(normalizeUser(userData));
          fetchAIInsights();
          return;
        }

        // Dacă profilul lipsește, îl creăm strict pe același auth user id.
        let { data: createdUser, error: createUserError } = await supabase
          .from("users")
          .insert(userPayload)
          .select("*")
          .single();

        if (createUserError?.message.includes("users_email_key")) {
          const { error: reconcileError } = await supabase.rpc("reconcile_current_user_profile");
          if (reconcileError) {
            throw new Error(
              "Sesiunea este validă, dar profilul nu s-a putut sincroniza. Reîncearcă după refresh."
            );
          }

          const retry = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (retry.error) {
            throw new Error("Nu s-au putut încărca datele utilizatorului");
          }

          if (retry.data) {
            setUser(normalizeUser(retry.data));
            fetchAIInsights();
            return;
          }

          const recreate = await supabase
            .from("users")
            .insert(userPayload)
            .select("*")
            .single();
          createdUser = recreate.data;
          createUserError = recreate.error;
        }

        if (createUserError || !createdUser) {
          throw new Error("Nu s-a putut crea profilul utilizatorului");
        }

        setUser(normalizeUser(createdUser));

        // Fetch AI insights în background (non-blocking)
        fetchAIInsights();
      } catch (error) {
        console.error("Auth error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Nu s-au putut încărca datele contului";
        setProfileError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch AI Insights (non-blocking)
  const fetchAIInsights = async () => {
    try {
      const [healthRes, anomRes] = await Promise.all([
        fetch("/api/ai/health-score"),
        fetch("/api/ai/anomaly-detection"),
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

  // PASUL 2: Funcția de logout cu Supabase
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
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

  if (profileError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl w-full bg-white border border-red-200 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Sesiune activă, profil nesincronizat</h2>
          <p className="text-gray-700 mb-5">{profileError}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Reîncearcă
            </button>
            <button
              onClick={() => router.replace("/login")}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Înapoi la login
            </button>
          </div>
        </div>
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
                          Vezi toate alertele →
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
            Salut, {user?.name}!
          </h2>
          <p className="text-gray-800 mb-4">
            Moneda principală: <span className="font-semibold">{user?.nativeCurrency}</span>
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
              Încarcă extrasul de cont
            </p>
          </Link>

          <Link href="/dashboard/transactions" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="text-lg font-semibold mb-2">Tranzacții</h3>
            <p className="text-gray-700 text-sm">
              Toate tranzacțiile tale
            </p>
          </Link>

          <Link href="/dashboard/reports" className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold mb-2">Rapoarte</h3>
            <p className="text-white/90 text-sm">
              Grafice și statistici
            </p>
          </Link>

          <Link href="/dashboard/reports/pivot" className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Raport Pivot</h3>
            <p className="text-white/90 text-sm">
              Cheltuieli pe luni și categorii
            </p>
          </Link>

          <Link href="/dashboard/ai-insights" className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-white/90 text-sm">
              Sfaturi personalizate de la AI
            </p>
          </Link>

          <Link href="/dashboard/banks" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">🏦</div>
            <h3 className="text-lg font-semibold mb-2">Bănci</h3>
            <p className="text-gray-700 text-sm">
              Băncile tale
            </p>
          </Link>

          <Link href="/dashboard/categories" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-semibold mb-2">Categorii</h3>
            <p className="text-gray-700 text-sm">
              Organizează-ți cheltuielile
            </p>
          </Link>

          <Link href="/dashboard/keywords" className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="text-lg font-semibold mb-2">Reguli</h3>
            <p className="text-white/90 text-sm">
              Reguli automate de categorizare
            </p>
          </Link>

          <Link href="/dashboard/currencies" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer">
            <div className="text-4xl mb-3">💱</div>
            <h3 className="text-lg font-semibold mb-2">Valute</h3>
            <p className="text-gray-700 text-sm">
              Valutele tale
            </p>
          </Link>
        </div>

        {/* AI Insights Section */}
        {(healthScore || anomalies.length > 0) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI Insights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Health Score Card */}
              {healthScore && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Financial Health Score</h3>
                    <span className={`px-4 py-2 rounded-full text-2xl font-bold border-2 ${getGradeColor(healthScore.grade)}`}>
                      {healthScore.grade}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Scor:</span>
                      <span className="text-3xl font-bold text-indigo-600">{healthScore.score.toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all"
                        style={{ width: `${(healthScore.score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/ai-insights"
                    className="block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Vezi detalii complete →
                  </Link>
                </div>
              )}

              {/* Anomalies Card */}
              {anomalies.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 Alerte și Anomalii</h3>
                  <div className="space-y-3 mb-4">
                    {anomalies.slice(0, 3).map((anomaly, idx) => (
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
                    className="block text-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    Vezi toate alertele →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
