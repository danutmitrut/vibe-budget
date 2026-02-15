/**
 * PAGINA: LOGIN (Autentificare cu Supabase Auth)
 *
 * EXPLICAȚIE:
 * Utilizează Supabase Authentication pentru login securizat.
 * RLS (Row Level Security) asigură că users văd doar datele proprii.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Autentificare cu Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        const message = signInError.message.toLowerCase();
        if (message.includes("email not confirmed") || message.includes("not confirmed")) {
          await supabase.auth.resend({
            type: "signup",
            email: formData.email,
          });
          setSuccess("Emailul nu este confirmat. Am retrimis emailul de confirmare.");
          return;
        }
        throw new Error(signInError.message);
      }

      if (!data.session) {
        throw new Error("Nu s-a putut crea sesiunea");
      }

      // Compatibilitate cu API routes care folosesc Authorization: Bearer
      localStorage.setItem("token", data.session.access_token);

      // Asigurăm existența profilului în public.users pentru dashboard.
      const defaultName = data.user?.user_metadata?.name || formData.email.split("@")[0] || "Utilizator";
      const defaultCurrency = data.user?.user_metadata?.native_currency || "RON";
      await supabase
        .from("users")
        .upsert(
          {
            id: data.user.id,
            email: data.user.email || formData.email,
            name: defaultName,
            native_currency: defaultCurrency,
          },
          { onConflict: "id" }
        );

      // Succes - redirect la dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh pentru a actualiza session
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Eroare la autentificare";
      setError(message);
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
          <p className="text-gray-800">Autentifică-te în cont</p>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Introdu parola"
            />
          </div>

          {/* Mesaj eroare */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Buton Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se procesează..." : "Autentificare"}
          </button>
        </form>

        {/* Link către Forgot Password */}
        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ai uitat parola?
          </Link>
        </div>

        {/* Link către Register */}
        <div className="mt-6 text-center text-sm text-gray-800">
          Nu ai cont?{" "}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Înregistrează-te
          </Link>
        </div>
      </div>
    </div>
  );
}
