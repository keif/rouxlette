import { useCallback, useContext } from 'react';
import { RootContext } from '../context/RootContext';
import { addFavorite, removeFavorite, addBlocked, removeBlocked } from '../context/reducer';
import { useToast } from '../context/ToastContext';
import { BusinessProps } from './useResults';
import { FavoriteItem } from '../types/favorites';
import { logSafe } from '../utils/log';

/**
 * Hook that manages the interaction between block and favorite states.
 *
 * Uses direct context access to avoid stale closure issues with
 * separate useFavorites/useBlocked hooks.
 *
 * Rules:
 * - Block → Favorite: Unblock + Add to favorites
 * - Block → Block: Unblock (neutral state)
 * - Favorite → Block: Remove from favorites + Add to block
 * - Favorite → Favorite: Remove from favorites (neutral state)
 */
export function useBlockFavorite() {
  const { state, dispatch } = useContext(RootContext);
  const { showToast } = useToast();

  // Convert BusinessProps to FavoriteItem for storage
  const businessToItem = useCallback((business: BusinessProps): FavoriteItem => {
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

  // Check functions that read directly from current state
  const isFavorite = useCallback((businessId: string): boolean => {
    return state.favorites.some(fav => fav.id === businessId);
  }, [state.favorites]);

  const isBlocked = useCallback((businessId: string): boolean => {
    return state.blocked.some(item => item.id === businessId);
  }, [state.blocked]);

  /**
   * Handle block button press.
   * - If blocked: unblock (neutral state)
   * - If not blocked: remove from favorites (if favorited) + add to block
   */
  const handleBlock = useCallback((business: BusinessProps) => {
    const businessId = business.id;
    // Check directly against current state to avoid stale closures
    const currentlyBlocked = state.blocked.some(item => item.id === businessId);
    const currentlyFavorite = state.favorites.some(fav => fav.id === businessId);

    logSafe('[useBlockFavorite] handleBlock', {
      businessId,
      name: business.name,
      currentlyBlocked,
      currentlyFavorite
    });

    if (currentlyBlocked) {
      // Unblock - go to neutral state
      dispatch(removeBlocked(businessId));
      showToast(`Unblocked ${business.name}`);
    } else {
      // Block - remove from favorites first if needed
      if (currentlyFavorite) {
        dispatch(removeFavorite(businessId));
      }
      dispatch(addBlocked(businessToItem(business)));
      showToast(`Blocked ${business.name}`);
    }
  }, [state.blocked, state.favorites, dispatch, businessToItem, showToast]);

  /**
   * Handle favorite button press.
   * - If favorited: unfavorite (neutral state)
   * - If not favorited: unblock (if blocked) + add to favorites
   */
  const handleFavorite = useCallback((business: BusinessProps) => {
    const businessId = business.id;
    // Check directly against current state to avoid stale closures
    const currentlyBlocked = state.blocked.some(item => item.id === businessId);
    const currentlyFavorite = state.favorites.some(fav => fav.id === businessId);

    logSafe('[useBlockFavorite] handleFavorite', {
      businessId,
      name: business.name,
      currentlyBlocked,
      currentlyFavorite
    });

    if (currentlyFavorite) {
      // Unfavorite - go to neutral state
      dispatch(removeFavorite(businessId));
      showToast(`Removed ${business.name} from favorites`);
    } else {
      // Favorite - unblock first if needed
      if (currentlyBlocked) {
        dispatch(removeBlocked(businessId));
      }
      dispatch(addFavorite(businessToItem(business)));
      showToast(`Added ${business.name} to favorites`);
    }
  }, [state.blocked, state.favorites, dispatch, businessToItem, showToast]);

  return {
    isBlocked,
    isFavorite,
    handleBlock,
    handleFavorite,
  };
}
