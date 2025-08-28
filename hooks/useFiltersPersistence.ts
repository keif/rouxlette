import { useEffect, useContext, useCallback } from 'react';
import { RootContext } from '../context/RootContext';
import { hydrateFilters } from '../context/reducer';
import { Filters, initialFilters } from '../context/state';
import usePersistentStorage from './usePersistentStorage';
import { logSafe } from '../utils/log';

const FILTERS_STORAGE_KEY = 'filters';

/**
 * Hardened filters persistence hook that prevents feedback loops.
 * 
 * Features:
 * - Hydrates filters once on mount before enabling saves
 * - Only saves when filters actually change (deep comparison)
 * - Debounced writes to prevent AsyncStorage flooding
 * - Graceful error handling
 */
export default function useFiltersPersistence() {
  const { dispatch, state } = useContext(RootContext);
  const storage = usePersistentStorage({ 
    debug: __DEV__,
    debounceMs: 500 // Slightly longer delay for filters
  });

  // Hydrate filters from storage on mount (runs once)
  useEffect(() => {
    const hydrateFromStorage = async () => {
      try {
        const storedFilters = await storage.getItem<Filters>(FILTERS_STORAGE_KEY);
        
        if (storedFilters) {
          // Merge with initial filters to handle schema changes/additions
          const hydratedFilters: Filters = {
            ...initialFilters,
            ...storedFilters,
          };
          
          logSafe('[useFiltersPersistence] Hydrating filters from storage', { categoryCount: hydratedFilters.categoryIds?.length || 0, openNow: hydratedFilters.openNow });
          dispatch(hydrateFilters(hydratedFilters));
        } else {
          // No stored filters found, mark as hydrated with initial state
          logSafe('[useFiltersPersistence] No stored filters found, using initial state');
          storage.markAsHydrated(FILTERS_STORAGE_KEY, initialFilters);
        }
      } catch (error: any) {
        logSafe('[useFiltersPersistence] Failed to hydrate filters', { message: error?.message });
        // Mark as hydrated anyway to prevent infinite loops
        storage.markAsHydrated(FILTERS_STORAGE_KEY, initialFilters);
      }
    };

    hydrateFromStorage();
  }, [dispatch, storage]);

  // Save filters when they change (but only after hydration)
  useEffect(() => {
    // Only save if we've hydrated and filters have actually changed
    if (storage.isHydrated(FILTERS_STORAGE_KEY)) {
      logSafe('[useFiltersPersistence] Saving filters to storage', { categoryCount: state.filters?.categoryIds?.length || 0, openNow: state.filters?.openNow });
      storage.setItem(FILTERS_STORAGE_KEY, state.filters);
    }
  }, [state.filters, storage]);

  // Utility functions for manual control
  const clearStoredFilters = useCallback(async () => {
    try {
      await storage.deleteItem(FILTERS_STORAGE_KEY);
      logSafe('[useFiltersPersistence] Cleared stored filters');
    } catch (error: any) {
      logSafe('[useFiltersPersistence] Failed to clear stored filters', { message: error?.message });
    }
  }, [storage]);

  const forceRestoreDefaults = useCallback(async () => {
    try {
      await storage.forceSetItem(FILTERS_STORAGE_KEY, initialFilters);
      dispatch(hydrateFilters(initialFilters));
      logSafe('[useFiltersPersistence] Restored default filters');
    } catch (error: any) {
      logSafe('[useFiltersPersistence] Failed to restore default filters', { message: error?.message });
    }
  }, [storage, dispatch]);

  return {
    clearStoredFilters,
    forceRestoreDefaults,
    isHydrated: storage.isHydrated(FILTERS_STORAGE_KEY),
  } as const;
}