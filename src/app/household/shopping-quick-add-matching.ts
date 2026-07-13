export interface ShoppingQuickAddMatchCandidate {
  displayName: string;
}

export function findShoppingQuickAddMatch<T extends ShoppingQuickAddMatchCandidate>(
  displayName: string,
  candidates: readonly T[]
): T | null {
  const key = normalizeShoppingQuickAddName(displayName);
  if (!key) return null;
  return (
    candidates.find((candidate) => normalizeShoppingQuickAddName(candidate.displayName) === key) ??
    null
  );
}

export function normalizeShoppingQuickAddName(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "item";
}
