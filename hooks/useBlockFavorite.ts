import { useCallback } from 'react';
import { useFavorites } from './useFavorites';
import { useBlocked } from './useBlocked';
import { useToast } from '../context/ToastContext';
import { BusinessProps } from './useResults';
import { logSafe } from '../utils/log';

/**
 * Hook that manages the interaction between block and favorite states.
 *
 * Rules:
 * - Block → Favorite: Unblock + Add to favorites
 * - Block → Block: Unblock (neutral state)
 * - Favorite → Block: Remove from favorites + Add to block
 * - Favorite → Favorite: Remove from favorites (neutral state)
 */
export function useBlockFavorite() {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { isBlocked, addBlocked, removeBlocked } = useBlocked();
  const { showToast } = useToast();

  /**
   * Handle block button press.
   * - If blocked: unblock (neutral state)
   * - If not blocked: remove from favorites (if favorited) + add to block
   */
  const handleBlock = useCallback((business: BusinessProps) => {
    const businessId = business.id;
    const wasBlocked = isBlocked(businessId);
    const wasFavorite = isFavorite(businessId);

    logSafe('[useBlockFavorite] handleBlock', {
      businessId,
      name: business.name,
      wasBlocked,
      wasFavorite
    });

    if (wasBlocked) {
      // Unblock - go to neutral state
      removeBlocked(businessId);
      showToast(`Unblocked ${business.name}`);
    } else {
      // Block - remove from favorites first if needed
      if (wasFavorite) {
        removeFavorite(businessId);
      }
      addBlocked(business);
      showToast(`Blocked ${business.name}`);
    }
  }, [isBlocked, isFavorite, addBlocked, removeBlocked, removeFavorite, showToast]);

  /**
   * Handle favorite button press.
   * - If favorited: unfavorite (neutral state)
   * - If not favorited: unblock (if blocked) + add to favorites
   */
  const handleFavorite = useCallback((business: BusinessProps) => {
    const businessId = business.id;
    const wasBlocked = isBlocked(businessId);
    const wasFavorite = isFavorite(businessId);

    logSafe('[useBlockFavorite] handleFavorite', {
      businessId,
      name: business.name,
      wasBlocked,
      wasFavorite
    });

    if (wasFavorite) {
      // Unfavorite - go to neutral state
      removeFavorite(businessId);
      showToast(`Removed ${business.name} from favorites`);
    } else {
      // Favorite - unblock first if needed
      if (wasBlocked) {
        removeBlocked(businessId);
      }
      addFavorite(business);
      showToast(`Added ${business.name} to favorites`);
    }
  }, [isBlocked, isFavorite, addFavorite, removeBlocked, removeFavorite, showToast]);

  return {
    isBlocked,
    isFavorite,
    handleBlock,
    handleFavorite,
  };
}
