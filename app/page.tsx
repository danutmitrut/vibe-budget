/**
 * 🏠 HOME PAGE - VIBE BUDGET STARTER
 *
 * Aceasta este pagina de start a aplicației Vibe Budget.
 * În timpul cursului vom construi împreună:
 * - Sistem de autentificare (login/register)
 * - Dashboard cu rezumat financiar
 * - Management bănci, categorii, valute
 * - Lista tranzacții + upload CSV/Excel
 * - Rapoarte și grafice
 * - AI insights (health score, recomandări)
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50  ">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900  mb-6">
            💰 Vibe Budget
          </h1>
          <p className="text-xl text-gray-600  mb-8">
            Aplicație de gestiune financiară personală
          </p>

          <div className="bg-white/80  backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 ">
              🚀 Ce vom construi în Săptămânile 4-5
            </h2>

            <div className="text-left space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-gray-900 ">Dashboard interactiv</h3>
                  <p className="text-gray-600 ">Rezumat financiar cu grafice și statistici</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🏦</span>
                <div>
                  <h3 className="font-semibold text-gray-900 ">Multi-bank support</h3>
                  <p className="text-gray-600 ">Gestionează conturi de la mai multe bănci</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <h3 className="font-semibold text-gray-900 ">Upload CSV/Excel</h3>
                  <p className="text-gray-600 ">Import automat extrase bancare (Revolut, ING, BT)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-gray-900 ">AI Financial Coach</h3>
                  <p className="text-gray-600 ">Recomandări personalizate cu Claude AI</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-teal-50  rounded-lg">
              <p className="text-sm text-gray-700 ">
                <strong>📚 Starter Kit Include:</strong> Next.js setup complet, Drizzle ORM schema,
                Supabase config, Tailwind styling, și structura folderelor pregătită.
              </p>
            </div>
          </div>

          <p className="mt-8 text-gray-500 ">
            Începe cu <span className="font-mono bg-gray-100  px-2 py-1 rounded">npm install</span> apoi
            <span className="font-mono bg-gray-100  px-2 py-1 rounded ml-2">npm run dev</span>
          </p>
        </div>
      </div>
    </div>
  );
}
