type MaybeNumber = number | string | null | undefined;

function parseAmount(value: MaybeNumber): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function normalizeTransactionRecord(
  transaction: Record<string, unknown>
) {
  return {
    id: String(transaction.id ?? ""),
    userId: (transaction.userId ?? transaction.user_id ?? null) as string | null,
    bankId: (transaction.bankId ?? transaction.bank_id ?? null) as string | null,
    categoryId: (transaction.categoryId ?? transaction.category_id ?? null) as string | null,
    date: String(transaction.date ?? ""),
    description: String(transaction.description ?? ""),
    amount: parseAmount(transaction.amount as MaybeNumber),
    currency: String(transaction.currency ?? "RON"),
    createdAt: (transaction.createdAt ?? transaction.created_at ?? null) as string | null,
    updatedAt: (transaction.updatedAt ?? transaction.updated_at ?? null) as string | null,
  };
}

export function normalizeCategoryRecord(category: Record<string, unknown>) {
  return {
    id: String(category.id ?? ""),
    userId: (category.userId ?? category.user_id ?? null) as string | null,
    name: String(category.name ?? ""),
    type: String(category.type ?? "expense"),
    color: (category.color ?? null) as string | null,
    icon: (category.icon ?? null) as string | null,
    description: (category.description ?? null) as string | null,
    isSystemCategory: Boolean(
      category.isSystemCategory ?? category.is_system_category ?? false
    ),
    createdAt: (category.createdAt ?? category.created_at ?? null) as string | null,
    updatedAt: (category.updatedAt ?? category.updated_at ?? null) as string | null,
  };
}

export function normalizeBankRecord(bank: Record<string, unknown>) {
  return {
    id: String(bank.id ?? ""),
    userId: (bank.userId ?? bank.user_id ?? null) as string | null,
    name: String(bank.name ?? ""),
    color: (bank.color ?? null) as string | null,
    createdAt: (bank.createdAt ?? bank.created_at ?? null) as string | null,
    updatedAt: (bank.updatedAt ?? bank.updated_at ?? null) as string | null,
  };
}

export function normalizeCurrencyRecord(currency: Record<string, unknown>) {
  return {
    id: String(currency.id ?? ""),
    userId: (currency.userId ?? currency.user_id ?? null) as string | null,
    code: String(currency.code ?? "").toUpperCase(),
    name: String(currency.name ?? ""),
    symbol: String(currency.symbol ?? ""),
    createdAt: (currency.createdAt ?? currency.created_at ?? null) as string | null,
  };
}
