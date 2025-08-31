import { useContext, useCallback, useEffect } from 'react';
import { RootContext } from '../context/RootContext';
import { addFavorite, removeFavorite, hydrateFavorites } from '../context/reducer';
import { FavoriteItem, STORAGE_KEYS, DEBOUNCE_PERSISTENCE_MS } from '../types/favorites';
import { BusinessProps } from './useResults';
import usePersistentStorage from './usePersistentStorage';
import { logSafe, logNetwork } from '../utils/log';

export function useFavorites() {
  const { state, dispatch } = useContext(RootContext);
  const storage = usePersistentStorage({
    keyPrefix: '@roux',
    debug: __DEV__,
    debounceMs: DEBOUNCE_PERSISTENCE_MS,
  });

  // Hydrate favorites from storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await storage.getItem(STORAGE_KEYS.FAVORITES);
        if (storedFavorites && Array.isArray(storedFavorites)) {
          logSafe('[useFavorites] Hydrating favorites', { count: storedFavorites.length });
          dispatch(hydrateFavorites(storedFavorites));
        }
      } catch (error) {
        logSafe('[useFavorites] Error loading favorites', { error: error?.message });
        // Fallback to empty array on error
        dispatch(hydrateFavorites([]));
      }
    };

    loadFavorites();
  }, [dispatch, storage]);

  // Persist favorites when state changes
  useEffect(() => {
    const persistFavorites = async () => {
      try {
        await storage.setItem(STORAGE_KEYS.FAVORITES, state.favorites);
        logSafe('[useFavorites] Persisted favorites', { count: state.favorites.length });
      } catch (error) {
        logSafe('[useFavorites] Error persisting favorites', { error: error?.message });
      }
    };

    // Only persist if we have favorites (avoid persisting initial empty state)
    if (state.favorites.length > 0) {
      persistFavorites();
    }
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