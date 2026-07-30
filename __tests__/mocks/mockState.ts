import { AppState, initialAppState, initialFilters } from '../../context/state';

export const mockInitialState: AppState = {
  // Start from the real initial state so newly-added AppState fields (e.g.
  // dealbreakerCategoryIds, blocked, rawResults) are always present, then keep
  // the test-specific overrides below.
  ...initialAppState,
  categories: [],
  detail: null,
  filter: {},
  filters: {
    ...initialFilters,
    categoryIds: [],
    excludedCategoryIds: [],
    priceLevels: [],
    openNow: false,
    radiusMeters: 1600,
    minRating: 0,
  },
  location: '',
  currentCoords: null,
  results: [],
  showFilter: false,
  favorites: [],
  history: [],
  spinHistory: [],
  selectedBusiness: null,
  isBusinessModalOpen: false,
};

// Simple test to avoid "must contain at least one test" error
describe('mockState', () => {
  it('should export a valid initial state', () => {
    expect(mockInitialState).toBeDefined();
    expect(mockInitialState.categories).toEqual([]);
    expect(mockInitialState.showFilter).toBe(false);
  });
});