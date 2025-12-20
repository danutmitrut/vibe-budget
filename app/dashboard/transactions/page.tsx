/**
 * PAGINA: DASHBOARD/TRANSACTIONS (Lista Tranzacții)
 *
 * EXPLICAȚIE:
 * Pagina unde utilizatorul vede toate tranzacțiile importate
 * și poate să le categorizeze.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
  id: string;
  bankId: string | null;
  categoryId: string | null;
  date: Date;
  description: string;
  amount: number;
  currency: string;
}

interface Bank {
  id: string;
  name: string;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtre
  const [selectedBankId, setSelectedBankId] = useState("");
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Create category modal
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📋");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);

  // Editing category mode
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Recategorize state
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [recategorizeMessage, setRecategorizeMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedBankId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch paralel pentru toate datele
      const [transactionsRes, banksRes, categoriesRes] = await Promise.all([
        fetch(`/api/transactions?limit=200${selectedBankId ? `&bankId=${selectedBankId}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/banks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!transactionsRes.ok || !banksRes.ok || !categoriesRes.ok) {
        throw new Error("Eroare la încărcarea datelor");
      }

      const transactionsData = await transactionsRes.json();
      const banksData = await banksRes.json();
      const categoriesData = await categoriesRes.json();

      setTransactions(transactionsData.transactions);
      setBanks(banksData.banks);
      setCategories(categoriesData.categories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (transactionId: string, value: string) => {
    if (value === "CREATE_NEW") {
      // Deschide modal pentru creare categorie nouă
      setPendingTransactionId(transactionId);
      setShowCreateCategoryModal(true);
    } else {
      // Categorizare normală
      handleCategorize(transactionId, value);
    }
  };

  const handleCategorize = async (transactionId: string, categoryId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId }),
      });

      if (!response.ok) throw new Error("Eroare la categorizare");

      // Actualizăm local
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId
            ? { ...t, categoryId }
            : t
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Introdu numele categoriei");
      return;
    }

    setIsCreatingCategory(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          type: newCategoryType,
          icon: newCategoryIcon,
          color: newCategoryColor,
        }),
      });

      if (!response.ok) throw new Error("Eroare la crearea categoriei");

      const data = await response.json();
      const newCategory = data.category;

      // Adăugăm categoria nouă la listă
      setCategories([...categories, newCategory]);

      // Dacă avem o tranzacție pendentă, o categorizăm automat
      if (pendingTransactionId) {
        await handleCategorize(pendingTransactionId, newCategory.id);
      }

      // Resetăm modal-ul
      setShowCreateCategoryModal(false);
      setPendingTransactionId(null);
      setNewCategoryName("");
      setNewCategoryType("expense");
      setNewCategoryIcon("📋");
      setNewCategoryColor("#6366f1");
      setDropdownResetKey((prev) => prev + 1); // Forțează re-render dropdown
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Sigur vrei să ștergi această tranzacție?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Eroare la ștergere");

      setTransactions(transactions.filter((t) => t.id !== transactionId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecategorize = async () => {
    if (!confirm("Re-categorizare automată va procesa toate tranzacțiile necategorizate bazat pe regulile curente. Continui?")) {
      return;
    }

    setIsRecategorizing(true);
    setRecategorizeMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transactions/recategorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Eroare la re-categorizare");

      const data = await response.json();
      setRecategorizeMessage(`✅ ${data.recategorized} tranzacții categorizate din ${data.total} necategorizate`);

      // Reîncărcăm datele pentru a reflecta modificările
      await fetchData();

      // Ascundem mesajul după 5 secunde
      setTimeout(() => setRecategorizeMessage(""), 5000);
    } catch (err: any) {
      setRecategorizeMessage(`❌ ${err.message}`);
    } finally {
      setIsRecategorizing(false);
    }
  };

  const toggleSelection = (transactionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const selectByCategory = (categoryId: string | null) => {
    const categoryTransactions = filteredTransactions.filter(
      (t) => t.categoryId === categoryId
    );
    setSelectedIds(new Set(categoryTransactions.map((t) => t.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("Selectează tranzacții pentru ștergere");
      return;
    }

    if (!confirm(`Sigur vrei să ștergi ${selectedIds.size} tranzacții?`)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transactions/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) throw new Error("Eroare la ștergerea multiplă");

      const data = await response.json();
      alert(data.message);

      // Actualizăm local
      setTransactions(
        transactions.filter((t) => !selectedIds.has(t.id))
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getBankName = (bankId: string | null) => {
    if (!bankId) return "Necunoscută";
    const bank = banks.find((b) => b.id === bankId);
    return bank?.name || "Necunoscută";
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category;
  };

  const filteredTransactions = showOnlyUncategorized
    ? transactions.filter((t) => t.categoryId === null)
    : transactions;

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
            <h1 className="text-2xl font-bold text-gray-900">
              Tranzacții ({filteredTransactions.length})
            </h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Înapoi
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtre */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtre</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-800 mb-2">Bancă</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Toate băncile</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUncategorized}
                  onChange={(e) => setShowOnlyUncategorized(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-700">
                  Doar necategorizate
                </span>
              </label>
              <button
                onClick={handleRecategorize}
                disabled={isRecategorizing}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {isRecategorizing ? "Re-categorizare..." : "🔄 Re-categorizare automată"}
              </button>
            </div>
          </div>
          {recategorizeMessage && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
              {recategorizeMessage}
            </div>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-indigo-900">
                {selectedIds.size} selectate
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
              >
                Deselectează tot
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      selectByCategory(e.target.value === "null" ? null : e.target.value);
                    }
                    e.target.value = "";
                  }}
                  className="px-4 py-2 border border-indigo-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition"
                >
                  <option value="">Selectează după categorie...</option>
                  <option value="null">🚫 Necategorizate</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isDeleting ? "Se șterge..." : "Șterge selectate"}
              </button>
            </div>
          </div>
        )}

        {/* Lista tranzacții */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-800 mb-4">
              Nu există tranzacții.{" "}
              <Link href="/dashboard/upload" className="text-indigo-600 underline">
                Importă tranzacții
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredTransactions.length > 0 &&
                          selectedIds.size === filteredTransactions.length
                        }
                        onChange={toggleSelectAll}
                        className="w-5 h-5 cursor-pointer"
                        title="Selectează tot"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Bancă</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Descriere</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Categorie</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Sumă</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const category = getCategoryName(transaction.categoryId);
                    const isSelected = selectedIds.has(transaction.id);
                    return (
                      <tr
                        key={transaction.id}
                        className={`border-b hover:bg-gray-50 ${
                          isSelected ? "bg-indigo-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(transaction.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(() => {
                            try {
                              // Convertim la string și curățăm
                              const dateStr = String(transaction.date).split('T')[0];

                              // Verificăm dacă e format valid YYYY-MM-DD
                              if (dateStr.includes('-')) {
                                const [year, month, day] = dateStr.split('-');
                                if (year && month && day) {
                                  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
                                }
                              }

                              // Fallback: folosim Date object
                              return new Date(transaction.date).toLocaleDateString("ro-RO");
                            } catch (e) {
                              console.error('Date parse error:', transaction.date, e);
                              return String(transaction.date);
                            }
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getBankName(transaction.bankId)}
                        </td>
                        <td className="px-4 py-3 text-sm">{transaction.description}</td>
                        <td className="px-4 py-3 text-sm">
                          {category && editingCategoryId !== transaction.id ? (
                            <span
                              onClick={() => setEditingCategoryId(transaction.id)}
                              className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition inline-flex items-center gap-1"
                              style={{
                                backgroundColor: category.color || "#6366f1",
                                color: "white",
                              }}
                              title="Click pentru a schimba categoria"
                            >
                              {category.icon} {category.name}
                              <span className="text-[10px] opacity-70">✏️</span>
                            </span>
                          ) : (
                            <select
                              key={`${transaction.id}-${dropdownResetKey}`}
                              value={editingCategoryId === transaction.id && category ? category.id : ""}
                              onChange={(e) => {
                                handleCategorySelect(transaction.id, e.target.value);
                                setEditingCategoryId(null);
                              }}
                              onBlur={() => setEditingCategoryId(null)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-xs"
                              autoFocus={editingCategoryId === transaction.id}
                            >
                              <option value="">Alege categoria...</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                              <option value="" disabled>──────────</option>
                              <option value="CREATE_NEW" className="font-semibold text-indigo-600">
                                ➕ Creare categorie nouă
                              </option>
                            </select>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-semibold ${
                            transaction.amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Șterge
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Creare Categorie */}
        {showCreateCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Creare Categorie Nouă
              </h2>

              <div className="space-y-4">
                {/* Nume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nume categorie
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ex: Restaurant, Benzină, Salariu"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                    autoFocus
                  />
                </div>

                {/* Tip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip
                  </label>
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as "income" | "expense")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                  >
                    <option value="expense">Cheltuială</option>
                    <option value="income">Venit</option>
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon (emoji)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      placeholder="📋"
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl"
                      maxLength={2}
                    />
                    <div className="flex-1 flex gap-1 flex-wrap">
                      {["🍔", "🚗", "🏠", "💊", "🎬", "📚", "💰", "💸", "🧾"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewCategoryIcon(emoji)}
                          className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 text-xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Culoare */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Culoare
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <div className="flex-1 flex gap-2 flex-wrap">
                      {["#ec4899", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#64748b"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCategoryColor(color)}
                          className="w-10 h-10 rounded-lg border-2"
                          style={{
                            backgroundColor: color,
                            borderColor: newCategoryColor === color ? "#000" : color,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Butoane */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateCategoryModal(false);
                    setPendingTransactionId(null);
                    setNewCategoryName("");
                    setDropdownResetKey((prev) => prev + 1); // Resetează dropdown
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isCreatingCategory}
                >
                  Anulează
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCategory ? "Se creează..." : "Creare categorie"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
