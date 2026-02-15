/**
 * Detectează linii de tip "sold" din extrase bancare.
 * Acestea nu sunt tranzacții reale și trebuie excluse din app.
 */
export function isBalanceSnapshotDescription(description: string | null | undefined): boolean {
  if (!description) {
    return false;
  }

  const normalized = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const balanceMarkers = [
    "sold initial",
    "sold final",
    "sold precedent",
    "sold anterior",
    "saldo initial",
    "saldo final",
    "balanta initiala",
    "balanta finala",
    "opening balance",
    "closing balance",
    "initial balance",
    "final balance",
    "beginning balance",
    "ending balance",
    "balance brought forward",
    "balance carried forward",
  ];

  return balanceMarkers.some((marker) => normalized.includes(marker));
}
