import { useContext, useCallback, useEffect, useRef } from 'react';
import { RootContext } from '../context/RootContext';
import { addFavorite, removeFavorite, hydrateFavorites } from '../context/reducer';
import { FavoriteItem, STORAGE_KEYS, DEBOUNCE_PERSISTENCE_MS } from '../types/favorites';
import { BusinessProps } from './useResults';
import usePersistentStorage from './usePersistentStorage';
import { logSafe, logNetwork } from '../utils/log';

// Track hydration globally to prevent multiple hydrations across hook instances
let favoritesHydrated = false;

export function useFavorites() {
  const { state, dispatch } = useContext(RootContext);
  const storage = usePersistentStorage({
    keyPrefix: '@roux',
    debug: __DEV__,
    debounceMs: DEBOUNCE_PERSISTENCE_MS,
  });
  const hasHydratedRef = useRef(false);
  const lastPersistedRef = useRef<string>('');

  // Hydrate favorites from storage ONCE on first mount
  useEffect(() => {
    if (favoritesHydrated || hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    favoritesHydrated = true;

    const loadFavorites = async () => {
      try {
        const storedFavorites = await storage.getItem(STORAGE_KEYS.FAVORITES);
        if (storedFavorites && Array.isArray(storedFavorites)) {
          logSafe('[useFavorites] Hydrating favorites', { count: storedFavorites.length });
          dispatch(hydrateFavorites(storedFavorites));
          lastPersistedRef.current = JSON.stringify(storedFavorites);
        }
      } catch (error) {
        logSafe('[useFavorites] Error loading favorites', { error: error?.message });
      }
    };

    loadFavorites();
  }, [dispatch, storage]);

  // Persist favorites when state changes
  useEffect(() => {
    // Don't persist until we've hydrated
    if (!favoritesHydrated) return;

    const currentJson = JSON.stringify(state.favorites);
    // Skip if nothing changed
    if (currentJson === lastPersistedRef.current) return;

    const persistFavorites = async () => {
      try {
        await storage.setItem(STORAGE_KEYS.FAVORITES, state.favorites);
        lastPersistedRef.current = currentJson;
        logSafe('[useFavorites] Persisted favorites', { count: state.favorites.length });
      } catch (error) {
        logSafe('[useFavorites] Error persisting favorites', { error: error?.message });
      }
    };

    persistFavorites();
  }, [state.favorites, storage]);

  // Helper to convert BusinessProps to FavoriteItem
  const businessToFavorite = useCallback((business: BusinessProps): FavoriteItem => {
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

  // Check if a business is favorited
  const isFavorite = useCallback((businessId: string): boolean => {
    return state.favorites.some(fav => fav.id === businessId);
  }, [state.favorites]);

  // Add a favorite
  const addFavoriteItem = useCallback((business: BusinessProps) => {
    const favoriteItem = businessToFavorite(business);
    logSafe('[useFavorites] Adding favorite', { businessId: business.id, name: business.name });
    dispatch(addFavorite(favoriteItem));
  }, [dispatch, businessToFavorite]);

  // Remove a favorite
  const removeFavoriteItem = useCallback((businessId: string) => {
    logSafe('[useFavorites] Removing favorite', { businessId });
    dispatch(removeFavorite(businessId));
  }, [dispatch]);

  // Toggle favorite status
  const toggleFavorite = useCallback((business: BusinessProps) => {
    if (isFavorite(business.id)) {
      removeFavoriteItem(business.id);
    } else {
      addFavoriteItem(business);
    }
  }, [isFavorite, addFavoriteItem, removeFavoriteItem]);

  return {
    favorites: state.favorites,
    isFavorite,
    addFavorite: addFavoriteItem,
    removeFavorite: removeFavoriteItem,
    toggleFavorite,
  };
}