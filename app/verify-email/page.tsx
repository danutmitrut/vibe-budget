/**
 * PAGINA: VERIFY EMAIL (Confirmare adresă de email)
 *
 * EXPLICAȚIE:
 * Această pagină procesează link-ul de confirmare din email.
 * User-ul ajunge aici dând click pe link-ul din email.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token lipsă. Link invalid.");
      return;
    }

    // Apelăm API-ul de verificare
    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok && data.verified) {
        setStatus("success");
        setMessage(data.message);

        // Redirect către login după 3 secunde
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Eroare la verificare");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Eroare la verificarea emailului");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verificăm emailul...
            </h1>
            <p className="text-gray-600">Te rugăm să aștepți.</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Email Verificat!
            </h1>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                🎉 Contul tău este acum activ!
                <br />
                Vei fi redirecționat către login în 3 secunde...
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Mergi la Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Verificare Eșuată
            </h1>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2">
                <strong>Posibile cauze:</strong>
              </p>
              <ul className="text-sm text-red-700 text-left space-y-1">
                <li>• Link-ul a expirat (valid 24h)</li>
                <li>• Link-ul a fost deja folosit</li>
                <li>• Link invalid sau corupt</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link
                href="/register"
                className="block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Înregistrare Nouă
              </Link>
              <Link
                href="/login"
                className="block px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Încearcă Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PENTRU CURSANȚI: UX BEST PRACTICES
 *
 * 1. **Loading States**: Arată feedback imediat
 * 2. **Success States**: Confirmă acțiunea + auto-redirect
 * 3. **Error States**: Explică problema + oferă soluții
 * 4. **Visual Feedback**: Emoji-uri mari pentru recunoaștere rapidă
 * 5. **Multiple CTAs**: Oferă opțiuni alternative la eroare
 */
