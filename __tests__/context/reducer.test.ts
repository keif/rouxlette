import { appReducer, setSelectedBusiness, showBusinessModal, hideBusinessModal, setLastSearch, setLocation, requestSpin, setResults, addBlocked, removeBlocked, hydrateBlocked, toggleDealbreaker, hydrateDealbreakers } from '../../context/reducer';
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

  describe('winner modal actions (Spin Again / View All)', () => {
    it('showBusinessModal tags the source (spin winner vs plain detail)', () => {
      const spin = appReducer(initialAppState, showBusinessModal('spin'));
      expect(spin.isBusinessModalOpen).toBe(true);
      expect(spin.businessModalSource).toBe('spin');

      const detail = appReducer(initialAppState, showBusinessModal());
      expect(detail.isBusinessModalOpen).toBe(true);
      expect(detail.businessModalSource).toBe(null);
    });

    it('hideBusinessModal clears the source', () => {
      const open = appReducer(initialAppState, showBusinessModal('spin'));
      const closed = appReducer(open, hideBusinessModal());
      expect(closed.isBusinessModalOpen).toBe(false);
      expect(closed.businessModalSource).toBe(null);
    });

    it('requestSpin bumps spinRequestId', () => {
      const s1 = appReducer(initialAppState, requestSpin());
      expect(s1.spinRequestId).toBe(initialAppState.spinRequestId + 1);
      const s2 = appReducer(s1, requestSpin());
      expect(s2.spinRequestId).toBe(initialAppState.spinRequestId + 2);
    });
  });

  describe('blocked exclusion from visible results', () => {
    const biz = (id: string) => ({ id, name: id, distance: 100, rating: 4, categories: [] } as any);
    const [A, B, C] = [biz('a'), biz('b'), biz('c')];

    it('SetResults excludes blocked from results but keeps rawResults intact', () => {
      const state = { ...initialAppState, blocked: [{ id: 'b' } as any] };
      const next = appReducer(state, setResults([A, B, C]));
      expect(next.rawResults.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
      expect(next.results.map((r: any) => r.id)).toEqual(['a', 'c']);
    });

    it('AddBlocked removes the business from the visible list immediately', () => {
      const withResults = appReducer(initialAppState, setResults([A, B, C]));
      expect(withResults.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);

      const next = appReducer(withResults, addBlocked({ id: 'b' } as any));
      expect(next.results.map((r: any) => r.id)).toEqual(['a', 'c']);
      expect(next.rawResults.map((r: any) => r.id)).toEqual(['a', 'b', 'c']); // raw intact
    });

    it('RemoveBlocked brings the business back into the visible list', () => {
      const seeded = appReducer({ ...initialAppState, blocked: [{ id: 'b' } as any] }, setResults([A, B, C]));
      expect(seeded.results.map((r: any) => r.id)).toEqual(['a', 'c']);

      const next = appReducer(seeded, removeBlocked('b'));
      expect(next.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('HydrateBlocked re-filters results set before hydration completed', () => {
      // Results arrive first with an empty blocked list...
      const withResults = appReducer(initialAppState, setResults([A, B, C]));
      expect(withResults.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
      // ...then persisted blocks hydrate and must remove the matching business.
      const next = appReducer(withResults, hydrateBlocked([{ id: 'b' } as any]));
      expect(next.results.map((r: any) => r.id)).toEqual(['a', 'c']);
    });

    it('clears rawResults on a location change so blocking cannot revive stale results', () => {
      const searched = appReducer({ ...initialAppState, location: 'Columbus, OH' }, setResults([A, B, C]));
      const moved = appReducer(searched, setLocation('Cleveland, OH'));
      expect(moved.results).toEqual([]);
      expect(moved.rawResults).toEqual([]);
      // A later unblock must not repopulate the old city's results from stale raw.
      const afterUnblock = appReducer(moved, removeBlocked('b'));
      expect(afterUnblock.results).toEqual([]);
    });
  });

  describe('dealbreakers exclusion', () => {
    const biz = (id: string, cats: string[] = []) =>
      ({ id, name: id, distance: 100, rating: 4, categories: cats.map(a => ({ alias: a, title: a })) } as any);
    const [pizza, sushi, tacos] = [biz('a', ['pizza']), biz('b', ['sushi']), biz('c', ['tacos'])];

    it('excludes dealbreaker cuisines from results but keeps rawResults', () => {
      const seeded = { ...initialAppState, dealbreakerCategoryIds: ['sushi'] };
      const next = appReducer(seeded, setResults([pizza, sushi, tacos]));
      expect(next.results.map((r: any) => r.id)).toEqual(['a', 'c']);
      expect(next.rawResults.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('lets a per-search include override a dealbreaker for that search', () => {
      const seeded = { ...initialAppState, dealbreakerCategoryIds: ['sushi'], filters: { ...initialAppState.filters, categoryIds: ['sushi'] } };
      const next = appReducer(seeded, setResults([pizza, sushi, tacos]));
      expect(next.results.map((r: any) => r.id)).toEqual(['b']);
    });

    it('ToggleDealbreaker adds then removes and re-filters live', () => {
      const withResults = appReducer(initialAppState, setResults([pizza, sushi, tacos]));
      expect(withResults.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
      const added = appReducer(withResults, toggleDealbreaker('sushi'));
      expect(added.dealbreakerCategoryIds).toEqual(['sushi']);
      expect(added.results.map((r: any) => r.id)).toEqual(['a', 'c']);
      const removed = appReducer(added, toggleDealbreaker('sushi'));
      expect(removed.dealbreakerCategoryIds).toEqual([]);
      expect(removed.results.map((r: any) => r.id)).toEqual(['a', 'b', 'c']);
    });

    it('HydrateDealbreakers re-filters results set before hydration', () => {
      const withResults = appReducer(initialAppState, setResults([pizza, sushi, tacos]));
      const next = appReducer(withResults, hydrateDealbreakers(['pizza']));
      expect(next.results.map((r: any) => r.id)).toEqual(['b', 'c']);
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