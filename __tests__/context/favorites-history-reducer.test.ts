import { appReducer } from '../../context/reducer';
import { initialAppState } from '../../context/state';
import { FavoriteItem, HistoryItem, HISTORY_MAX_ITEMS } from '../../types/favorites';
import { ActionType } from '../../context/actions';
import {
  addFavorite,
  removeFavorite,
  hydrateFavorites,
  addHistory,
  clearHistory,
  hydrateHistory,
} from '../../context/reducer';

describe('Favorites and History Reducer', () => {
  const mockFavorite: FavoriteItem = {
    id: 'test-business-1',
    name: 'Test Restaurant',
    categories: ['italian', 'pizza'],
    imageUrl: 'https://example.com/image.jpg',
    rating: 4.5,
    price: '$$',
    isClosed: false,
    location: {
      city: 'San Francisco',
      address1: '123 Test St',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    addedAt: 1234567890,
  };

  const mockHistoryItem: HistoryItem = {
    id: 'hist_123',
    businessId: 'test-business-1',
    name: 'Test Restaurant',
    selectedAt: 1234567890,
    source: 'spin',
    context: {
      searchTerm: 'pizza',
      locationText: 'San Francisco',
      filters: {
        openNow: true,
        categories: ['italian'],
      },
    },
  };

  describe('Favorites Actions', () => {
    it('should add favorite to empty list', () => {
      const action = addFavorite(mockFavorite);
      const newState = appReducer(initialAppState, action);

      expect(newState.favorites).toHaveLength(1);
      expect(newState.favorites[0]).toEqual(mockFavorite);
    });

    it('should upsert favorite (de-duplicate by id)', () => {
      const existingFavorite: FavoriteItem = {
        ...mockFavorite,
        addedAt: 1000000000, // Older timestamp
      };
      
      const stateWithFavorite = {
        ...initialAppState,
        favorites: [existingFavorite],
      };

      const updatedFavorite: FavoriteItem = {
        ...mockFavorite,
        addedAt: 2000000000, // Newer timestamp
        rating: 4.8, // Updated rating
      };

      const action = addFavorite(updatedFavorite);
      const newState = appReducer(stateWithFavorite, action);

      expect(newState.favorites).toHaveLength(1);
      expect(newState.favorites[0]).toEqual(updatedFavorite);
      expect(newState.favorites[0].addedAt).toBe(2000000000);
      expect(newState.favorites[0].rating).toBe(4.8);
    });

    it('should add multiple different favorites', () => {
      const secondFavorite: FavoriteItem = {
        ...mockFavorite,
        id: 'test-business-2',
        name: 'Another Restaurant',
      };

      let state = appReducer(initialAppState, addFavorite(mockFavorite));
      state = appReducer(state, addFavorite(secondFavorite));

      expect(state.favorites).toHaveLength(2);
      expect(state.favorites.find(f => f.id === 'test-business-1')).toBeTruthy();
      expect(state.favorites.find(f => f.id === 'test-business-2')).toBeTruthy();
    });

    it('should remove favorite by businessId', () => {
      const stateWithFavorites = {
        ...initialAppState,
        favorites: [mockFavorite],
      };

      const action = removeFavorite(mockFavorite.id);
      const newState = appReducer(stateWithFavorites, action);

      expect(newState.favorites).toHaveLength(0);
    });

    it('should not fail when removing non-existent favorite', () => {
      const action = removeFavorite('non-existent-id');
      const newState = appReducer(initialAppState, action);

      expect(newState.favorites).toHaveLength(0);
    });

    it('should hydrate favorites from storage', () => {
      const favoritesToHydrate = [mockFavorite];
      const action = hydrateFavorites(favoritesToHydrate);
      const newState = appReducer(initialAppState, action);

      expect(newState.favorites).toEqual(favoritesToHydrate);
    });

    it('should replace existing favorites when hydrating', () => {
      const existingState = {
        ...initialAppState,
        favorites: [mockFavorite],
      };

      const newFavorites = [
        { ...mockFavorite, id: 'different-id', name: 'Different Restaurant' },
      ];

      const action = hydrateFavorites(newFavorites);
      const newState = appReducer(existingState, action);

      expect(newState.favorites).toEqual(newFavorites);
      expect(newState.favorites).toHaveLength(1);
      expect(newState.favorites[0].id).toBe('different-id');
    });
  });

  describe('History Actions', () => {
    it('should add history item to empty list', () => {
      const action = addHistory(mockHistoryItem);
      const newState = appReducer(initialAppState, action);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual(mockHistoryItem);
    });

    it('should insert history item at head (newest first)', () => {
      const olderHistoryItem: HistoryItem = {
        ...mockHistoryItem,
        id: 'hist_older',
        selectedAt: 1000000000,
        name: 'Older Restaurant',
      };

      const newerHistoryItem: HistoryItem = {
        ...mockHistoryItem,
        id: 'hist_newer',
        selectedAt: 2000000000,
        name: 'Newer Restaurant',
      };

      let state = appReducer(initialAppState, addHistory(olderHistoryItem));
      state = appReducer(state, addHistory(newerHistoryItem));

      expect(state.history).toHaveLength(2);
      expect(state.history[0]).toEqual(newerHistoryItem); // Newest first
      expect(state.history[1]).toEqual(olderHistoryItem); // Older second
    });

    it('should enforce maximum history items cap', () => {
      // Create more than HISTORY_MAX_ITEMS history items
      const manyHistoryItems = Array.from({ length: HISTORY_MAX_ITEMS + 5 }, (_, i) => ({
        ...mockHistoryItem,
        id: `hist_${i}`,
        selectedAt: 1000000000 + i,
        name: `Restaurant ${i}`,
      }));

      let state = initialAppState;
      
      // Add all history items
      for (const item of manyHistoryItems) {
        state = appReducer(state, addHistory(item));
      }

      expect(state.history).toHaveLength(HISTORY_MAX_ITEMS);
      
      // Should keep the newest items
      expect(state.history[0].name).toBe(`Restaurant ${HISTORY_MAX_ITEMS + 4}`); // Newest
      expect(state.history[HISTORY_MAX_ITEMS - 1].name).toBe(`Restaurant 5`); // Oldest kept
    });

    it('should clear all history', () => {
      const stateWithHistory = {
        ...initialAppState,
        history: [mockHistoryItem],
      };

      const action = clearHistory();
      const newState = appReducer(stateWithHistory, action);

      expect(newState.history).toHaveLength(0);
    });

    it('should hydrate history from storage', () => {
      const historyToHydrate = [mockHistoryItem];
      const action = hydrateHistory(historyToHydrate);
      const newState = appReducer(initialAppState, action);

      expect(newState.history).toEqual(historyToHydrate);
    });

    it('should replace existing history when hydrating', () => {
      const existingState = {
        ...initialAppState,
        history: [mockHistoryItem],
      };

      const newHistory = [
        { ...mockHistoryItem, id: 'different-hist-id', name: 'Different Restaurant' },
      ];

      const action = hydrateHistory(newHistory);
      const newState = appReducer(existingState, action);

      expect(newState.history).toEqual(newHistory);
      expect(newState.history).toHaveLength(1);
      expect(newState.history[0].id).toBe('different-hist-id');
    });

    it('should handle history items with different sources', () => {
      const spinHistoryItem: HistoryItem = {
        ...mockHistoryItem,
        id: 'hist_spin',
        source: 'spin',
        name: 'Spin Restaurant',
      };

      const manualHistoryItem: HistoryItem = {
        ...mockHistoryItem,
        id: 'hist_manual',
        source: 'manual',
        name: 'Manual Restaurant',
      };

      let state = appReducer(initialAppState, addHistory(spinHistoryItem));
      state = appReducer(state, addHistory(manualHistoryItem));

      expect(state.history).toHaveLength(2);
      expect(state.history.find(h => h.source === 'spin')).toBeTruthy();
      expect(state.history.find(h => h.source === 'manual')).toBeTruthy();
    });

    it('should handle history items without context', () => {
      const historyWithoutContext: HistoryItem = {
        id: 'hist_no_context',
        businessId: 'test-business',
        name: 'No Context Restaurant',
        selectedAt: 1234567890,
        source: 'spin',
      };

      const action = addHistory(historyWithoutContext);
      const newState = appReducer(initialAppState, action);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0].context).toBeUndefined();
    });
  });

  describe('Action Type Constants', () => {
    it('should have correct action types for favorites', () => {
      expect(addFavorite(mockFavorite).type).toBe(ActionType.AddFavorite);
      expect(removeFavorite('test-id').type).toBe(ActionType.RemoveFavorite);
      expect(hydrateFavorites([]).type).toBe(ActionType.HydrateFavorites);
    });

    it('should have correct action types for history', () => {
      expect(addHistory(mockHistoryItem).type).toBe(ActionType.AddHistory);
      expect(clearHistory().type).toBe(ActionType.ClearHistory);
      expect(hydrateHistory([]).type).toBe(ActionType.HydrateHistory);
    });
  });
});