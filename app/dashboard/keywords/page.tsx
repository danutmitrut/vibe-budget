/**
 * PAGINA: DASHBOARD/KEYWORDS (Management Keyword-uri Personalizate)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul poate vedea, gestiona și șterge keyword-urile
 * personalizate salvate pentru auto-categorizare.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/supabase/auth-headers";

interface UserKeyword {
  id: string;
  keyword: string;
  categoryId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  createdAt: string;
}

export default function KeywordsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [keywords, setKeywords] = useState<UserKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeywords();
  }, []);


  const fetchKeywords = async () => {
    try {
      const authHeaders = await getAuthHeaders();

      const response = await fetch("/api/user-keywords", {
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Eroare la încărcarea keyword-urilor");
      }

      const data = await response.json();
      setKeywords(data.keywords);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keywordId: string, keywordName: string) => {
    if (!confirm(`Sigur vrei să ștergi keyword-ul "${keywordName}"?`)) {
      return;
    }

    setDeletingId(keywordId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/user-keywords?id=${keywordId}`, {
        method: "DELETE",
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Eroare la ștergerea keyword-ului");
      }

      setKeywords(keywords.filter((k) => k.id !== keywordId));
      toast.success(`Keyword "${keywordName}" șters cu succes!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const filteredKeywords = selectedCategory
      ? keywords.filter((k) => k.categoryId === selectedCategory)
      : keywords;

    if (filteredKeywords.length === 0) {
      toast.error("Nu există keyword-uri de șters!");
      return;
    }

    if (
      !confirm(
        `Sigur vrei să ștergi TOATE cele ${filteredKeywords.length} keyword-uri${
          selectedCategory ? " din categoria selectată" : ""
        }?`
      )
    ) {
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();

      // Ștergem în paralel toate keyword-urile
      const responses = await Promise.all(
        filteredKeywords.map((k) =>
          fetch(`/api/user-keywords?id=${k.id}`, {
            method: "DELETE",
            headers: authHeaders,
            credentials: "include",
          })
        )
      );

      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        const data = await failedResponse.json().catch(() => null);
        throw new Error(data?.error || "Eroare la ștergerea în masă");
      }

      // Actualizăm state-ul
      setKeywords(
        keywords.filter(
          (k) => !filteredKeywords.find((fk) => fk.id === k.id)
        )
      );

      toast.success(`${filteredKeywords.length} keyword-uri șterse cu succes!`);
    } catch (err: any) {
      toast.error(err.message || "Eroare la ștergerea în masă");
    }
  };

  // Filtrare keyword-uri
  const filteredKeywords = selectedCategory
    ? keywords.filter((k) => k.categoryId === selectedCategory)
    : keywords;

  // Obținem categoriile unice
  const uniqueCategories = Array.from(
    new Set(keywords.map((k) => k.categoryId))
  )
    .map((categoryId) => {
      const keyword = keywords.find((k) => k.categoryId === categoryId);
      return {
        id: categoryId,
        name: keyword?.categoryName || "Unknown",
        icon: keyword?.categoryIcon || "📋",
        color: keyword?.categoryColor || "#6366f1",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Se încarcă keyword-urile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            ❌ {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🔑 Keyword-uri Personalizate
            </h1>
            <p className="text-gray-600 mt-1">
              Gestionează keyword-urile pentru auto-categorizare
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            ← Înapoi
          </Link>
        </div>

        {/* Filtre și Acțiuni */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <label className="text-sm font-medium text-gray-700">
                Filtrează:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Toate categoriile ({keywords.length})</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name} (
                    {keywords.filter((k) => k.categoryId === cat.id).length})
                  </option>
                ))}
              </select>
            </div>

            {filteredKeywords.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                🗑️ Șterge {selectedCategory ? "filtrate" : "toate"} (
                {filteredKeywords.length})
              </button>
            )}
          </div>
        </div>

        {/* Lista Keyword-uri */}
        {filteredKeywords.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory
                ? "Nu există keyword-uri pentru categoria selectată"
                : "Nu ai keyword-uri salvate încă"}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory
                ? "Încearcă să selectezi o altă categorie."
                : "Când categorizezi manual tranzacții, vei putea salva keyword-uri pentru auto-categorizare."}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory("")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Vezi toate keyword-urile
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data creării
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => (
                  <tr key={keyword.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {keyword.keyword}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 rounded-full text-white text-sm"
                        style={{
                          backgroundColor: keyword.categoryColor || "#6366f1",
                        }}
                      >
                        {keyword.categoryIcon} {keyword.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(keyword.createdAt).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(keyword.id, keyword.keyword)}
                        disabled={deletingId === keyword.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === keyword.id ? "Se șterge..." : "🗑️ Șterge"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            ℹ️ Cum funcționează keyword-urile?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Keyword-urile salvate vor fi aplicate AUTOMAT la importul
              viitor de tranzacții
            </li>
            <li>
              • Keyword-urile au PRIORITATE față de regulile globale din sistem
            </li>
            <li>
              • Poți șterge un keyword oricând - tranzacțiile deja categorizate
              rămân neschimbate
            </li>
            <li>
              • Folosește butonul "🔄 Re-categorizare automată" din pagina
              Tranzacții pentru a re-procesa tranzacțiile necategorizate
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
