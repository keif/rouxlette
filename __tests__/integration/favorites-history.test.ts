import { appReducer } from '../../context/reducer';
import { initialAppState } from '../../context/state';
import { FavoriteItem, HistoryItem } from '../../types/favorites';
import {
  addFavorite,
  removeFavorite,
  addHistory,
  clearHistory,
} from '../../context/reducer';

describe('Favorites and History Integration', () => {
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
    addedAt: Date.now(),
  };

  const mockHistoryItem: HistoryItem = {
    id: 'hist_123',
    businessId: 'test-business-1',
    name: 'Test Restaurant',
    selectedAt: Date.now(),
    source: 'spin',
    context: {
      searchTerm: 'pizza',
      locationText: 'San Francisco',
      filters: {
        openNow: true,
        categories: ['italian'],
        priceLevels: [2, 3],
      },
    },
  };

  describe('Basic Operations', () => {
    it('should handle adding and removing favorites', () => {
      let state = initialAppState;

      // Add favorite
      state = appReducer(state, addFavorite(mockFavorite));
      expect(state.favorites).toHaveLength(1);
      expect(state.favorites[0].id).toBe('test-business-1');

      // Remove favorite
      state = appReducer(state, removeFavorite('test-business-1'));
      expect(state.favorites).toHaveLength(0);
    });

    it('should handle adding and clearing history', () => {
      let state = initialAppState;

      // Add history entry
      state = appReducer(state, addHistory(mockHistoryItem));
      expect(state.history).toHaveLength(1);
      expect(state.history[0].id).toBe('hist_123');

      // Clear history
      state = appReducer(state, clearHistory());
      expect(state.history).toHaveLength(0);
    });

    it('should maintain separate favorites and history state', () => {
      let state = initialAppState;

      // Add both favorite and history
      state = appReducer(state, addFavorite(mockFavorite));
      state = appReducer(state, addHistory(mockHistoryItem));

      expect(state.favorites).toHaveLength(1);
      expect(state.history).toHaveLength(1);

      // Remove favorite should not affect history
      state = appReducer(state, removeFavorite('test-business-1'));
      expect(state.favorites).toHaveLength(0);
      expect(state.history).toHaveLength(1);

      // Clear history should not affect favorites (if we add it back)
      state = appReducer(state, addFavorite(mockFavorite));
      state = appReducer(state, clearHistory());
      expect(state.favorites).toHaveLength(1);
      expect(state.history).toHaveLength(0);
    });
  });

  describe('Data Structure Validation', () => {
    it('should maintain correct favorite structure', () => {
      const state = appReducer(initialAppState, addFavorite(mockFavorite));
      const favorite = state.favorites[0];

      expect(favorite).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        categories: expect.any(Array),
        addedAt: expect.any(Number),
      });

      expect(typeof favorite.id).toBe('string');
      expect(typeof favorite.name).toBe('string');
      expect(Array.isArray(favorite.categories)).toBe(true);
      expect(typeof favorite.addedAt).toBe('number');
    });

    it('should maintain correct history structure', () => {
      const state = appReducer(initialAppState, addHistory(mockHistoryItem));
      const historyItem = state.history[0];

      expect(historyItem).toMatchObject({
        id: expect.any(String),
        businessId: expect.any(String),
        name: expect.any(String),
        selectedAt: expect.any(Number),
        source: expect.stringMatching(/^(spin|manual)$/),
      });

      expect(typeof historyItem.id).toBe('string');
      expect(typeof historyItem.businessId).toBe('string');
      expect(typeof historyItem.name).toBe('string');
      expect(typeof historyItem.selectedAt).toBe('number');
      expect(['spin', 'manual']).toContain(historyItem.source);
    });

    it('should handle history context correctly', () => {
      const historyWithContext: HistoryItem = {
        ...mockHistoryItem,
        context: {
          searchTerm: 'test search',
          locationText: 'Test City',
          coords: { latitude: 37.7749, longitude: -122.4194 },
          filters: {
            openNow: true,
            categories: ['italian', 'pizza'],
            priceLevels: [2, 3, 4],
            radiusMeters: 1600,
            minRating: 4,
          },
        },
      };

      const state = appReducer(initialAppState, addHistory(historyWithContext));
      const historyItem = state.history[0];

      expect(historyItem.context).toBeDefined();
      expect(historyItem.context?.searchTerm).toBe('test search');
      expect(historyItem.context?.locationText).toBe('Test City');
      expect(historyItem.context?.coords).toEqual({ latitude: 37.7749, longitude: -122.4194 });
      expect(historyItem.context?.filters).toBeDefined();
      expect(historyItem.context?.filters?.openNow).toBe(true);
      expect(historyItem.context?.filters?.categories).toEqual(['italian', 'pizza']);
      expect(historyItem.context?.filters?.priceLevels).toEqual([2, 3, 4]);
    });

    it('should handle history without context', () => {
      const historyWithoutContext: HistoryItem = {
        id: 'hist_no_context',
        businessId: 'test-business',
        name: 'Test Restaurant',
        selectedAt: Date.now(),
        source: 'manual',
      };

      const state = appReducer(initialAppState, addHistory(historyWithoutContext));
      const historyItem = state.history[0];

      expect(historyItem.context).toBeUndefined();
    });
  });

  describe('Storage Keys Constants', () => {
    it('should export correct storage key constants', () => {
      const { STORAGE_KEYS } = require('../../types/favorites');
      
      expect(STORAGE_KEYS.FAVORITES).toBe('storage:favorites:v1');
      expect(STORAGE_KEYS.HISTORY).toBe('storage:history:v1');
    });

    it('should export correct configuration constants', () => {
      const { HISTORY_MAX_ITEMS, DEBOUNCE_PERSISTENCE_MS } = require('../../types/favorites');
      
      expect(typeof HISTORY_MAX_ITEMS).toBe('number');
      expect(HISTORY_MAX_ITEMS).toBeGreaterThan(0);
      expect(typeof DEBOUNCE_PERSISTENCE_MS).toBe('number');
      expect(DEBOUNCE_PERSISTENCE_MS).toBeGreaterThan(0);
    });
  });
});