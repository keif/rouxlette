import { useContext, useCallback, useEffect, useRef } from 'react';
import { RootContext } from '../context/RootContext';
import { addBlocked, removeBlocked, hydrateBlocked } from '../context/reducer';
import { FavoriteItem, DEBOUNCE_PERSISTENCE_MS } from '../types/favorites';
import { BusinessProps } from './useResults';
import usePersistentStorage from './usePersistentStorage';
import { logSafe } from '../utils/log';

const STORAGE_KEY_BLOCKED = 'blocked';

// Track hydration globally to prevent multiple hydrations across hook instances
let blockedHydrated = false;

export function useBlocked() {
  const { state, dispatch } = useContext(RootContext);
  const storage = usePersistentStorage({
    keyPrefix: '@roux',
    debug: __DEV__,
    debounceMs: DEBOUNCE_PERSISTENCE_MS,
  });
  const hasHydratedRef = useRef(false);
  const lastPersistedRef = useRef<string>('');

  // Hydrate blocked from storage ONCE on first mount
  useEffect(() => {
    if (blockedHydrated || hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    blockedHydrated = true;

    const loadBlocked = async () => {
      try {
        const storedBlocked = await storage.getItem(STORAGE_KEY_BLOCKED);
        if (storedBlocked && Array.isArray(storedBlocked)) {
          logSafe('[useBlocked] Hydrating blocked', { count: storedBlocked.length });
          dispatch(hydrateBlocked(storedBlocked));
          lastPersistedRef.current = JSON.stringify(storedBlocked);
        }
      } catch (error) {
        logSafe('[useBlocked] Error loading blocked', { error: error?.message });
      }
    };

    loadBlocked();
  }, [dispatch, storage]);

  // Persist blocked when state changes
  useEffect(() => {
    // Don't persist until we've hydrated
    if (!blockedHydrated) return;

    const currentJson = JSON.stringify(state.blocked);
    // Skip if nothing changed
    if (currentJson === lastPersistedRef.current) return;

    const persistBlocked = async () => {
      try {
        await storage.setItem(STORAGE_KEY_BLOCKED, state.blocked);
        lastPersistedRef.current = currentJson;
        logSafe('[useBlocked] Persisted blocked', { count: state.blocked.length });
      } catch (error) {
        logSafe('[useBlocked] Error persisting blocked', { error: error?.message });
      }
    };

    persistBlocked();
  }, [state.blocked, storage]);

  // Helper to convert BusinessProps to FavoriteItem (reused for blocked)
  const businessToBlockedItem = useCallback((business: BusinessProps): FavoriteItem => {
    return {
      id: business.id,
      name: business.name,
      categories: business.categories?.map(c => c.title?.toLowerCase() || c.alias?.toLowerCase()).filter(Boolean) || [],
      imageUrl: business.image_url,
      rating: business.rating,
      price: business.price,
      isClosed: business.is_closed,
      location: {
        city: business.location?.city,
        address1: business.location?.address1,
        latitude: business.coordinates?.latitude,
        longitude: business.coordinates?.longitude,
      },
      addedAt: Date.now(),
    };
  }, []);

  // Check if a business is blocked
  const isBlocked = useCallback((businessId: string): boolean => {
    return state.blocked.some(item => item.id === businessId);
  }, [state.blocked]);

  // Add a blocked item
  const addBlockedItem = useCallback((business: BusinessProps) => {
    const blockedItem = businessToBlockedItem(business);
    logSafe('[useBlocked] Adding blocked', { businessId: business.id, name: business.name });
    dispatch(addBlocked(blockedItem));
  }, [dispatch, businessToBlockedItem]);

  // Remove a blocked item
  const removeBlockedItem = useCallback((businessId: string) => {
    logSafe('[useBlocked] Removing blocked', { businessId });
    dispatch(removeBlocked(businessId));
  }, [dispatch]);

  // Toggle blocked status
  const toggleBlocked = useCallback((business: BusinessProps) => {
    // Check directly against state.blocked to avoid stale closure
    const currentlyBlocked = state.blocked.some(item => item.id === business.id);
    if (currentlyBlocked) {
      removeBlockedItem(business.id);
    } else {
      addBlockedItem(business);
    }
  }, [state.blocked, addBlockedItem, removeBlockedItem]);

  return {
    blocked: state.blocked,
    isBlocked,
    addBlocked: addBlockedItem,
    removeBlocked: removeBlockedItem,
    toggleBlocked,
  };
}
