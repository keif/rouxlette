import { useContext, useCallback, useEffect, useRef } from 'react';
import { RootContext } from '../context/RootContext';
import { addHistory, clearHistory, hydrateHistory } from '../context/reducer';
import { HistoryItem, STORAGE_KEYS, DEBOUNCE_PERSISTENCE_MS } from '../types/favorites';
import { BusinessProps } from './useResults';
import usePersistentStorage from './usePersistentStorage';
import { logSafe, safeStringify } from '../utils/log';

// Utility to generate UUID for history items
const generateId = (): string => {
  return 'hist_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

interface HistoryContext {
  searchTerm?: string;
  locationText?: string;
  coords?: { latitude: number; longitude: number };
  filters?: {
    openNow?: boolean;
    categories?: string[];
    priceLevels?: Array<1|2|3|4>;
    radiusMeters?: number;
    minRating?: number;
  };
}

export function useHistory() {
  const { state, dispatch } = useContext(RootContext);
  
  // Create storage instance with stable deps
  const storage = usePersistentStorage({
    keyPrefix: '@roux',
    debug: __DEV__,
    debounceMs: DEBOUNCE_PERSISTENCE_MS,
  });

  // Idempotent guards to prevent loops
  const isHydratingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const prevSerializedRef = useRef<string>('');
  const hydrateCounterRef = useRef(0);

  // (a) One-time hydrate guard
  useEffect(() => {
    if (hasHydratedRef.current) {
      logSafe('[useHistory] Skipping duplicate hydration');
      return;
    }
    
    isHydratingRef.current = true;
    hydrateCounterRef.current += 1;
    const runId = hydrateCounterRef.current;

    const loadHistory = async () => {
      try {
        logSafe(`[useHistory] Starting hydration #${runId}`);
        const storedHistory = await storage.getItem<HistoryItem[]>(STORAGE_KEYS.HISTORY);
        
        // Ensure we're still the current hydration attempt
        if (runId !== hydrateCounterRef.current) {
          logSafe(`[useHistory] Hydration #${runId} cancelled - newer request in progress`);
          return;
        }

        dispatch(hydrateHistory(storedHistory ?? []));
        hasHydratedRef.current = true;
        logSafe(`[useHistory] Hydrated #${runId}`, { count: (storedHistory?.length ?? 0) });
      } catch (error) {
        logSafe(`[useHistory] Error in hydration #${runId}`, { error: error?.message });
        if (runId === hydrateCounterRef.current) {
          // Fallback to empty array only if we're still the current attempt
          dispatch(hydrateHistory([]));
          hasHydratedRef.current = true;
        }
      } finally {
        if (runId === hydrateCounterRef.current) {
          isHydratingRef.current = false;
        }
      }
    };

    loadHistory();
  }, []); // Empty deps - run only once per mount

  // (b) Re-entrancy guard for persist
  useEffect(() => {
    // Don't persist until hydration is complete
    if (!hasHydratedRef.current || isHydratingRef.current) {
      logSafe('[useHistory] Skipping persist - hydration not complete');
      return;
    }

    // Serialize deterministically to compare
    const snapshot = safeStringify(state.history);
    if (snapshot === prevSerializedRef.current) {
      // No change; skip
      return;
    }

    logSafe('[useHistory] History changed, scheduling persist', { 
      count: state.history.length,
      prevLength: prevSerializedRef.current ? JSON.parse(prevSerializedRef.current).length : 0
    });

    prevSerializedRef.current = snapshot;

    // Debounce to avoid rapid loops
    const timeoutId = setTimeout(async () => {
      try {
        await storage.setItem(STORAGE_KEYS.HISTORY, state.history);
        logSafe('[useHistory] Persisted history', { count: state.history.length });
      } catch (error) {
        logSafe('[useHistory] Persist error', { message: error?.message });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [state.history]); // Only depend on history, not storage

  // Add a history entry
  const addHistoryEntry = useCallback(({
    business,
    source,
    context,
  }: {
    business: BusinessProps;
    source: 'spin' | 'manual';
    context?: HistoryContext;
  }) => {
    const historyItem: HistoryItem = {
      id: generateId(),
      businessId: business.id,
      name: business.name,
      selectedAt: Date.now(),
      source,
      context,
    };

    logSafe('[useHistory] Adding history entry', { 
      businessId: business.id, 
      name: business.name, 
      source,
      hasContext: !!context 
    });
    
    dispatch(addHistory(historyItem));
  }, [dispatch]);

  // Clear all history - avoid direct storage access to prevent loops  
  const clearHistoryEntries = useCallback(() => {
    logSafe('[useHistory] Clearing all history');
    dispatch(clearHistory());
    // Storage clearing will happen automatically via the persist effect
  }, [dispatch]);

  // Get history sorted by newest first (reducer already sorts, but for completeness)
  const getSortedHistory = useCallback(() => {
    return [...state.history].sort((a, b) => b.selectedAt - a.selectedAt);
  }, [state.history]);

  // Get recent history (last N items)
  const getRecentHistory = useCallback((limit: number = 10) => {
    return getSortedHistory().slice(0, limit);
  }, [getSortedHistory]);

  // Find history by business ID
  const getHistoryForBusiness = useCallback((businessId: string) => {
    return state.history.filter(item => item.businessId === businessId);
  }, [state.history]);

  return {
    history: state.history,
    sortedHistory: getSortedHistory(),
    addHistoryEntry,
    clearHistory: clearHistoryEntries,
    getRecentHistory,
    getHistoryForBusiness,
  };
}