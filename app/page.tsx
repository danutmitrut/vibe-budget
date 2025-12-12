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
            Gestionează-ți bugetul inteligent
          </p>
          <p className="text-lg text-gray-800">
            Importă extrase bancare, organizează tranzacțiile pe categorii și vezi rapoarte detaliate. În plus primești notificări și sfaturi de gestionare eficientă
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="mb-4 flex justify-center">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Rapoarte clare</h3>
            <p className="text-gray-800">
              Vizualizează cheltuielile pe categorii și perioade
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="mb-4 flex justify-center">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">AI inteligent</h3>
            <p className="text-gray-800">
              Categorizare automată a tranzacțiilor
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="mb-4 flex justify-center">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
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
            Înscrie-te
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
          Aplicație demonstrativă pentru cursul de Vibe Coding
        </p>
      </div>
    </div>
  );
}
