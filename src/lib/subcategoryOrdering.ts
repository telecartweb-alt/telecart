export interface SubcategorySortOrderCandidate {
  id?: string;
  sort_order?: number | null;
}

export function resolveSubcategorySortOrder(
  subcategory: SubcategorySortOrderCandidate,
  fallbackIndex: number,
): number {
  const existing = Number(subcategory.sort_order);
  if (Number.isFinite(existing) && subcategory.sort_order !== null && subcategory.sort_order !== undefined) {
    return existing;
  }

  return fallbackIndex;
}
