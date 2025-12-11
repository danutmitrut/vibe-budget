/**
 * PAGINA: DASHBOARD/CATEGORIES (Gestionare Categorii)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul gestionează categoriile de venituri/cheltuieli.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  isSystemCategory: boolean; // true = categorie predefinită (nu se poate șterge)
  description?: string | null; // Explicația categoriei
  createdAt: Date;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense",
    color: "#ef4444",
    icon: "📁",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Eroare la încărcarea categoriilor");

      const data = await response.json();
      setCategories(data.categories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setNewCategory({ name: "", type: "expense", color: "#ef4444", icon: "📁" });
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi această categorie?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Eroare la ștergerea categoriei");

      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Culori și emoji-uri predefinite
  const typeColors: Record<string, string> = {
    income: "#22c55e",
    expense: "#ef4444",
    savings: "#8b5cf6",
  };

  const emojiSuggestions = ["💰", "🏠", "🍔", "🚗", "💳", "🎮", "📚", "⚡", "🎵", "🏥"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-800">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestionare Categorii</h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Înapoi
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formular adăugare */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Adaugă categorie nouă</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nume categorie (ex: Salariu)"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select
                value={newCategory.type}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    type: e.target.value,
                    color: typeColors[e.target.value],
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="income">Venit</option>
                <option value="expense">Cheltuială</option>
                <option value="savings">Economii</option>
              </select>
            </div>

            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Emoji (ex: 💰)"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl"
              />
              <div className="flex gap-2">
                {emojiSuggestions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                    className="text-2xl hover:scale-125 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {adding ? "Adaugă..." : "Adaugă categorie"}
            </button>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Lista categorii */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Categoriile tale ({categories.length})</h2>
          {categories.length === 0 ? (
            <p className="text-gray-800 text-center py-8">
              Nu ai adăugat încă categorii. Începe acum! 📁
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition ${
                    category.isSystemCategory
                      ? "border-indigo-300 bg-indigo-50/30"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: category.color || "#6366f1" }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        {category.isSystemCategory && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                            Predefinită
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 capitalize">{category.type}</p>
                      {category.description && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {!category.isSystemCategory && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                    >
                      Șterge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
