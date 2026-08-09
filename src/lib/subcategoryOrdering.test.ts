import { describe, expect, it } from 'vitest';
import { resolveSubcategorySortOrder } from './subcategoryOrdering';

describe('subcategory ordering', () => {
  it('preserves the existing sort_order when editing a subcategory', () => {
    const existingOrder = 4;
    const updated = { id: 'sub-1', name: 'Internet Leased Line', link: 'https://example.com', sort_order: existingOrder };

    expect(resolveSubcategorySortOrder(updated, 0)).toBe(existingOrder);
    expect(updated.sort_order).toBe(existingOrder);
  });

  it('uses the current list index only for newly added subcategories without an order', () => {
    const newSubcategory = { id: 'sub-new', name: 'New Subcategory', link: 'https://example.com', sort_order: undefined };

    expect(resolveSubcategorySortOrder(newSubcategory, 2)).toBe(2);
  });
});
