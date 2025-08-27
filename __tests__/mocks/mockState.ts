import { RootState } from '../../context/state';

export const mockInitialState: RootState = {
  categories: [],
  businessDetails: {
    business: null,
    isLoading: false,
    isVisible: false,
  },
  results: [],
  spinHistory: [],
  filters: {
    categoryIds: [],
    priceLevels: [],
    openNow: false,
    radiusMeters: 1600, // ~1 mile default
    minRating: 0,
  },
  location: '',
  showFilter: false,
};

// Simple test to avoid "must contain at least one test" error
describe('mockState', () => {
  it('should export a valid initial state', () => {
    expect(mockInitialState).toBeDefined();
    expect(mockInitialState.categories).toEqual([]);
    expect(mockInitialState.showFilter).toBe(false);
  });
});