import { useContext, useEffect, useRef } from 'react';
import { RootContext } from '../context/RootContext';
import { hydrateDealbreakers } from '../context/reducer';
import { DEBOUNCE_PERSISTENCE_MS } from '../types/favorites';
import usePersistentStorage from './usePersistentStorage';
import { logSafe } from '../utils/log';

const STORAGE_KEY_DEALBREAKERS = 'dealbreakers';

// Track hydration globally to prevent multiple hydrations across hook instances
let dealbreakersHydrated = false;

export function useDealbreakers() {
  const { state, dispatch } = useContext(RootContext);
  const storage = usePersistentStorage({
    keyPrefix: '@roux',
    debug: __DEV__,
    debounceMs: DEBOUNCE_PERSISTENCE_MS,
  });
  const hasHydratedRef = useRef(false);
  const lastPersistedRef = useRef<string>('');

  // Hydrate dealbreakers from storage ONCE on first mount
  useEffect(() => {
    if (dealbreakersHydrated || hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    dealbreakersHydrated = true;

    const loadDealbreakers = async () => {
      try {
        const storedDealbreakers = await storage.getItem<string[]>(STORAGE_KEY_DEALBREAKERS);
        if (storedDealbreakers && Array.isArray(storedDealbreakers)) {
          logSafe('[useDealbreakers] Hydrating dealbreakers', { count: storedDealbreakers.length });
          dispatch(hydrateDealbreakers(storedDealbreakers));
          lastPersistedRef.current = JSON.stringify(storedDealbreakers);
        }
      } catch (error) {
        logSafe('[useDealbreakers] Error loading dealbreakers', { error: (error as Error)?.message });
      }
    };

    loadDealbreakers();
  }, [dispatch, storage]);

  // Persist dealbreakers when state changes
  useEffect(() => {
    // Don't persist until we've hydrated
    if (!dealbreakersHydrated) return;

    const currentJson = JSON.stringify(state.dealbreakerCategoryIds);
    // Skip if nothing changed
    if (currentJson === lastPersistedRef.current) return;

    const persistDealbreakers = async () => {
      try {
        await storage.setItem(STORAGE_KEY_DEALBREAKERS, state.dealbreakerCategoryIds);
        lastPersistedRef.current = currentJson;
        logSafe('[useDealbreakers] Persisted dealbreakers', { count: state.dealbreakerCategoryIds.length });
      } catch (error) {
        logSafe('[useDealbreakers] Error persisting dealbreakers', { error: (error as Error)?.message });
      }
    };

    persistDealbreakers();
  }, [state.dealbreakerCategoryIds, storage]);

  return {
    dealbreakers: state.dealbreakerCategoryIds,
  };
}
