import { useCallback } from 'react';
import { CategoryProps } from './useResults';
import { logSafe } from '../utils/log';
import { FOOD_CATEGORIES, getSortedCategories } from '../constants/foodCategories';

/**
 * Hook for loading food/restaurant categories for filtering.
 *
 * NOTE: The Yelp /categories API endpoint requires developer beta access,
 * which is not available with standard API keys. Instead, we use a curated
 * static list of popular food categories that align with Yelp's category aliases.
 *
 * This provides immediate filtering capability without API dependency.
 */
export default function useCategories() {
  /**
   * Load categories (static list)
   * Returns a curated list of food/restaurant categories
   */
  const loadCategories = useCallback((): CategoryProps[] => {
    logSafe('[useCategories] Loading static food categories', {
      count: FOOD_CATEGORIES.length,
    });

    // Return sorted list for consistent UI
    return getSortedCategories();
  }, []);

  /**
   * Get unsorted categories (preserves popularity order)
   */
  const getCategories = useCallback((): CategoryProps[] => {
    return [...FOOD_CATEGORIES];
  }, []);

  return {
    loadCategories,
    getCategories,
  } as const;
}
