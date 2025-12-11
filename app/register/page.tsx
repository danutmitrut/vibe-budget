/**
 * PAGINA: REGISTER (Înregistrare utilizator nou)
 *
 * EXPLICAȚIE:
 * Aceasta este pagina unde utilizatorii noi își creează contul.
 * Conține un formular cu câmpuri pentru email, parolă, nume și monedă nativă.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  // PASUL 1: State management (gestionarea datelor formularului)
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    nativeCurrency: "RON",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PASUL 2: Funcția de submit (când user apasă butonul "Înregistrare")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne refresh-ul paginii
    setError("");
    setLoading(true);

    try {
      // Trimitem datele la backend
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Eroare: afișăm mesajul de eroare
        throw new Error(data.error || "Eroare la înregistrare");
      }

      // Succes: salvăm token-ul în localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirectăm la dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // PASUL 3: Render UI (interfața vizuală)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vibe Budget
          </h1>
          <p className="text-gray-800">Creează-ți contul</p>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Câmp: Nume */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nume complet
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Dan Mitrut"
            />
          </div>

          {/* Câmp: Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="dan@example.com"
            />
          </div>

          {/* Câmp: Parolă */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Parolă
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Minim 6 caractere"
            />
          </div>

          {/* Câmp: Monedă Nativă */}
          <div>
            <label
              htmlFor="nativeCurrency"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Moneda nativă
            </label>
            <select
              id="nativeCurrency"
              value={formData.nativeCurrency}
              onChange={(e) =>
                setFormData({ ...formData, nativeCurrency: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            >
              <option value="RON">RON (Leu românesc)</option>
              <option value="MDL">MDL (Leu moldovenesc)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dolar american)</option>
            </select>
          </div>

          {/* Mesaj eroare */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Buton Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se procesează..." : "Înregistrare"}
          </button>
        </form>

        {/* Link către Login */}
        <div className="mt-6 text-center text-sm text-gray-800">
          Ai deja cont?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Autentifică-te
          </Link>
        </div>
      </div>
    </div>
  );
}
