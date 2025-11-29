import { appReducer, setFilters, resetFilters, hydrateFilters } from '../../context/reducer';
import { AppState, initialAppState, initialFilters, Filters } from '../../context/state';
import { ActionType } from '../../context/actions';

describe('Filters Reducer', () => {
  let initialState: AppState;

  beforeEach(() => {
    initialState = { ...initialAppState };
  });

  describe('SetFilters action', () => {
    it('should update filters with partial filter data', () => {
      const partialFilters: Partial<Filters> = {
        categoryIds: ['pizza', 'italian'],
        openNow: true
      };

      const action = setFilters(partialFilters);
      const newState = appReducer(initialState, action);

      expect(newState.filters).toEqual({
        ...initialFilters,
        categoryIds: ['pizza', 'italian'],
        openNow: true
      });
      expect(newState.filters.priceLevels).toEqual([]); // Should remain unchanged
      expect(newState.filters.radiusMeters).toBe(1600); // Should remain unchanged
      expect(newState.filters.minRating).toBe(0); // Should remain unchanged
    });

    it('should merge filters correctly with existing state', () => {
      // Set initial filter state
      const stateWithFilters: AppState = {
        ...initialState,
        filters: {
          ...initialFilters,
          categoryIds: ['existing'],
          priceLevels: [1, 2],
          minRating: 3
        }
      };

      const partialFilters: Partial<Filters> = {
        categoryIds: ['pizza', 'italian'],
        openNow: true
      };

      const action = setFilters(partialFilters);
      const newState = appReducer(stateWithFilters, action);

      expect(newState.filters).toEqual({
        categoryIds: ['pizza', 'italian'], // Updated
        excludedCategoryIds: [], // Preserved from initialFilters
        priceLevels: [1, 2], // Preserved
        openNow: true, // Updated
        radiusMeters: 1600, // Preserved
        minRating: 3 // Preserved
      });
    });

    it('should handle all filter properties', () => {
      const fullFilters: Partial<Filters> = {
        categoryIds: ['pizza', 'burgers'],
        excludedCategoryIds: [],
        priceLevels: [2, 3, 4],
        openNow: true,
        radiusMeters: 800,
        minRating: 4.0
      };

      const action = setFilters(fullFilters);
      const newState = appReducer(initialState, action);

      expect(newState.filters).toEqual(fullFilters);
    });

    it('should have correct action type', () => {
      const action = setFilters({});
      expect(action.type).toBe(ActionType.SetFilters);
    });
  });

  describe('ResetFilters action', () => {
    it('should reset filters to initial state', () => {
      const stateWithFilters: AppState = {
        ...initialState,
        filters: {
          categoryIds: ['pizza', 'italian'],
          excludedCategoryIds: ['bars'],
          priceLevels: [1, 2, 3, 4],
          openNow: true,
          radiusMeters: 5000,
          minRating: 4.5
        }
      };

      const action = resetFilters();
      const newState = appReducer(stateWithFilters, action);

      expect(newState.filters).toEqual(initialFilters);
      expect(newState.filters.categoryIds).toEqual([]);
      expect(newState.filters.priceLevels).toEqual([]);
      expect(newState.filters.openNow).toBe(false);
      expect(newState.filters.radiusMeters).toBe(1600);
      expect(newState.filters.minRating).toBe(0);
    });

    it('should not affect other state properties', () => {
      const mockBusiness = { id: '1', name: 'Test', is_closed: false } as any;
      const stateWithFilters: AppState = {
        ...initialState,
        location: 'Test Location',
        rawResults: [mockBusiness],
        results: [mockBusiness],
        filters: {
          categoryIds: ['pizza'],
          excludedCategoryIds: [],
          priceLevels: [2],
          openNow: true,
          radiusMeters: 3000,
          minRating: 3.5
        }
      };

      const action = resetFilters();
      const newState = appReducer(stateWithFilters, action);

      expect(newState.location).toBe('Test Location');
      // Results are re-filtered from rawResults when filters reset
      expect(newState.results).toEqual([mockBusiness]);
      expect(newState.filters).toEqual(initialFilters);
    });

    it('should have correct action type', () => {
      const action = resetFilters();
      expect(action.type).toBe(ActionType.ResetFilters);
    });
  });

  describe('HydrateFilters action', () => {
    it('should replace entire filters object', () => {
      const hydratedFilters: Filters = {
        categoryIds: ['japanese', 'sushi'],
        excludedCategoryIds: [],
        priceLevels: [3, 4],
        openNow: true,
        radiusMeters: 2400,
        minRating: 4.2
      };

      const action = hydrateFilters(hydratedFilters);
      const newState = appReducer(initialState, action);

      expect(newState.filters).toEqual(hydratedFilters);
    });

    it('should completely replace existing filters', () => {
      const stateWithFilters: AppState = {
        ...initialState,
        filters: {
          categoryIds: ['existing'],
          excludedCategoryIds: ['old'],
          priceLevels: [1],
          openNow: false,
          radiusMeters: 800,
          minRating: 2.0
        }
      };

      const hydratedFilters: Filters = {
        categoryIds: ['new'],
        excludedCategoryIds: [],
        priceLevels: [4],
        openNow: true,
        radiusMeters: 3200,
        minRating: 5.0
      };

      const action = hydrateFilters(hydratedFilters);
      const newState = appReducer(stateWithFilters, action);

      expect(newState.filters).toEqual(hydratedFilters);
      expect(newState.filters).not.toEqual(stateWithFilters.filters);
    });

    it('should not affect other state properties', () => {
      const complexState: AppState = {
        ...initialState,
        categories: [{ alias: 'test', title: 'Test' }],
        location: 'Test Location',
        showFilter: true,
        selectedBusiness: { id: 'test' } as any
      };

      const hydratedFilters: Filters = {
        categoryIds: ['hydrated'],
        excludedCategoryIds: [],
        priceLevels: [2],
        openNow: false,
        radiusMeters: 1200,
        minRating: 1.5
      };

      const action = hydrateFilters(hydratedFilters);
      const newState = appReducer(complexState, action);

      expect(newState.categories).toEqual(complexState.categories);
      expect(newState.location).toBe(complexState.location);
      expect(newState.showFilter).toBe(complexState.showFilter);
      expect(newState.selectedBusiness).toEqual(complexState.selectedBusiness);
      expect(newState.filters).toEqual(hydratedFilters);
    });

    it('should handle empty filters object', () => {
      const emptyFilters: Filters = {
        categoryIds: [],
        excludedCategoryIds: [],
        priceLevels: [],
        openNow: false,
        radiusMeters: 1600,
        minRating: 0
      };

      const action = hydrateFilters(emptyFilters);
      const newState = appReducer(initialState, action);

      expect(newState.filters).toEqual(emptyFilters);
    });

    it('should have correct action type', () => {
      const action = hydrateFilters(initialFilters);
      expect(action.type).toBe(ActionType.HydrateFilters);
    });
  });

  describe('Helper function types', () => {
    it('should create SetFilters action with correct payload structure', () => {
      const filters = { categoryIds: ['test'], openNow: true };
      const action = setFilters(filters);

      expect(action).toEqual({
        type: ActionType.SetFilters,
        payload: { filters }
      });
    });

    it('should create ResetFilters action with no payload', () => {
      const action = resetFilters();

      expect(action).toEqual({
        type: ActionType.ResetFilters
      });
    });

    it('should create HydrateFilters action with correct payload structure', () => {
      const filters = initialFilters;
      const action = hydrateFilters(filters);

      expect(action).toEqual({
        type: ActionType.HydrateFilters,
        payload: { filters }
      });
    });
  });
});