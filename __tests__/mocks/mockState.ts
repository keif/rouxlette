import { AppState, initialFilters } from '../../context/state';

export const mockInitialState: AppState = {
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