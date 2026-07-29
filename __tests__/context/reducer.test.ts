import { appReducer, setSelectedBusiness, showBusinessModal, hideBusinessModal, setLastSearch, setLocation } from '../../context/reducer';
import { initialAppState } from '../../context/state';
import { ActionType } from '../../context/actions';
import { YelpBusiness } from '../../types/yelp';

describe('appReducer', () => {
  describe('initialState', () => {
    it('should include selectedBusiness as null', () => {
      expect(initialAppState.selectedBusiness).toBe(null);
    });

    it('should include isBusinessModalOpen as false', () => {
      expect(initialAppState.isBusinessModalOpen).toBe(false);
    });
  });

  describe('business modal actions', () => {
    const mockBusiness: YelpBusiness = {
      id: 'test-business-id',
      name: 'Test Restaurant',
      url: 'https://test.com',
      rating: 4.5,
      review_count: 100,
      price: '$$',
      categories: [{ alias: 'italian', title: 'Italian' }],
      image_url: 'https://test.com/image.jpg',
      distance: 500,
      phone: '+1234567890',
      display_phone: '(123) 456-7890',
      location: {
        display_address: ['123 Main St', 'City, ST 12345'],
        address1: '123 Main St'
      },
      hours: [],
      attributes: {}
    };

    it('should handle SET_SELECTED_BUSINESS action', () => {
      const action = setSelectedBusiness(mockBusiness);
      const newState = appReducer(initialAppState, action);

      expect(newState.selectedBusiness).toEqual(mockBusiness);
      expect(newState).not.toBe(initialAppState); // should return new state object
    });

    it('should handle SET_SELECTED_BUSINESS action with null', () => {
      const stateWithBusiness = {
        ...initialAppState,
        selectedBusiness: mockBusiness
      };
      
      const action = setSelectedBusiness(null);
      const newState = appReducer(stateWithBusiness, action);

      expect(newState.selectedBusiness).toBe(null);
    });

    it('should handle SHOW_BUSINESS_MODAL action', () => {
      const action = showBusinessModal();
      const newState = appReducer(initialAppState, action);

      expect(newState.isBusinessModalOpen).toBe(true);
      expect(newState).not.toBe(initialAppState);
    });

    it('should handle HIDE_BUSINESS_MODAL action', () => {
      const stateWithModalOpen = {
        ...initialAppState,
        isBusinessModalOpen: true
      };

      const action = hideBusinessModal();
      const newState = appReducer(stateWithModalOpen, action);

      expect(newState.isBusinessModalOpen).toBe(false);
    });

    it('should preserve other state properties when handling business modal actions', () => {
      const stateWithData = {
        ...initialAppState,
        location: 'Columbus, OH',
        results: []
      };

      const action = setSelectedBusiness(mockBusiness);
      const newState = appReducer(stateWithData, action);

      expect(newState.location).toBe('Columbus, OH');
      expect(newState.results).toEqual([]);
      expect(newState.selectedBusiness).toEqual(mockBusiness);
    });
  });

  describe('action type enums', () => {
    it('should have correct action type values', () => {
      expect(ActionType.SetSelectedBusiness).toBeDefined();
      expect(ActionType.ShowBusinessModal).toBeDefined();
      expect(ActionType.HideBusinessModal).toBeDefined();
    });
  });

  describe('setLastSearch (#58)', () => {
    it('defaults lastSearch to null', () => {
      expect(initialAppState.lastSearch).toBe(null);
    });

    it('stores the committed search identity', () => {
      const identity = { term: 'pizza', coords: { latitude: 39.96, longitude: -82.99 }, radiusMeters: 8047 };
      const newState = appReducer(initialAppState, setLastSearch(identity));
      expect(newState.lastSearch).toEqual(identity);
    });

    it('can clear the committed identity', () => {
      const seeded = appReducer(initialAppState, setLastSearch({ term: 'x', coords: null, radiusMeters: 1600 }));
      const cleared = appReducer(seeded, setLastSearch(null));
      expect(cleared.lastSearch).toBe(null);
    });

    it('clears lastSearch (and results) when a location change clears results', () => {
      const seeded = {
        ...initialAppState,
        location: 'Columbus, OH',
        results: [{ id: 'a' } as any],
        lastSearch: { term: 'pizza', coords: null, radiusMeters: 1600 },
      };
      const newState = appReducer(seeded, setLocation('Cleveland, OH'));
      expect(newState.results).toEqual([]);
      expect(newState.lastSearch).toBe(null);
    });

    it('preserves lastSearch when the location is unchanged', () => {
      const identity = { term: 'pizza', coords: null, radiusMeters: 1600 };
      const seeded = { ...initialAppState, location: 'Columbus, OH', lastSearch: identity };
      const newState = appReducer(seeded, setLocation('Columbus, OH'));
      expect(newState.lastSearch).toEqual(identity);
    });

    it('preserves results AND lastSearch on first-time label population (GPS-first flow)', () => {
      // Searched by GPS before the label resolved: lastSearch committed, location ''.
      // Reverse-geocode resolving ''→city is the same place — nothing is invalidated.
      const identity = { term: 'pizza', coords: { latitude: 40, longitude: -83 }, radiusMeters: 1600 };
      const seeded = {
        ...initialAppState,
        location: '',
        results: [{ id: 'a' } as any],
        lastSearch: identity,
      };
      const newState = appReducer(seeded, setLocation('Columbus, OH'));
      expect(newState.results).toEqual([{ id: 'a' }]);
      expect(newState.lastSearch).toEqual(identity);
    });
  });
});