/**
 * PAGINA PRINCIPALĂ (Landing Page)
 *
 * EXPLICAȚIE:
 * Aceasta este prima pagină pe care o vede utilizatorul când accesează aplicația.
 * Oferim opțiuni de login sau înregistrare.
 */

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Vibe Budget
          </h1>
          <p className="text-2xl text-gray-800 mb-2">
            Gestionează-ți bugetul cu ușurință
          </p>
          <p className="text-lg text-gray-800">
            Importă extrase bancare, categorizează tranzacții și vezi rapoarte detaliate
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Rapoarte clare</h3>
            <p className="text-gray-800">
              Vizualizează cheltuielile pe categorii și perioade
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">AI inteligent</h3>
            <p className="text-gray-800">
              Categorizare automată a tranzacțiilor
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Multi-bancă</h3>
            <p className="text-gray-800">
              Importă din ING, BCR, Revolut, PayPal și altele
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            Începe gratuit
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition shadow-lg border-2 border-indigo-200"
          >
            Am deja cont
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-sm text-gray-800">
          Aplicație demo pentru cursul Vibe Coding
        </p>
      </div>
    </div>
  );
}
