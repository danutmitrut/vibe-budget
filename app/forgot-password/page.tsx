/**
 * PAGINA: FORGOT PASSWORD (Recuperare parolă)
 *
 * EXPLICAȚIE:
 * User-ul și-a uitat parola și introduce email-ul pentru resetare.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Eroare la trimiterea emailului");
      }
    } catch (err) {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {!success ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔑</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ai uitat parola?
              </h1>
              <p className="text-gray-600">
                Introdu adresa de email și îți vom trimite instrucțiuni de resetare.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresa de Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="tu@exemplu.com"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Se trimite..." : "📧 Trimite Link de Resetare"}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <Link
                href="/login"
                className="block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Înapoi la Login
              </Link>
              <p className="text-sm text-gray-600">
                Nu ai cont?{" "}
                <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Înregistrează-te
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              Email Trimis!
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-3">
                Dacă email-ul <strong>{email}</strong> există în sistem, vei primi instrucțiuni de resetare în câteva minute.
              </p>
              <p className="text-sm text-gray-600">
                Nu uita să verifici și folderul de <strong>spam/junk</strong>!
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Înapoi la Login
              </Link>
              <button
                onClick={() => setSuccess(false)}
                className="block w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Trimite din nou
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
