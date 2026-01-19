/**
 * PAGINA: REGISTER (Înregistrare cu Supabase Auth)
 *
 * EXPLICAȚIE:
 * Utilizează Supabase Authentication pentru înregistrare securizată.
 * Datele custom (name, nativeCurrency) sunt salvate în tabela `users`.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    nativeCurrency: "RON",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pas 1: Creează cont în Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            native_currency: formData.nativeCurrency,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error("Nu s-a putut crea utilizatorul");
      }

      // Pas 2: Salvează datele custom în tabela users
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          native_currency: formData.nativeCurrency,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Succes - redirect la dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Eroare la înregistrare");
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="Ion Popescu"
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

          {/* Câmp: Monedă nativă */}
          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Monedă nativă
            </label>
            <select
              id="currency"
              value={formData.nativeCurrency}
              onChange={(e) =>
                setFormData({ ...formData, nativeCurrency: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            >
              <option value="RON">RON (Lei românești)</option>
              <option value="MDL">MDL (Lei moldovenești)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dolari americani)</option>
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
